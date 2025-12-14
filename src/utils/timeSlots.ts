/**
 * Time slot generation utilities
 * Based on FEATURE_SPECS.md - FR-001
 */

import { format } from 'date-fns';
import type { TimeSlot, TimeRange } from '@/types';

const SLOT_INTERVAL_MINUTES = 30; // 30-minute granularity

/**
 * Parse time string "HH:mm" to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = Number(parts[0] || '0');
  const minutes = Number(parts[1] || '0');
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to "HH:mm"
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if a time is within a range (inclusive start, exclusive end)
 */
function isTimeInRange(
  timeMinutes: number,
  rangeStart: number,
  rangeEnd: number
): boolean {
  return timeMinutes >= rangeStart && timeMinutes < rangeEnd;
}

/**
 * Generate time slots for given dates and time range
 *
 * @param dates - Array of Date objects for candidate dates
 * @param timeRange - Start and end time range
 * @param excludeLunch - Whether to exclude lunch hours
 * @param lunchRange - Lunch time range (required if excludeLunch is true)
 * @returns Array of TimeSlot objects
 */
export function generateTimeSlots(
  dates: Date[],
  timeRange: TimeRange,
  excludeLunch: boolean,
  lunchRange?: TimeRange
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const startMinutes = parseTimeToMinutes(timeRange.start);
  const endMinutes = parseTimeToMinutes(timeRange.end);

  let lunchStartMinutes: number | null = null;
  let lunchEndMinutes: number | null = null;

  if (excludeLunch && lunchRange) {
    lunchStartMinutes = parseTimeToMinutes(lunchRange.start);
    lunchEndMinutes = parseTimeToMinutes(lunchRange.end);
  }

  for (const date of dates) {
    const dateStr = format(date, 'yyyy-MM-dd');
    let currentMinutes = startMinutes;

    while (currentMinutes < endMinutes) {
      // Skip lunch hours if excluded
      if (
        excludeLunch &&
        lunchStartMinutes !== null &&
        lunchEndMinutes !== null &&
        isTimeInRange(currentMinutes, lunchStartMinutes, lunchEndMinutes)
      ) {
        currentMinutes += SLOT_INTERVAL_MINUTES;
        continue;
      }

      const timeStr = formatMinutesToTime(currentMinutes);
      const slotId = `${dateStr}_${timeStr}`;

      slots.push({
        id: slotId,
        date: dateStr,
        time: timeStr,
      });

      currentMinutes += SLOT_INTERVAL_MINUTES;
    }
  }

  return slots;
}

/**
 * Format a date to ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse ISO date string to Date object
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}
