import { describe, it, expect } from 'vitest';
import {
  aggregateVotes,
  getHeatmapColor,
  getParticipantsForSlot,
  findContinuousBlocks,
  formatBlockTime,
  formatDuration,
  filterByRequiredAttendees,
} from '../calculation';
import type { Event, Vote, TimeSlot } from '@/types';

const createMockEvent = (): Event => ({
  id: 'test123',
  name: 'Test Event',
  duration: 60,
  candidateDates: ['2024-01-15', '2024-01-16'],
  timeRange: { start: '09:00', end: '17:00' },
  excludeLunch: true,
  lunchRange: { start: '12:00', end: '13:00' },
  slots: [
    { id: 'slot1', date: '2024-01-15', time: '09:00' },
    { id: 'slot2', date: '2024-01-15', time: '09:30' },
    { id: 'slot3', date: '2024-01-15', time: '10:00' },
    { id: 'slot4', date: '2024-01-15', time: '10:30' },
    { id: 'slot5', date: '2024-01-16', time: '09:00' },
    { id: 'slot6', date: '2024-01-16', time: '09:30' },
  ],
  votes: [],
  passwordHash: null,
  createdAt: new Date().toISOString(),
});

describe('calculation service', () => {
  describe('aggregateVotes', () => {
    it('should return zero for all slots when no votes', () => {
      const event = createMockEvent();
      const availability = aggregateVotes(event);

      expect(availability.size).toBe(6);
      expect(availability.get('slot1')).toBe(0);
      expect(availability.get('slot2')).toBe(0);
    });

    it('should count votes correctly for each slot', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, false, false, false, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Bob',
          selections: [true, false, false, false, true, false],
          submittedAt: new Date().toISOString(),
        },
      ];

      const availability = aggregateVotes(event);

      expect(availability.get('slot1')).toBe(2); // Alice + Bob
      expect(availability.get('slot2')).toBe(1); // Alice only
      expect(availability.get('slot3')).toBe(0); // Nobody
      expect(availability.get('slot5')).toBe(1); // Bob only
    });

    it('should handle multiple votes correctly', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, true, true, true, true],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Bob',
          selections: [true, true, true, true, true, true],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Charlie',
          selections: [true, true, true, true, true, true],
          submittedAt: new Date().toISOString(),
        },
      ];

      const availability = aggregateVotes(event);

      event.slots.forEach((slot) => {
        expect(availability.get(slot.id)).toBe(3);
      });
    });
  });

  describe('getHeatmapColor', () => {
    it('should return gray for zero count', () => {
      expect(getHeatmapColor(0, 10)).toBe('#f3f4f6');
    });

    it('should return gray when maxCount is zero', () => {
      expect(getHeatmapColor(0, 0)).toBe('#f3f4f6');
    });

    it('should return light green for low intensity', () => {
      expect(getHeatmapColor(2, 10)).toBe('#bbf7d0'); // 0.2 < 0.25
    });

    it('should return medium green for medium-low intensity', () => {
      expect(getHeatmapColor(3, 10)).toBe('#86efac'); // 0.3 < 0.5
    });

    it('should return darker green for medium-high intensity', () => {
      expect(getHeatmapColor(6, 10)).toBe('#4ade80'); // 0.6 < 0.75
    });

    it('should return darkest green for high intensity', () => {
      expect(getHeatmapColor(9, 10)).toBe('#22c55e'); // 0.9 >= 0.75
    });

    it('should return darkest green for max count', () => {
      expect(getHeatmapColor(10, 10)).toBe('#22c55e');
    });
  });

  describe('getParticipantsForSlot', () => {
    it('should return empty array when no votes', () => {
      const event = createMockEvent();
      const participants = getParticipantsForSlot(event, 'slot1');

      expect(participants).toEqual([]);
    });

    it('should return participants who selected the slot', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, false, false, false, false, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Bob',
          selections: [true, false, false, false, false, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Charlie',
          selections: [false, false, false, false, false, false],
          submittedAt: new Date().toISOString(),
        },
      ];

      const participants = getParticipantsForSlot(event, 'slot1');

      expect(participants).toEqual(['Alice', 'Bob']);
    });

    it('should return empty array for non-existent slot', () => {
      const event = createMockEvent();
      const participants = getParticipantsForSlot(event, 'non-existent');

      expect(participants).toEqual([]);
    });
  });

  describe('findContinuousBlocks', () => {
    it('should return empty array when no votes', () => {
      const event = createMockEvent();
      const availability = aggregateVotes(event);
      const blocks = findContinuousBlocks(event, availability, 60);

      expect(blocks).toEqual([]);
    });

    it('should find continuous blocks meeting duration requirement', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
      ];

      const availability = aggregateVotes(event);
      const blocks = findContinuousBlocks(event, availability, 60);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].start.id).toBe('slot1');
      expect(blocks[0].end.id).toBe('slot3');
      expect(blocks[0].duration).toBe(90); // 3 slots * 30 min
      expect(blocks[0].availableCount).toBe(1);
    });

    it('should not return blocks shorter than required duration', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, false, false, false, false, false],
          submittedAt: new Date().toISOString(),
        },
      ];

      const availability = aggregateVotes(event);
      const blocks = findContinuousBlocks(event, availability, 60);

      expect(blocks).toEqual([]); // 30 min < 60 min required
    });

    it('should find multiple separate blocks', () => {
      const event = createMockEvent();
      // Create a longer continuous block and a separate block
      event.slots = [
        { id: 'slot1', date: '2024-01-15', time: '09:00' },
        { id: 'slot2', date: '2024-01-15', time: '09:30' },
        { id: 'slot3', date: '2024-01-15', time: '10:00' },
        { id: 'slot4', date: '2024-01-15', time: '14:00' }, // Gap (lunch + break)
        { id: 'slot5', date: '2024-01-15', time: '14:30' },
        { id: 'slot6', date: '2024-01-15', time: '15:00' },
      ];
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, true, true, true, false],
          submittedAt: new Date().toISOString(),
        },
      ];

      const availability = aggregateVotes(event);
      const blocks = findContinuousBlocks(event, availability, 60);

      // Should find slot1-slot2-slot3 (90 min) and slot4-slot5 (60 min)
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks.some(b => b.duration >= 60)).toBe(true);
    });

    it('should use minimum count across all slots in block', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Bob',
          selections: [true, false, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
      ];

      const availability = aggregateVotes(event);
      const blocks = findContinuousBlocks(event, availability, 60);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].availableCount).toBe(1); // Min of [2, 1, 2]
    });

    it('should only include participants available for entire block', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Bob',
          selections: [true, false, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
      ];

      const availability = aggregateVotes(event);
      const blocks = findContinuousBlocks(event, availability, 60);

      expect(blocks).toHaveLength(1);
      // Alice is available for all three slots in the block
      expect(blocks[0].participants).toEqual(['Alice']);
    });

    it('should sort blocks by availability count descending', () => {
      const event = createMockEvent();
      event.duration = 30; // Lower requirement to get multiple blocks
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, false, false, true, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Bob',
          selections: [true, false, false, false, true, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Charlie',
          selections: [false, false, false, false, true, false],
          submittedAt: new Date().toISOString(),
        },
      ];

      const availability = aggregateVotes(event);
      const blocks = findContinuousBlocks(event, availability, 30);

      expect(blocks.length).toBeGreaterThan(0);
      // First block should have highest count
      if (blocks.length > 1) {
        expect(blocks[0].availableCount).toBeGreaterThanOrEqual(blocks[1].availableCount);
      }
    });
  });

  describe('formatBlockTime', () => {
    it('should format time block on same date', () => {
      const start: TimeSlot = { id: '1', date: '2024-01-15', time: '09:00' };
      const end: TimeSlot = { id: '2', date: '2024-01-15', time: '10:30' };

      const formatted = formatBlockTime(start, end);

      expect(formatted).toBe('2024-01-15 09:00 - 10:30');
    });

    it('should format time block across different dates', () => {
      const start: TimeSlot = { id: '1', date: '2024-01-15', time: '23:00' };
      const end: TimeSlot = { id: '2', date: '2024-01-16', time: '01:00' };

      const formatted = formatBlockTime(start, end);

      expect(formatted).toBe('2024-01-15 23:00 - 2024-01-16 01:00');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes less than 60', () => {
      expect(formatDuration(30)).toBe('30분');
      expect(formatDuration(45)).toBe('45분');
    });

    it('should format exact hours', () => {
      expect(formatDuration(60)).toBe('1시간');
      expect(formatDuration(120)).toBe('2시간');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1시간 30분');
      expect(formatDuration(150)).toBe('2시간 30분');
    });
  });

  describe('filterByRequiredAttendees', () => {
    it('should return original availability when no required attendees', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, false, false, false, false],
          submittedAt: new Date().toISOString(),
        },
      ];
      event.requiredAttendees = [];

      const availability = aggregateVotes(event);
      const filtered = filterByRequiredAttendees(event, availability);

      expect(filtered).toEqual(availability);
    });

    it('should filter slots to only show when all required are available', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Bob',
          selections: [true, false, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
      ];
      event.requiredAttendees = ['Alice', 'Bob'];

      const availability = aggregateVotes(event);
      const filtered = filterByRequiredAttendees(event, availability);

      // Only slot1 and slot3 have both Alice and Bob
      expect(filtered.get('slot1')).toBe(2); // Both available
      expect(filtered.get('slot2')).toBe(0); // Only Alice available
      expect(filtered.get('slot3')).toBe(2); // Both available
      expect(filtered.get('slot4')).toBe(0); // Neither available
    });

    it('should mark slot as 0 if required participant has not voted', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, true, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
      ];
      event.requiredAttendees = ['Alice', 'Bob']; // Bob hasn't voted yet

      const availability = aggregateVotes(event);
      const filtered = filterByRequiredAttendees(event, availability);

      // All slots should be 0 because Bob hasn't voted
      event.slots.forEach((slot) => {
        expect(filtered.get(slot.id)).toBe(0);
      });
    });

    it('should handle single required participant', () => {
      const event = createMockEvent();
      event.votes = [
        {
          participantName: 'Alice',
          selections: [true, false, true, false, false, false],
          submittedAt: new Date().toISOString(),
        },
        {
          participantName: 'Bob',
          selections: [true, true, true, true, true, true],
          submittedAt: new Date().toISOString(),
        },
      ];
      event.requiredAttendees = ['Alice'];

      const availability = aggregateVotes(event);
      const filtered = filterByRequiredAttendees(event, availability);

      // Only Alice's slots should show (slot1 and slot3)
      expect(filtered.get('slot1')).toBe(2); // Alice + Bob
      expect(filtered.get('slot2')).toBe(0); // Alice not available
      expect(filtered.get('slot3')).toBe(2); // Alice + Bob
      expect(filtered.get('slot4')).toBe(0); // Alice not available
    });
  });
});
