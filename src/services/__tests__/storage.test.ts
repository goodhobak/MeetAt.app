import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  listEvents,
  eventExists,
  getLockState,
  saveLockState,
  isEventLocked,
  recordFailedAttempt,
  clearLockState,
  getRemainingLockoutTime,
  EventNotFoundError,
} from '../storage';
import type { Event } from '@/types';

const createMockEvent = (id: string = 'abc12345'): Event => ({
  id,
  name: 'Test Event',
  duration: 60,
  candidateDates: ['2025-12-15'],
  timeRange: { start: '09:00', end: '18:00' },
  excludeLunch: true,
  lunchRange: { start: '12:00', end: '13:00' },
  passwordHash: null,
  createdAt: new Date().toISOString(),
  slots: [
    { id: '2025-12-15_09:00', date: '2025-12-15', time: '09:00' },
    { id: '2025-12-15_09:30', date: '2025-12-15', time: '09:30' },
  ],
  votes: [],
  requiredAttendees: [],
  confirmed: null,
});

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveEvent', () => {
    it('should save event to localStorage', () => {
      const event = createMockEvent();
      saveEvent(event);

      const stored = localStorage.getItem('event:abc12345');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(event);
    });
  });

  describe('getEvent', () => {
    it('should retrieve event from localStorage', () => {
      const event = createMockEvent();
      saveEvent(event);

      const retrieved = getEvent('abc12345');
      expect(retrieved).toEqual(event);
    });

    it('should throw EventNotFoundError if event does not exist', () => {
      expect(() => getEvent('nonexistent')).toThrow(EventNotFoundError);
      expect(() => getEvent('nonexistent')).toThrow('Event not found: nonexistent');
    });
  });

  describe('updateEvent', () => {
    it('should update existing event', () => {
      const event = createMockEvent();
      saveEvent(event);

      const updated = updateEvent('abc12345', { name: 'Updated Event' });
      expect(updated.name).toBe('Updated Event');
      expect(updated.id).toBe('abc12345');

      const retrieved = getEvent('abc12345');
      expect(retrieved.name).toBe('Updated Event');
    });

    it('should throw if event does not exist', () => {
      expect(() => updateEvent('nonexistent', { name: 'Test' })).toThrow(
        EventNotFoundError
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete event from localStorage', () => {
      const event = createMockEvent();
      saveEvent(event);

      deleteEvent('abc12345');
      expect(() => getEvent('abc12345')).toThrow(EventNotFoundError);
    });

    it('should also delete lock state', () => {
      const event = createMockEvent();
      saveEvent(event);
      saveLockState({ eventId: 'abc12345', attempts: 3, lockedUntil: null });

      deleteEvent('abc12345');

      expect(localStorage.getItem('lock:abc12345')).toBeNull();
    });
  });

  describe('listEvents', () => {
    it('should return empty array when no events exist', () => {
      expect(listEvents()).toEqual([]);
    });

    it('should list all events', () => {
      const event1 = createMockEvent('event001');
      const event2 = createMockEvent('event002');

      saveEvent(event1);
      saveEvent(event2);

      const events = listEvents();
      expect(events).toHaveLength(2);
    });

    it('should sort events by creation date (newest first)', () => {
      const event1 = createMockEvent('event001');
      event1.createdAt = new Date('2025-12-14T10:00:00Z').toISOString();

      const event2 = createMockEvent('event002');
      event2.createdAt = new Date('2025-12-14T11:00:00Z').toISOString();

      saveEvent(event1);
      saveEvent(event2);

      const events = listEvents();
      expect(events[0].id).toBe('event002'); // Newer first
      expect(events[1].id).toBe('event001');
    });
  });

  describe('eventExists', () => {
    it('should return false for non-existent event', () => {
      expect(eventExists('nonexistent')).toBe(false);
    });

    it('should return true for existing event', () => {
      const event = createMockEvent();
      saveEvent(event);

      expect(eventExists('abc12345')).toBe(true);
    });
  });

  describe('lock state operations', () => {
    describe('getLockState', () => {
      it('should return default lock state if none exists', () => {
        const lockState = getLockState('abc12345');
        expect(lockState).toEqual({
          eventId: 'abc12345',
          attempts: 0,
          lockedUntil: null,
        });
      });

      it('should retrieve existing lock state', () => {
        const state = { eventId: 'abc12345', attempts: 3, lockedUntil: null };
        saveLockState(state);

        const retrieved = getLockState('abc12345');
        expect(retrieved).toEqual(state);
      });
    });

    describe('isEventLocked', () => {
      it('should return false if not locked', () => {
        expect(isEventLocked('abc12345')).toBe(false);
      });

      it('should return true if locked', () => {
        const state = {
          eventId: 'abc12345',
          attempts: 5,
          lockedUntil: Date.now() + 10000, // 10 seconds from now
        };
        saveLockState(state);

        expect(isEventLocked('abc12345')).toBe(true);
      });

      it('should return false if lock has expired', () => {
        const state = {
          eventId: 'abc12345',
          attempts: 5,
          lockedUntil: Date.now() - 1000, // 1 second ago
        };
        saveLockState(state);

        expect(isEventLocked('abc12345')).toBe(false);
      });
    });

    describe('recordFailedAttempt', () => {
      it('should increment attempts', () => {
        recordFailedAttempt('abc12345');
        const state = getLockState('abc12345');
        expect(state.attempts).toBe(1);
      });

      it('should lock after 5 failed attempts', () => {
        for (let i = 0; i < 5; i++) {
          recordFailedAttempt('abc12345');
        }

        const state = getLockState('abc12345');
        expect(state.attempts).toBe(5);
        expect(state.lockedUntil).toBeGreaterThan(Date.now());
      });
    });

    describe('clearLockState', () => {
      it('should remove lock state', () => {
        saveLockState({ eventId: 'abc12345', attempts: 3, lockedUntil: null });
        clearLockState('abc12345');

        const state = getLockState('abc12345');
        expect(state.attempts).toBe(0);
      });
    });

    describe('getRemainingLockoutTime', () => {
      it('should return 0 if not locked', () => {
        expect(getRemainingLockoutTime('abc12345')).toBe(0);
      });

      it('should return remaining time if locked', () => {
        const lockUntil = Date.now() + 5000; // 5 seconds from now
        saveLockState({ eventId: 'abc12345', attempts: 5, lockedUntil: lockUntil });

        const remaining = getRemainingLockoutTime('abc12345');
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(5000);
      });
    });
  });
});
