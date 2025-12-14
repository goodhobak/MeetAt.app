# MeetAt.app - Feature Specifications

## Overview

This document provides detailed specifications for all features in MeetAt.app, organized by functional requirements (FR) from the PRD.

---

## FR-001: Event Creation

### Feature Summary
Allow users to create new scheduling events with customizable parameters including event name, duration, candidate dates, time ranges, and lunch exclusion options.

### Acceptance Criteria
- [x] User can input event name, expected duration, candidate dates, time range, and exclude lunch option
- [x] Upon creation, an 8-character unique ID is generated and the event is saved to LocalStorage
- [x] After creation, user is redirected to `#/event/{id}` route

### User Stories

**US-001.1**: As an organizer, I want to create a new event so that I can coordinate meeting times with participants.

**US-001.2**: As an organizer, I want to set an expected duration so that the system can suggest continuous time blocks.

**US-001.3**: As an organizer, I want to select multiple candidate dates so that participants have flexibility.

**US-001.4**: As an organizer, I want to exclude lunch hours so that meetings aren't scheduled during typical lunch times.

### Detailed Specification

#### Input Fields

| Field | Type | Validation | Required | Default |
|-------|------|------------|----------|---------|
| Event Name | Text | 1-100 characters | Yes | - |
| Expected Duration | Number | 15-480 minutes (15min increments) | Yes | 60 |
| Candidate Dates | Date[] | Min 1 date, max 30 days | Yes | - |
| Time Range Start | Time | HH:mm format | Yes | 09:00 |
| Time Range End | Time | HH:mm format, must be after start | Yes | 18:00 |
| Exclude Lunch | Boolean | - | No | true |
| Lunch Time Range | Time Range | Only if Exclude Lunch = true | No | 12:00-13:00 |

#### Business Logic

**ID Generation**
```typescript
function generateEventId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  // Check for collision (very rare)
  if (localStorage.getItem(`event:${id}`)) {
    return generateEventId(); // Recursive retry
  }
  return id;
}
```

**Time Slot Generation**
```typescript
function generateTimeSlots(
  dates: Date[],
  startTime: string,
  endTime: string,
  duration: number,
  excludeLunch: boolean,
  lunchStart: string = '12:00',
  lunchEnd: string = '13:00'
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const interval = 30; // 30-minute granularity

  for (const date of dates) {
    let currentTime = parseTime(startTime);
    const endTimeMinutes = parseTime(endTime);

    while (currentTime < endTimeMinutes) {
      const slotTime = formatTime(currentTime);

      // Check if in lunch range
      if (excludeLunch) {
        const lunchStartMinutes = parseTime(lunchStart);
        const lunchEndMinutes = parseTime(lunchEnd);
        if (currentTime >= lunchStartMinutes && currentTime < lunchEndMinutes) {
          currentTime += interval;
          continue;
        }
      }

      slots.push({
        date: formatDate(date),
        time: slotTime,
        id: `${formatDate(date)}_${slotTime}`
      });

      currentTime += interval;
    }
  }

  return slots;
}
```

**Storage Schema**
```typescript
interface Event {
  id: string;
  name: string;
  duration: number;
  candidateDates: string[];
  timeRange: {
    start: string;
    end: string;
  };
  excludeLunch: boolean;
  lunchRange?: {
    start: string;
    end: string;
  };
  passwordHash: string | null;
  createdAt: string;
  slots: TimeSlot[];
  votes: Vote[];
  requiredAttendees: string[];
  confirmed: ConfirmedTime | null;
}
```

#### UI/UX Flow

1. **Initial State**: Show empty form with default values
2. **Date Selection**: Calendar widget with multi-select
3. **Time Range**: Dual time picker (start/end)
4. **Duration**: Dropdown or number input (15, 30, 60, 90, 120 minutes)
5. **Exclude Lunch**: Toggle switch with conditional lunch time inputs
6. **Validation**: Real-time validation with error messages
7. **Submit**: Show loading state → Generate ID → Save → Redirect

#### Error Handling

| Error | Message | Action |
|-------|---------|--------|
| Empty event name | "Event name is required" | Disable submit |
| Invalid duration | "Duration must be between 15 and 480 minutes" | Red border |
| No dates selected | "Please select at least one date" | Disable submit |
| End time before start | "End time must be after start time" | Inline error |
| LocalStorage full | "Storage quota exceeded. Please clear old events." | Show modal |

---

## FR-002: Password Protection

### Feature Summary
Optional password protection for events using SHA-256 hashing with brute-force prevention.

### Acceptance Criteria
- [x] Password input is optional during event creation
- [x] Passwords are hashed with SHA-256 before storage
- [x] Lock screen appears when accessing password-protected events
- [x] Correct password grants access; incorrect password shows error

### User Stories

**US-002.1**: As an organizer, I want to set a password so that only invited participants can access the event.

**US-002.2**: As a participant, I want to enter a password so that I can access a protected event.

### Detailed Specification

#### Password Input

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Password | Password | Min 6 characters, max 100 | No |
| Confirm Password | Password | Must match Password | Only if password set |

#### Security Implementation

**Hashing Function**
```typescript
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Verification**
```typescript
async function verifyPassword(input: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(input);
  return inputHash === storedHash;
}
```

**Brute-Force Protection**
```typescript
interface LockState {
  eventId: string;
  attempts: number;
  lockedUntil: number | null;
}

function checkLockState(eventId: string): LockState {
  const stored = localStorage.getItem(`lock:${eventId}`);
  if (!stored) {
    return { eventId, attempts: 0, lockedUntil: null };
  }
  return JSON.parse(stored);
}

function recordFailedAttempt(eventId: string): LockState {
  const lockState = checkLockState(eventId);
  lockState.attempts += 1;

  if (lockState.attempts >= 5) {
    lockState.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  }

  localStorage.setItem(`lock:${eventId}`, JSON.stringify(lockState));
  return lockState;
}

function isLocked(eventId: string): boolean {
  const lockState = checkLockState(eventId);
  if (lockState.lockedUntil && Date.now() < lockState.lockedUntil) {
    return true;
  }
  // Clear expired lock
  if (lockState.lockedUntil && Date.now() >= lockState.lockedUntil) {
    localStorage.removeItem(`lock:${eventId}`);
  }
  return false;
}
```

#### UI/UX Flow

**Creation Flow**
1. Show "Password Protection (Optional)" section
2. Toggle to enable password input
3. Show password + confirm password fields
4. Real-time validation for match
5. On submit, hash password before saving

**Access Flow**
1. Load event metadata (check if `passwordHash` exists)
2. If protected, show lock screen overlay
3. Display password input field
4. On submit:
   - Check if locked (show countdown if locked)
   - Hash input password
   - Compare with stored hash
   - If match: hide lock screen, show event
   - If no match: increment attempts, show error
5. After 5 failed attempts: show 30-minute lockout message

#### Lock Screen UI

```tsx
<LockScreen>
  <LockIcon />
  <h2>This event is password protected</h2>
  <p>Enter the password to continue</p>
  <form onSubmit={handlePasswordSubmit}>
    <input type="password" placeholder="Enter password" />
    <button type="submit">Unlock</button>
  </form>
  {error && <ErrorMessage>Incorrect password ({5 - attempts} attempts remaining)</ErrorMessage>}
  {locked && <LockedMessage>Too many attempts. Try again in {countdown}</LockedMessage>}
</LockScreen>
```

---

## FR-003: URL-based Sharing

### Feature Summary
Share events via URL with 8-character ID, auto-generated QR codes, and clipboard copy functionality.

### Acceptance Criteria
- [x] Shareable URL is provided after event creation
- [x] QR code is auto-generated and can be downloaded or displayed
- [x] Clipboard copy button copies URL with success notification

### User Stories

**US-003.1**: As an organizer, I want to share a URL so that participants can access the event.

**US-003.2**: As an organizer, I want to display a QR code so that participants can scan it with their phones.

**US-003.3**: As a participant, I want to copy the event URL so that I can share it with others.

### Detailed Specification

#### URL Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `#/` | Homepage (create event) | Public |
| `#/event/{id}` | Event overview (redirects to /vote) | Public/Protected |
| `#/event/{id}/vote` | Voting interface | Public/Protected |
| `#/event/{id}/results` | Results visualization | Public/Protected |

#### QR Code Generation

**Library**: `qrcode.react` or `qrcode` (vanilla JS)

```typescript
import QRCode from 'qrcode';

async function generateQRCode(url: string): Promise<string> {
  try {
    // Generate data URL (base64 PNG)
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR generation failed:', error);
    throw error;
  }
}
```

#### Clipboard Copy

```typescript
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
}
```

#### UI Components

**Share Panel**
```tsx
<SharePanel eventId={eventId}>
  <div className="share-links">
    <h3>Share this event</h3>
    <div className="url-display">
      <input readOnly value={shareUrl} />
      <button onClick={handleCopy}>
        <CopyIcon />
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
    <button onClick={handleShowQR}>
      <QRIcon />
      Show QR Code
    </button>
  </div>
</SharePanel>
```

**QR Code Modal**
```tsx
<Modal open={showQR} onClose={handleClose}>
  <h2>Scan to access event</h2>
  <img src={qrDataUrl} alt="Event QR Code" />
  <button onClick={handleDownloadQR}>Download QR Code</button>
</Modal>
```

#### Download QR Code

```typescript
function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}-qr.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

## FR-004: Time Voting

### Feature Summary
Participants can vote on available time slots with individual toggle, bulk selection, duplicate prevention, and vote editing.

### Acceptance Criteria
- [x] Participants can toggle individual time slots
- [x] Bulk selection (All, Morning, Afternoon) and Reset work correctly
- [x] Duplicate participant names show warning and prevent duplicate votes
- [x] Participants can edit and delete their votes

### User Stories

**US-004.1**: As a participant, I want to select my available times so that the organizer knows when I'm free.

**US-004.2**: As a participant, I want to quickly select all morning slots so that I don't have to click each one individually.

**US-004.3**: As a participant, I want to edit my vote so that I can update my availability.

### Detailed Specification

#### Vote Interface Components

**Time Slot Grid**
- Rows: Time slots (30-minute intervals)
- Columns: Candidate dates
- Cells: Clickable toggles (available/unavailable)
- Visual states:
  - Available (selected): Green background
  - Unavailable (default): Gray/white background
  - Hover: Highlight border

**Bulk Selection Buttons**
- **Select All**: Mark all slots as available
- **Select Morning**: Mark slots before 12:00 as available
- **Select Afternoon**: Mark slots from 13:00 onwards as available
- **Reset**: Clear all selections

**Participant Form**
- Name input (required)
- Submit button
- "Next Participant" button (after submission)
- Edit/Delete buttons (for existing votes)

#### Vote Data Structure

```typescript
interface Vote {
  participantName: string;
  selections: boolean[]; // Parallel array to event.slots
  submittedAt: string;   // ISO timestamp
  updatedAt?: string;    // ISO timestamp (if edited)
}
```

#### Business Logic

**Duplicate Name Check**
```typescript
function checkDuplicateName(event: Event, name: string): boolean {
  return event.votes.some(vote =>
    vote.participantName.toLowerCase() === name.toLowerCase()
  );
}
```

**Submit Vote**
```typescript
function submitVote(event: Event, vote: Vote): Event {
  // Check for duplicate
  if (checkDuplicateName(event, vote.participantName)) {
    throw new Error('A participant with this name has already voted');
  }

  // Add vote
  const updatedEvent = {
    ...event,
    votes: [...event.votes, vote]
  };

  // Save to storage
  saveEvent(updatedEvent);
  return updatedEvent;
}
```

**Edit Vote**
```typescript
function updateVote(event: Event, participantName: string, newSelections: boolean[]): Event {
  const updatedVotes = event.votes.map(vote =>
    vote.participantName === participantName
      ? { ...vote, selections: newSelections, updatedAt: new Date().toISOString() }
      : vote
  );

  const updatedEvent = { ...event, votes: updatedVotes };
  saveEvent(updatedEvent);
  return updatedEvent;
}
```

**Delete Vote**
```typescript
function deleteVote(event: Event, participantName: string): Event {
  const updatedEvent = {
    ...event,
    votes: event.votes.filter(vote => vote.participantName !== participantName)
  };
  saveEvent(updatedEvent);
  return updatedEvent;
}
```

#### UI/UX Flow

**Initial Vote Flow**
1. Load event and display time slot grid
2. Participant enters name
3. Participant clicks slots to toggle availability
4. Optional: Use bulk selection buttons
5. Click "Submit Vote"
6. Validate name (not empty, not duplicate)
7. Save vote to event
8. Show success message
9. Show "Next Participant" button or "View Results"

**Edit Vote Flow**
1. Display list of participants below grid
2. Participant finds their name and clicks "Edit"
3. Grid pre-fills with their selections
4. Participant modifies selections
5. Click "Update Vote"
6. Save updated vote
7. Show success message

**Delete Vote Flow**
1. Participant clicks "Delete" next to their name
2. Show confirmation modal
3. On confirm, remove vote from event
4. Update storage
5. Show success message

#### Error Handling

| Error | Message | Action |
|-------|---------|--------|
| Empty name | "Please enter your name" | Disable submit |
| Duplicate name | "This name is already taken. Please use a different name or edit your existing vote." | Show modal with "Edit existing" option |
| No selections | "Please select at least one time slot" | Warning (allow submission anyway) |
| Storage error | "Failed to save vote. Please try again." | Toast error |

---

## FR-005: Results Visualization

### Feature Summary
Display voting results as an interactive heatmap and timeline with zoom, filtering, and hover details.

### Acceptance Criteria
- [x] Heatmap displays availability count per time slot with color gradient
- [x] Heatmap supports zoom in/out (time period expansion/contraction)
- [x] Timeline shows optimal time blocks as bar chart
- [x] Hover on timeline shows detailed time and participant list

### User Stories

**US-005.1**: As an organizer, I want to see a heatmap so that I can quickly identify popular time slots.

**US-005.2**: As an organizer, I want to zoom in on specific dates so that I can focus on relevant time periods.

**US-005.3**: As an organizer, I want to see continuous time blocks so that I can find times that fit the event duration.

### Detailed Specification

#### Heatmap Component

**Data Aggregation**
```typescript
function aggregateVotes(event: Event): Map<string, number> {
  const availability = new Map<string, number>();

  // Initialize all slots with 0
  event.slots.forEach(slot => {
    availability.set(slot.id, 0);
  });

  // Count votes per slot
  event.votes.forEach(vote => {
    vote.selections.forEach((isAvailable, index) => {
      if (isAvailable) {
        const slotId = event.slots[index].id;
        availability.set(slotId, (availability.get(slotId) || 0) + 1);
      }
    });
  });

  return availability;
}
```

**Color Scale**
```typescript
function getHeatmapColor(count: number, maxCount: number): string {
  if (count === 0) return '#f3f4f6'; // gray-100
  const intensity = count / maxCount;

  // Green gradient
  if (intensity < 0.25) return '#bbf7d0'; // green-200
  if (intensity < 0.5) return '#86efac';  // green-300
  if (intensity < 0.75) return '#4ade80'; // green-400
  return '#22c55e'; // green-500
}
```

**Zoom Implementation**
```typescript
interface ZoomState {
  dateRange: [Date, Date]; // Visible date range
  granularity: 'day' | 'week' | 'all';
}

function zoomIn(state: ZoomState, dates: Date[]): ZoomState {
  // Reduce visible range
  if (state.granularity === 'all' && dates.length > 7) {
    return { dateRange: [dates[0], dates[6]], granularity: 'week' };
  }
  if (state.granularity === 'week' && dates.length > 1) {
    return { dateRange: [dates[0], dates[0]], granularity: 'day' };
  }
  return state; // Already at max zoom
}

function zoomOut(state: ZoomState, allDates: Date[]): ZoomState {
  if (state.granularity === 'day') {
    return { dateRange: [allDates[0], allDates[Math.min(6, allDates.length - 1)]], granularity: 'week' };
  }
  if (state.granularity === 'week') {
    return { dateRange: [allDates[0], allDates[allDates.length - 1]], granularity: 'all' };
  }
  return state; // Already at min zoom
}
```

**Heatmap UI**
```tsx
<HeatmapContainer>
  <ZoomControls>
    <button onClick={handleZoomIn}>Zoom In</button>
    <button onClick={handleZoomOut}>Zoom Out</button>
    <span>{zoomState.granularity}</span>
  </ZoomControls>
  <HeatmapGrid>
    {visibleSlots.map(slot => {
      const count = availability.get(slot.id) || 0;
      const color = getHeatmapColor(count, maxCount);
      return (
        <HeatmapCell
          key={slot.id}
          style={{ backgroundColor: color }}
          onMouseEnter={() => showTooltip(slot, count)}
          onMouseLeave={hideTooltip}
        >
          {count > 0 && count}
        </HeatmapCell>
      );
    })}
  </HeatmapGrid>
  {tooltip && (
    <Tooltip position={tooltip.position}>
      <strong>{tooltip.slot.date} {tooltip.slot.time}</strong>
      <p>{tooltip.count} participants available</p>
      <ul>
        {tooltip.participants.map(name => <li key={name}>{name}</li>)}
      </ul>
    </Tooltip>
  )}
</HeatmapContainer>
```

#### Timeline Component

**Continuous Block Calculation**
```typescript
interface TimeBlock {
  start: TimeSlot;
  end: TimeSlot;
  duration: number; // minutes
  availableCount: number;
  participants: string[];
}

function findContinuousBlocks(
  event: Event,
  availability: Map<string, number>,
  requiredDuration: number
): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const sortedSlots = [...event.slots].sort((a, b) =>
    new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
  );

  let currentBlock: TimeBlock | null = null;

  for (let i = 0; i < sortedSlots.length; i++) {
    const slot = sortedSlots[i];
    const count = availability.get(slot.id) || 0;

    if (count === 0) {
      // Gap in availability
      if (currentBlock && currentBlock.duration >= requiredDuration) {
        blocks.push(currentBlock);
      }
      currentBlock = null;
      continue;
    }

    const slotTime = new Date(`${slot.date}T${slot.time}`);
    const nextSlot = sortedSlots[i + 1];
    const isContiguous = nextSlot &&
      (new Date(`${nextSlot.date}T${nextSlot.time}`).getTime() - slotTime.getTime()) === 30 * 60 * 1000;

    if (!currentBlock) {
      // Start new block
      currentBlock = {
        start: slot,
        end: slot,
        duration: 30,
        availableCount: count,
        participants: getParticipantsForSlot(event, slot.id)
      };
    } else if (isContiguous) {
      // Extend current block
      currentBlock.end = slot;
      currentBlock.duration += 30;
      // Take minimum count in the block
      currentBlock.availableCount = Math.min(currentBlock.availableCount, count);
    } else {
      // Non-contiguous, save current block and start new
      if (currentBlock.duration >= requiredDuration) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        start: slot,
        end: slot,
        duration: 30,
        availableCount: count,
        participants: getParticipantsForSlot(event, slot.id)
      };
    }
  }

  // Don't forget the last block
  if (currentBlock && currentBlock.duration >= requiredDuration) {
    blocks.push(currentBlock);
  }

  return blocks.sort((a, b) => b.availableCount - a.availableCount);
}
```

**Timeline UI**
```tsx
<TimelineContainer>
  <h3>Optimal Time Blocks ({event.duration} min required)</h3>
  <TimelineChart>
    {blocks.map((block, index) => (
      <TimeBar
        key={index}
        height={`${(block.availableCount / maxCount) * 100}%`}
        onClick={() => handleConfirm(block)}
        onMouseEnter={() => showBlockTooltip(block)}
        onMouseLeave={hideTooltip}
      >
        <span>{block.availableCount}</span>
      </TimeBar>
    ))}
  </TimelineChart>
  {blockTooltip && (
    <Tooltip>
      <strong>{formatBlockTime(blockTooltip.start, blockTooltip.end)}</strong>
      <p>Duration: {blockTooltip.duration} minutes</p>
      <p>{blockTooltip.availableCount} participants available:</p>
      <ul>
        {blockTooltip.participants.map(name => <li key={name}>{name}</li>)}
      </ul>
      <button onClick={() => handleConfirm(blockTooltip)}>Confirm This Time</button>
    </Tooltip>
  )}
</TimelineContainer>
```

---

## FR-006: Required Participants

### Feature Summary
Designate specific participants as required and filter results to show only times when all required participants are available.

### Acceptance Criteria
- [x] Each participant can be toggled as required (⭐ icon)
- [x] When required participants are set, results filter to show only slots where all are available

### User Stories

**US-006.1**: As an organizer, I want to mark certain participants as required so that the meeting time accommodates key attendees.

**US-006.2**: As an organizer, I want to see only times when all required participants are free so that I can ensure critical people can attend.

### Detailed Specification

#### Required Participant Toggle

**Data Structure**
```typescript
interface Event {
  // ... other fields
  requiredAttendees: string[]; // Participant names marked as required
}
```

**Toggle Logic**
```typescript
function toggleRequiredAttendee(event: Event, participantName: string): Event {
  const isRequired = event.requiredAttendees.includes(participantName);

  const updatedRequired = isRequired
    ? event.requiredAttendees.filter(name => name !== participantName)
    : [...event.requiredAttendees, participantName];

  const updatedEvent = { ...event, requiredAttendees: updatedRequired };
  saveEvent(updatedEvent);
  return updatedEvent;
}
```

#### Filtering Logic

**Filter Availability**
```typescript
function filterByRequiredAttendees(
  event: Event,
  availability: Map<string, number>
): Map<string, number> {
  if (event.requiredAttendees.length === 0) {
    return availability; // No filtering needed
  }

  const filtered = new Map<string, number>();

  event.slots.forEach(slot => {
    const allRequiredAvailable = event.requiredAttendees.every(requiredName => {
      const vote = event.votes.find(v => v.participantName === requiredName);
      if (!vote) return false;

      const slotIndex = event.slots.findIndex(s => s.id === slot.id);
      return vote.selections[slotIndex];
    });

    if (allRequiredAvailable) {
      filtered.set(slot.id, availability.get(slot.id) || 0);
    } else {
      filtered.set(slot.id, 0); // Mark as unavailable
    }
  });

  return filtered;
}
```

#### UI Implementation

**Participant List**
```tsx
<ParticipantList>
  <h3>Participants ({event.votes.length})</h3>
  {event.votes.map(vote => {
    const isRequired = event.requiredAttendees.includes(vote.participantName);
    return (
      <ParticipantItem key={vote.participantName}>
        <span>{vote.participantName}</span>
        <button
          onClick={() => handleToggleRequired(vote.participantName)}
          className={isRequired ? 'active' : ''}
          aria-label={isRequired ? 'Remove from required' : 'Mark as required'}
        >
          {isRequired ? '⭐' : '☆'}
        </button>
      </ParticipantItem>
    );
  })}
</ParticipantList>
```

**Filter Indicator**
```tsx
{event.requiredAttendees.length > 0 && (
  <FilterBadge>
    Showing times for {event.requiredAttendees.length} required participant{event.requiredAttendees.length > 1 ? 's' : ''}
    <button onClick={handleClearRequired}>Clear filter</button>
  </FilterBadge>
)}
```

---

## FR-007: Time Confirmation

### Feature Summary
Organizers can select and confirm a final meeting time from the timeline, which is then visually highlighted.

### Acceptance Criteria
- [x] Organizers can select a time block (matching event duration) from the timeline
- [x] Confirmed time is visually highlighted in results view

### User Stories

**US-007.1**: As an organizer, I want to confirm the final meeting time so that participants know the decision.

**US-007.2**: As a participant, I want to see the confirmed time clearly so that I know when to attend.

### Detailed Specification

#### Confirmation Data Structure

```typescript
interface ConfirmedTime {
  start: string;      // ISO datetime
  end: string;        // ISO datetime
  confirmedBy: string; // Organizer name
  confirmedAt: string; // ISO timestamp
  note?: string;      // Optional message
}

interface Event {
  // ... other fields
  confirmed: ConfirmedTime | null;
}
```

#### Confirmation Flow

**Confirmation Logic**
```typescript
function confirmTime(
  event: Event,
  block: TimeBlock,
  organizerName: string,
  note?: string
): Event {
  const startDateTime = new Date(`${block.start.date}T${block.start.time}`);
  const endDateTime = new Date(startDateTime.getTime() + block.duration * 60 * 1000);

  const confirmed: ConfirmedTime = {
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString(),
    confirmedBy: organizerName,
    confirmedAt: new Date().toISOString(),
    note
  };

  const updatedEvent = { ...event, confirmed };
  saveEvent(updatedEvent);
  return updatedEvent;
}
```

**Un-confirm (Edit)**
```typescript
function unconfirmTime(event: Event): Event {
  const updatedEvent = { ...event, confirmed: null };
  saveEvent(updatedEvent);
  return updatedEvent;
}
```

#### UI Implementation

**Confirmation Modal**
```tsx
<ConfirmationModal open={showModal} onClose={handleClose}>
  <h2>Confirm Meeting Time</h2>
  <div className="time-summary">
    <p><strong>Date:</strong> {formatDate(block.start.date)}</p>
    <p><strong>Time:</strong> {block.start.time} - {block.end.time}</p>
    <p><strong>Duration:</strong> {block.duration} minutes</p>
    <p><strong>Available:</strong> {block.availableCount} participants</p>
  </div>
  <form onSubmit={handleConfirm}>
    <label>
      Your Name (Organizer)
      <input type="text" name="organizerName" required />
    </label>
    <label>
      Optional Note
      <textarea name="note" placeholder="Add a message for participants..." />
    </label>
    <div className="actions">
      <button type="button" onClick={handleClose}>Cancel</button>
      <button type="submit">Confirm Time</button>
    </div>
  </form>
</ConfirmationModal>
```

**Confirmed Time Display**
```tsx
{event.confirmed && (
  <ConfirmedBanner>
    <h2>✅ Meeting Time Confirmed</h2>
    <div className="confirmed-details">
      <p><strong>When:</strong> {formatDateTime(event.confirmed.start)}</p>
      <p><strong>Duration:</strong> {event.duration} minutes</p>
      {event.confirmed.note && <p><strong>Note:</strong> {event.confirmed.note}</p>}
      <p className="meta">Confirmed by {event.confirmed.confirmedBy} on {formatDate(event.confirmed.confirmedAt)}</p>
    </div>
    <button onClick={handleUnconfirm}>Edit Confirmation</button>
  </ConfirmedBanner>
)}
```

**Visual Highlight in Heatmap/Timeline**
```tsx
// Heatmap: Add border/glow to confirmed slots
<HeatmapCell
  className={isInConfirmedRange(slot, event.confirmed) ? 'confirmed' : ''}
  style={{
    backgroundColor: color,
    border: isInConfirmedRange(slot, event.confirmed) ? '3px solid gold' : undefined,
    boxShadow: isInConfirmedRange(slot, event.confirmed) ? '0 0 10px gold' : undefined
  }}
/>

// Timeline: Highlight confirmed block
<TimeBar
  className={isConfirmedBlock(block, event.confirmed) ? 'confirmed' : ''}
  style={{
    backgroundColor: isConfirmedBlock(block, event.confirmed) ? 'gold' : 'blue'
  }}
/>
```

---

## Cross-Cutting Concerns

### Responsive Design

All features must work across:
- **Mobile**: 320px - 767px (portrait phones)
- **Tablet**: 768px - 1023px (tablets, landscape phones)
- **Desktop**: 1024px+ (laptops, desktops)

**Breakpoints (Tailwind)**
```css
/* Mobile-first approach */
.grid { grid-template-columns: 1fr; } /* Default: mobile */
@media (min-width: 768px) { .grid { grid-template-columns: repeat(3, 1fr); } } /* Tablet */
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(7, 1fr); } } /* Desktop */
```

### Accessibility (WCAG 2.1 AA)

- **Keyboard Navigation**: All interactive elements accessible via Tab/Enter
- **ARIA Labels**: Proper labels for icon buttons, form fields
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- **Screen Reader**: Announce vote updates, errors, confirmations

### Performance Targets

- **Time to Interactive**: < 2 seconds on 3G
- **First Contentful Paint**: < 1 second
- **Bundle Size**: < 200 KB (gzipped)
- **Heatmap Render**: < 100ms for 500 slots

---

**Last Updated**: 2025-12-14
**Status**: Initial Draft
