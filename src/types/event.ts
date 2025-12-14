/**
 * Event-related TypeScript type definitions
 * Based on DATA_SCHEMA.md
 */

export interface TimeRange {
  start: string; // HH:mm format (e.g., "09:00")
  end: string; // HH:mm format (e.g., "18:00")
}

export interface TimeSlot {
  id: string; // Unique identifier: "{date}_{time}" (e.g., "2025-12-15_09:00")
  date: string; // ISO date string (e.g., "2025-12-15")
  time: string; // HH:mm format (e.g., "09:00")
}

export interface Vote {
  participantName: string; // Participant's name (1-50 characters)
  selections: boolean[]; // Availability for each slot (parallel to Event.slots)
  submittedAt: string; // ISO timestamp of submission
  updatedAt?: string; // ISO timestamp of last update (if edited)
}

export interface ConfirmedTime {
  start: string; // ISO datetime (e.g., "2025-12-15T14:00:00.000Z")
  end: string; // ISO datetime (e.g., "2025-12-15T15:30:00.000Z")
  confirmedBy: string; // Organizer name (1-50 characters)
  confirmedAt: string; // ISO timestamp
  note?: string; // Optional message (0-500 characters)
}

export interface Event {
  id: string; // 8-character unique identifier (e.g., "abc12345")
  name: string; // Event name (1-100 characters)
  duration: number; // Expected duration in minutes (15-480)
  candidateDates: string[]; // Array of ISO date strings (e.g., ["2025-12-15", "2025-12-16"])
  timeRange: TimeRange; // Time window for slots
  excludeLunch: boolean; // Whether to exclude lunch hours
  lunchRange?: TimeRange; // Lunch time range (if excludeLunch is true)
  passwordHash: string | null; // SHA-256 hash (64 hex chars) or null
  createdAt: string; // ISO timestamp of creation
  slots: TimeSlot[]; // Generated time slots
  votes: Vote[]; // Participant votes
  requiredAttendees: string[]; // Names of required participants
  confirmed: ConfirmedTime | null; // Confirmed meeting time (if set)
}

/**
 * Form data for creating an event (before processing)
 */
export interface EventFormData {
  name: string;
  duration: number;
  candidateDates: Date[];
  timeRange: TimeRange;
  excludeLunch: boolean;
  lunchRange?: TimeRange;
  password?: string;
}

/**
 * Lock state for brute-force protection
 */
export interface LockState {
  eventId: string;
  attempts: number; // Failed password attempts (0-5)
  lockedUntil: number | null; // Timestamp (ms) when lock expires, or null
}
