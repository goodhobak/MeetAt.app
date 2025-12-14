# MeetAt.app - Data Schema

## Overview

This document defines the data models and storage schemas for MeetAt.app across different storage layers:
1. **LocalStorage** (MVP): Browser-based key-value storage
2. **IndexedDB** (Future): Browser-based structured storage
3. **PostgreSQL** (Future): Server-side relational database

---

## Core Data Models

### Event

The primary entity representing a scheduling event.

```typescript
interface Event {
  id: string;                    // 8-character unique identifier (e.g., "abc12345")
  name: string;                  // Event name (1-100 characters)
  duration: number;              // Expected duration in minutes (15-480)
  candidateDates: string[];      // Array of ISO date strings (e.g., ["2025-12-15", "2025-12-16"])
  timeRange: TimeRange;          // Time window for slots
  excludeLunch: boolean;         // Whether to exclude lunch hours
  lunchRange?: TimeRange;        // Lunch time range (if excludeLunch is true)
  passwordHash: string | null;   // SHA-256 hash (64 hex chars) or null
  createdAt: string;             // ISO timestamp of creation
  slots: TimeSlot[];             // Generated time slots
  votes: Vote[];                 // Participant votes
  requiredAttendees: string[];   // Names of required participants
  confirmed: ConfirmedTime | null; // Confirmed meeting time (if set)
}
```

**Example**
```json
{
  "id": "abc12345",
  "name": "Team Sprint Planning",
  "duration": 90,
  "candidateDates": ["2025-12-15", "2025-12-16"],
  "timeRange": {
    "start": "09:00",
    "end": "18:00"
  },
  "excludeLunch": true,
  "lunchRange": {
    "start": "12:00",
    "end": "13:00"
  },
  "passwordHash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "createdAt": "2025-12-14T10:30:00.000Z",
  "slots": [ /* ... */ ],
  "votes": [ /* ... */ ],
  "requiredAttendees": ["Alice", "Bob"],
  "confirmed": null
}
```

### TimeRange

Represents a time window (start and end times).

```typescript
interface TimeRange {
  start: string; // HH:mm format (e.g., "09:00")
  end: string;   // HH:mm format (e.g., "18:00")
}
```

### TimeSlot

Represents a specific date-time slot for voting.

```typescript
interface TimeSlot {
  id: string;   // Unique identifier: "{date}_{time}" (e.g., "2025-12-15_09:00")
  date: string; // ISO date string (e.g., "2025-12-15")
  time: string; // HH:mm format (e.g., "09:00")
}
```

**Generation Logic**
- Slots are generated at 30-minute intervals within the time range
- Lunch hours are excluded if `excludeLunch` is true
- Example: For `09:00-18:00` with lunch `12:00-13:00`, generate:
  - 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
  - *(skip 12:00-13:00)*
  - 13:00, 13:30, 14:00, ..., 17:30

### Vote

Represents a participant's availability.

```typescript
interface Vote {
  participantName: string;   // Participant's name (1-50 characters)
  selections: boolean[];     // Availability for each slot (parallel to Event.slots)
  submittedAt: string;       // ISO timestamp of submission
  updatedAt?: string;        // ISO timestamp of last update (if edited)
}
```

**Example**
```json
{
  "participantName": "Alice",
  "selections": [true, true, false, false, true, true, ...],
  "submittedAt": "2025-12-14T11:00:00.000Z",
  "updatedAt": "2025-12-14T15:30:00.000Z"
}
```

**Constraints**
- `selections.length` must equal `Event.slots.length`
- `participantName` must be unique within an event
- `selections[i]` corresponds to `Event.slots[i]`

### ConfirmedTime

Represents the final confirmed meeting time.

```typescript
interface ConfirmedTime {
  start: string;      // ISO datetime (e.g., "2025-12-15T14:00:00.000Z")
  end: string;        // ISO datetime (e.g., "2025-12-15T15:30:00.000Z")
  confirmedBy: string; // Organizer name (1-50 characters)
  confirmedAt: string; // ISO timestamp
  note?: string;      // Optional message (0-500 characters)
}
```

**Example**
```json
{
  "start": "2025-12-15T14:00:00.000Z",
  "end": "2025-12-15T15:30:00.000Z",
  "confirmedBy": "Charlie",
  "confirmedAt": "2025-12-14T16:00:00.000Z",
  "note": "Please join the Zoom link in the calendar invite."
}
```

---

## Storage Layer 1: LocalStorage (MVP)

### Storage Strategy

- **Key Format**: `event:{id}` (e.g., `event:abc12345`)
- **Value**: JSON-serialized `Event` object
- **Size Limit**: ~5 MB total across all origins (browser-dependent)
- **Estimated Capacity**: ~1000 events (assuming 5 KB per event)

### Operations

#### Create Event
```typescript
function saveEvent(event: Event): void {
  const key = `event:${event.id}`;
  const value = JSON.stringify(event);
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete old events.');
    }
    throw error;
  }
}
```

#### Read Event
```typescript
function getEvent(id: string): Event | null {
  const key = `event:${id}`;
  const value = localStorage.getItem(key);
  if (!value) return null;
  return JSON.parse(value) as Event;
}
```

#### Update Event
```typescript
function updateEvent(id: string, updates: Partial<Event>): Event {
  const event = getEvent(id);
  if (!event) throw new Error(`Event not found: ${id}`);

  const updatedEvent = { ...event, ...updates };
  saveEvent(updatedEvent);
  return updatedEvent;
}
```

#### Delete Event
```typescript
function deleteEvent(id: string): void {
  const key = `event:${id}`;
  localStorage.removeItem(key);
}
```

#### List All Events
```typescript
function listEvents(): Event[] {
  const events: Event[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('event:')) {
      const value = localStorage.getItem(key);
      if (value) {
        events.push(JSON.parse(value) as Event);
      }
    }
  }
  return events.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
```

### Auxiliary Storage

#### Lock State (Brute-Force Protection)
- **Key Format**: `lock:{eventId}`
- **Value**: JSON-serialized `LockState`

```typescript
interface LockState {
  eventId: string;
  attempts: number;        // Failed password attempts (0-5)
  lockedUntil: number | null; // Timestamp (ms) when lock expires, or null
}
```

**Example**
```json
{
  "eventId": "abc12345",
  "attempts": 3,
  "lockedUntil": null
}
```

#### User Preferences (Future)
- **Key**: `preferences`
- **Value**: JSON-serialized preferences

```typescript
interface Preferences {
  theme: 'light' | 'dark';
  defaultDuration: number;
  defaultTimeRange: TimeRange;
  excludeLunchDefault: boolean;
}
```

---

## Storage Layer 2: IndexedDB (Future)

### Database Schema

**Database Name**: `MeetAtDB`
**Version**: 1

### Object Stores

#### 1. Events
- **keyPath**: `id`
- **Indexes**:
  - `createdAt` (for sorting by creation date)
  - `name` (for search/autocomplete)

```typescript
// Create object store
const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
eventsStore.createIndex('createdAt', 'createdAt', { unique: false });
eventsStore.createIndex('name', 'name', { unique: false });
```

#### 2. Sync Queue (for offline-online sync)
- **keyPath**: `id` (auto-increment)
- **Indexes**: `eventId`, `timestamp`

```typescript
interface SyncQueueItem {
  id?: number;           // Auto-increment
  eventId: string;
  action: 'create' | 'update' | 'delete';
  data: Event | null;    // Event data (null for delete)
  timestamp: number;     // Unix timestamp (ms)
  synced: boolean;
}

const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
syncStore.createIndex('eventId', 'eventId', { unique: false });
syncStore.createIndex('timestamp', 'timestamp', { unique: false });
```

### Operations

#### Add Event
```typescript
async function addEventToIDB(event: Event): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('events', 'readwrite');
  await tx.objectStore('events').add(event);
  await tx.done;
}
```

#### Get Event
```typescript
async function getEventFromIDB(id: string): Promise<Event | undefined> {
  const db = await openDB();
  return db.get('events', id);
}
```

#### Query Events by Date
```typescript
async function getRecentEvents(limit: number): Promise<Event[]> {
  const db = await openDB();
  const tx = db.transaction('events', 'readonly');
  const index = tx.objectStore('events').index('createdAt');
  const events = await index.getAll(null, limit);
  return events.reverse(); // Newest first
}
```

---

## Storage Layer 3: PostgreSQL (Future)

### Database Schema

#### Table: `events`

```sql
CREATE TABLE events (
  id VARCHAR(8) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 15 AND duration <= 480),
  candidate_dates DATE[] NOT NULL,
  time_range_start TIME NOT NULL,
  time_range_end TIME NOT NULL,
  exclude_lunch BOOLEAN NOT NULL DEFAULT true,
  lunch_range_start TIME,
  lunch_range_end TIME,
  password_hash VARCHAR(64), -- SHA-256 hex
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  required_attendees TEXT[], -- Array of participant names
  confirmed_start TIMESTAMPTZ,
  confirmed_end TIMESTAMPTZ,
  confirmed_by VARCHAR(50),
  confirmed_at TIMESTAMPTZ,
  confirmed_note TEXT,
  CONSTRAINT valid_time_range CHECK (time_range_end > time_range_start),
  CONSTRAINT valid_lunch_range CHECK (
    (exclude_lunch = false) OR
    (lunch_range_start IS NOT NULL AND lunch_range_end IS NOT NULL AND lunch_range_end > lunch_range_start)
  )
);

CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_name ON events USING gin(to_tsvector('english', name)); -- Full-text search
```

#### Table: `time_slots`

```sql
CREATE TABLE time_slots (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(8) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slot_id VARCHAR(50) NOT NULL, -- "{date}_{time}"
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  UNIQUE(event_id, slot_id)
);

CREATE INDEX idx_time_slots_event_id ON time_slots(event_id);
```

#### Table: `votes`

```sql
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(8) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_name VARCHAR(50) NOT NULL,
  selections BOOLEAN[] NOT NULL, -- Array parallel to time_slots
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(event_id, participant_name)
);

CREATE INDEX idx_votes_event_id ON votes(event_id);
```

#### Table: `sync_log` (Conflict Resolution)

```sql
CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(8) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_id VARCHAR(36) NOT NULL, -- UUID of client device
  action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'vote'
  data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_sync_log_event_id ON sync_log(event_id);
CREATE INDEX idx_sync_log_timestamp ON sync_log(timestamp DESC);
```

### PostgreSQL Operations

#### Insert Event with Slots and Votes (Transaction)

```sql
BEGIN;

-- Insert event
INSERT INTO events (
  id, name, duration, candidate_dates, time_range_start, time_range_end,
  exclude_lunch, lunch_range_start, lunch_range_end, password_hash, required_attendees
) VALUES (
  'abc12345', 'Team Lunch', 60, ARRAY['2025-12-15', '2025-12-16']::DATE[],
  '09:00', '18:00', true, '12:00', '13:00', 'hash123...', ARRAY['Alice', 'Bob']::TEXT[]
);

-- Insert time slots
INSERT INTO time_slots (event_id, slot_id, slot_date, slot_time) VALUES
  ('abc12345', '2025-12-15_09:00', '2025-12-15', '09:00'),
  ('abc12345', '2025-12-15_09:30', '2025-12-15', '09:30'),
  -- ... more slots
  ('abc12345', '2025-12-16_17:30', '2025-12-16', '17:30');

COMMIT;
```

#### Insert/Update Vote (Upsert)

```sql
INSERT INTO votes (event_id, participant_name, selections, submitted_at)
VALUES ('abc12345', 'Alice', ARRAY[true, true, false, ...]::BOOLEAN[], NOW())
ON CONFLICT (event_id, participant_name)
DO UPDATE SET
  selections = EXCLUDED.selections,
  updated_at = NOW();
```

#### Get Event with Votes (Join Query)

```sql
SELECT
  e.*,
  json_agg(
    json_build_object(
      'participantName', v.participant_name,
      'selections', v.selections,
      'submittedAt', v.submitted_at,
      'updatedAt', v.updated_at
    )
  ) FILTER (WHERE v.id IS NOT NULL) AS votes
FROM events e
LEFT JOIN votes v ON e.id = v.event_id
WHERE e.id = 'abc12345'
GROUP BY e.id;
```

#### Get Available Time Slots (Aggregation)

```sql
SELECT
  ts.slot_id,
  ts.slot_date,
  ts.slot_time,
  COUNT(CASE WHEN v.selections[ts.row_num] = true THEN 1 END) AS available_count
FROM (
  SELECT
    slot_id,
    slot_date,
    slot_time,
    ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY slot_date, slot_time) AS row_num
  FROM time_slots
  WHERE event_id = 'abc12345'
) ts
LEFT JOIN votes v ON v.event_id = 'abc12345'
GROUP BY ts.slot_id, ts.slot_date, ts.slot_time, ts.row_num
ORDER BY ts.slot_date, ts.slot_time;
```

---

## Data Validation Rules

### Event Validation

```typescript
import { z } from 'zod';

const TimeRangeSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
}).refine(data => data.end > data.start, {
  message: "End time must be after start time"
});

const EventSchema = z.object({
  id: z.string().length(8).regex(/^[a-z0-9]+$/),
  name: z.string().min(1).max(100),
  duration: z.number().int().min(15).max(480).multipleOf(15),
  candidateDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(30),
  timeRange: TimeRangeSchema,
  excludeLunch: z.boolean(),
  lunchRange: TimeRangeSchema.optional(),
  passwordHash: z.string().length(64).regex(/^[a-f0-9]+$/).nullable(),
  createdAt: z.string().datetime(),
  slots: z.array(TimeSlotSchema),
  votes: z.array(VoteSchema),
  requiredAttendees: z.array(z.string().min(1).max(50)),
  confirmed: ConfirmedTimeSchema.nullable(),
}).refine(data => {
  if (data.excludeLunch && !data.lunchRange) {
    return false;
  }
  return true;
}, {
  message: "Lunch range is required when excludeLunch is true"
});
```

### Vote Validation

```typescript
const VoteSchema = z.object({
  participantName: z.string().min(1).max(50),
  selections: z.array(z.boolean()),
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

function validateVote(vote: Vote, event: Event): void {
  if (vote.selections.length !== event.slots.length) {
    throw new Error('Vote selections must match number of event slots');
  }

  const isDuplicate = event.votes.some(
    v => v.participantName.toLowerCase() === vote.participantName.toLowerCase()
  );
  if (isDuplicate) {
    throw new Error('Participant name already exists');
  }
}
```

---

## Migration Strategy (LocalStorage → PostgreSQL)

### Phase 1: Export from LocalStorage

```typescript
function exportEventsToJSON(): string {
  const events = listEvents(); // Get all events from LocalStorage
  return JSON.stringify(events, null, 2);
}
```

### Phase 2: Import to PostgreSQL

```typescript
async function importEventsToPostgreSQL(eventsJSON: string): Promise<void> {
  const events: Event[] = JSON.parse(eventsJSON);

  for (const event of events) {
    await db.transaction(async (tx) => {
      // Insert event
      await tx.query('INSERT INTO events (...) VALUES (...)', [event]);

      // Insert slots
      for (const slot of event.slots) {
        await tx.query('INSERT INTO time_slots (...) VALUES (...)', [slot]);
      }

      // Insert votes
      for (const vote of event.votes) {
        await tx.query('INSERT INTO votes (...) VALUES (...)', [vote]);
      }
    });
  }
}
```

---

## Sync Conflict Resolution

### Strategy: Last-Write-Wins (LWW)

When syncing between local and server:

1. **Compare Timestamps**: Use `createdAt`, `updatedAt`, `submittedAt`
2. **Server Wins for Event Metadata**: If server version is newer
3. **Merge Votes by Name**: Keep latest timestamp per participant
4. **Union Required Attendees**: Combine both sets (no duplicates)

### Example: Merge Votes

```typescript
function mergeVotes(localVotes: Vote[], serverVotes: Vote[]): Vote[] {
  const voteMap = new Map<string, Vote>();

  // Add all votes to map
  [...localVotes, ...serverVotes].forEach(vote => {
    const existing = voteMap.get(vote.participantName);
    if (!existing) {
      voteMap.set(vote.participantName, vote);
    } else {
      // Keep the newer one
      const existingTime = new Date(existing.updatedAt || existing.submittedAt).getTime();
      const newTime = new Date(vote.updatedAt || vote.submittedAt).getTime();
      if (newTime > existingTime) {
        voteMap.set(vote.participantName, vote);
      }
    }
  });

  return Array.from(voteMap.values());
}
```

---

## Data Size Estimates

### Single Event

**Assumptions**:
- 3 candidate dates
- 09:00-18:00 with 1-hour lunch (16 hours × 2 slots/hour = 32 slots per day)
- Total slots: 3 days × 32 slots = 96 slots
- 10 participants voting

**Storage Calculation**:
```typescript
// Event metadata
const metadataSize = JSON.stringify({
  id: "abc12345",
  name: "Team Meeting",
  duration: 60,
  // ... other fields
}).length; // ~500 bytes

// Slots
const slotsSize = JSON.stringify(event.slots).length; // ~4 KB (96 slots × ~40 bytes)

// Votes
const votesSize = JSON.stringify(event.votes).length; // ~3 KB (10 votes × ~300 bytes)

// Total
const totalSize = metadataSize + slotsSize + votesSize; // ~7.5 KB per event
```

### LocalStorage Capacity

- **Browser Limit**: ~5 MB (Chrome, Firefox, Safari)
- **Estimated Capacity**: ~650 events (5 MB / 7.5 KB)

### IndexedDB Capacity

- **Browser Limit**: ~50 MB - 1 GB (varies by browser and available disk space)
- **Estimated Capacity**: ~6,500 - 130,000 events

---

**Last Updated**: 2025-12-14
**Status**: Initial Draft
