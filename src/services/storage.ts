/**
 * Storage service for LocalStorage operations
 * Based on DATA_SCHEMA.md - LocalStorage Layer
 */

import type { Event, LockState } from '@/types';
import { validateEvent } from './validation';

const EVENT_KEY_PREFIX = 'event:';
const LOCK_KEY_PREFIX = 'lock:';

/**
 * Error thrown when storage quota is exceeded
 */
export class StorageQuotaError extends Error {
  constructor(message = 'Storage quota exceeded. Please delete old events.') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

/**
 * Error thrown when event is not found
 */
export class EventNotFoundError extends Error {
  constructor(id: string) {
    super(`Event not found: ${id}`);
    this.name = 'EventNotFoundError';
  }
}

/**
 * Save event to LocalStorage
 *
 * @throws {StorageQuotaError} If storage quota is exceeded
 */
export function saveEvent(event: Event): void {
  const key = `${EVENT_KEY_PREFIX}${event.id}`;
  const value = JSON.stringify(event);

  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageQuotaError();
    }
    throw error;
  }
}

/**
 * Get event from LocalStorage
 *
 * @throws {EventNotFoundError} If event is not found
 */
export function getEvent(id: string): Event {
  const key = `${EVENT_KEY_PREFIX}${id}`;
  const value = localStorage.getItem(key);

  if (!value) {
    throw new EventNotFoundError(id);
  }

  try {
    const event = JSON.parse(value) as Event;
    // Validate the event data
    validateEvent(event);
    return event;
  } catch (error) {
    console.error('Failed to parse event:', error);
    throw new Error(`Invalid event data for ${id}`);
  }
}

/**
 * Update event in LocalStorage
 *
 * @throws {EventNotFoundError} If event is not found
 */
export function updateEvent(id: string, updates: Partial<Event>): Event {
  const event = getEvent(id);
  const updatedEvent = { ...event, ...updates };
  saveEvent(updatedEvent);
  return updatedEvent;
}

/**
 * Delete event from LocalStorage
 */
export function deleteEvent(id: string): void {
  const key = `${EVENT_KEY_PREFIX}${id}`;
  localStorage.removeItem(key);

  // Also delete lock state if exists
  const lockKey = `${LOCK_KEY_PREFIX}${id}`;
  localStorage.removeItem(lockKey);
}

/**
 * List all events from LocalStorage
 */
export function listEvents(): Event[] {
  const events: Event[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(EVENT_KEY_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const event = JSON.parse(value) as Event;
          events.push(event);
        } catch (error) {
          console.error(`Failed to parse event from key ${key}:`, error);
        }
      }
    }
  }

  // Sort by creation date (newest first)
  return events.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Check if event exists
 */
export function eventExists(id: string): boolean {
  const key = `${EVENT_KEY_PREFIX}${id}`;
  return localStorage.getItem(key) !== null;
}

// ============ Lock State Operations ============

/**
 * Get lock state for an event
 */
export function getLockState(eventId: string): LockState {
  const key = `${LOCK_KEY_PREFIX}${eventId}`;
  const value = localStorage.getItem(key);

  if (!value) {
    return {
      eventId,
      attempts: 0,
      lockedUntil: null,
    };
  }

  try {
    return JSON.parse(value) as LockState;
  } catch (error) {
    console.error('Failed to parse lock state:', error);
    return {
      eventId,
      attempts: 0,
      lockedUntil: null,
    };
  }
}

/**
 * Save lock state
 */
export function saveLockState(lockState: LockState): void {
  const key = `${LOCK_KEY_PREFIX}${lockState.eventId}`;
  const value = JSON.stringify(lockState);
  localStorage.setItem(key, value);
}

/**
 * Check if event is currently locked
 */
export function isEventLocked(eventId: string): boolean {
  const lockState = getLockState(eventId);

  if (lockState.lockedUntil && Date.now() < lockState.lockedUntil) {
    return true;
  }

  // Clear expired lock
  if (lockState.lockedUntil && Date.now() >= lockState.lockedUntil) {
    const key = `${LOCK_KEY_PREFIX}${eventId}`;
    localStorage.removeItem(key);
  }

  return false;
}

/**
 * Record a failed password attempt
 *
 * @returns Updated lock state
 */
export function recordFailedAttempt(eventId: string): LockState {
  const lockState = getLockState(eventId);
  lockState.attempts += 1;

  // Lock for 30 minutes after 5 failed attempts
  if (lockState.attempts >= 5) {
    lockState.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  }

  saveLockState(lockState);
  return lockState;
}

/**
 * Clear lock state (on successful password entry)
 */
export function clearLockState(eventId: string): void {
  const key = `${LOCK_KEY_PREFIX}${eventId}`;
  localStorage.removeItem(key);
}

/**
 * Get remaining lockout time in milliseconds
 */
export function getRemainingLockoutTime(eventId: string): number {
  const lockState = getLockState(eventId);

  if (!lockState.lockedUntil) {
    return 0;
  }

  const remaining = lockState.lockedUntil - Date.now();
  return Math.max(0, remaining);
}

// ============ Vote Operations ============

/**
 * Check if a participant name is already used
 */
export function checkDuplicateParticipant(event: Event, participantName: string): boolean {
  return event.votes.some(
    (vote) => vote.participantName.toLowerCase() === participantName.toLowerCase()
  );
}

/**
 * Submit a new vote
 *
 * @throws Error if participant name is duplicate
 */
export function submitVote(eventId: string, vote: Vote): Event {
  const event = getEvent(eventId);

  // Check for duplicate name
  if (checkDuplicateParticipant(event, vote.participantName)) {
    throw new Error(
      'A participant with this name has already voted. Please use a different name or edit your existing vote.'
    );
  }

  // Add vote to event
  const updatedEvent: Event = {
    ...event,
    votes: [...event.votes, vote],
  };

  // Save to storage
  saveEvent(updatedEvent);
  return updatedEvent;
}

/**
 * Update an existing vote
 */
export function updateVote(
  eventId: string,
  participantName: string,
  newSelections: boolean[]
): Event {
  const event = getEvent(eventId);

  // Find and update the vote
  const updatedVotes = event.votes.map((vote) =>
    vote.participantName === participantName
      ? {
          ...vote,
          selections: newSelections,
          updatedAt: new Date().toISOString(),
        }
      : vote
  );

  const updatedEvent: Event = {
    ...event,
    votes: updatedVotes,
  };

  saveEvent(updatedEvent);
  return updatedEvent;
}

/**
 * Delete a vote
 */
export function deleteVote(eventId: string, participantName: string): Event {
  const event = getEvent(eventId);

  // Remove the vote
  const updatedEvent: Event = {
    ...event,
    votes: event.votes.filter((vote) => vote.participantName !== participantName),
  };

  saveEvent(updatedEvent);
  return updatedEvent;
}

/**
 * Get a specific vote by participant name
 */
export function getVote(event: Event, participantName: string): Vote | undefined {
  return event.votes.find((vote) => vote.participantName === participantName);
}

// ============ Required Attendees Operations ============

/**
 * Toggle a participant as required/not required
 */
export function toggleRequiredAttendee(eventId: string, participantName: string): Event {
  const event = getEvent(eventId);

  const isRequired = event.requiredAttendees.includes(participantName);

  const updatedRequired = isRequired
    ? event.requiredAttendees.filter((name) => name !== participantName)
    : [...event.requiredAttendees, participantName];

  const updatedEvent: Event = {
    ...event,
    requiredAttendees: updatedRequired,
  };

  saveEvent(updatedEvent);
  return updatedEvent;
}

/**
 * Clear all required attendees
 */
export function clearRequiredAttendees(eventId: string): Event {
  const event = getEvent(eventId);

  const updatedEvent: Event = {
    ...event,
    requiredAttendees: [],
  };

  saveEvent(updatedEvent);
  return updatedEvent;
}
