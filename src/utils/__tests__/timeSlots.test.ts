import { describe, it, expect } from 'vitest';
import { generateTimeSlots, formatDate, parseDate } from '../timeSlots';

describe('timeSlots', () => {
  describe('generateTimeSlots', () => {
    it('should generate slots for a single date without lunch exclusion', () => {
      const dates = [new Date('2025-12-15')];
      const timeRange = { start: '09:00', end: '11:00' };
      const slots = generateTimeSlots(dates, timeRange, false);

      expect(slots).toHaveLength(4); // 09:00, 09:30, 10:00, 10:30
      expect(slots[0]).toEqual({
        id: '2025-12-15_09:00',
        date: '2025-12-15',
        time: '09:00',
      });
      expect(slots[3]).toEqual({
        id: '2025-12-15_10:30',
        date: '2025-12-15',
        time: '10:30',
      });
    });

    it('should generate slots for multiple dates', () => {
      const dates = [new Date('2025-12-15'), new Date('2025-12-16')];
      const timeRange = { start: '09:00', end: '10:00' };
      const slots = generateTimeSlots(dates, timeRange, false);

      expect(slots).toHaveLength(4); // 2 slots per day * 2 days
      expect(slots[0].date).toBe('2025-12-15');
      expect(slots[2].date).toBe('2025-12-16');
    });

    it('should exclude lunch hours when specified', () => {
      const dates = [new Date('2025-12-15')];
      const timeRange = { start: '11:00', end: '14:00' };
      const lunchRange = { start: '12:00', end: '13:00' };
      const slots = generateTimeSlots(dates, timeRange, true, lunchRange);

      // Should have: 11:00, 11:30, 13:00, 13:30
      // Excluded: 12:00, 12:30
      expect(slots).toHaveLength(4);
      expect(slots.map(s => s.time)).toEqual(['11:00', '11:30', '13:00', '13:30']);
    });

    it('should handle full day schedule', () => {
      const dates = [new Date('2025-12-15')];
      const timeRange = { start: '09:00', end: '18:00' };
      const lunchRange = { start: '12:00', end: '13:00' };
      const slots = generateTimeSlots(dates, timeRange, true, lunchRange);

      // 9 hours = 540 minutes, minus 1 hour lunch = 8 hours = 480 minutes
      // 480 / 30 = 16 slots
      expect(slots).toHaveLength(16);

      // Check no lunch slots
      const lunchSlots = slots.filter(s => s.time >= '12:00' && s.time < '13:00');
      expect(lunchSlots).toHaveLength(0);
    });

    it('should generate correct slot IDs', () => {
      const dates = [new Date('2025-12-15')];
      const timeRange = { start: '14:00', end: '15:00' };
      const slots = generateTimeSlots(dates, timeRange, false);

      expect(slots[0].id).toBe('2025-12-15_14:00');
      expect(slots[1].id).toBe('2025-12-15_14:30');
    });
  });

  describe('formatDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2025-12-15T10:30:00Z');
      expect(formatDate(date)).toBe('2025-12-15');
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date string to Date', () => {
      const date = parseDate('2025-12-15');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // December (0-indexed)
      expect(date.getDate()).toBe(15);
    });
  });
});
