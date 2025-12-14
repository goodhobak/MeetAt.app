/**
 * Validation schemas using Zod
 * Based on DATA_SCHEMA.md
 */

import { z } from 'zod';

// Time format regex: HH:mm (00:00 to 23:59)
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ISO date format regex: YYYY-MM-DD
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Event ID format: 8 lowercase alphanumeric characters
const EVENT_ID_REGEX = /^[a-z0-9]{8}$/;

// SHA-256 hash format: 64 hexadecimal characters
const SHA256_REGEX = /^[a-f0-9]{64}$/;

/**
 * TimeRange schema with validation that end > start
 */
export const TimeRangeSchema = z
  .object({
    start: z.string().regex(TIME_REGEX, 'Invalid time format (expected HH:mm)'),
    end: z.string().regex(TIME_REGEX, 'Invalid time format (expected HH:mm)'),
  })
  .refine(data => data.end > data.start, {
    message: 'End time must be after start time',
    path: ['end'],
  });

/**
 * TimeSlot schema
 */
export const TimeSlotSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format (expected YYYY-MM-DD)'),
  time: z.string().regex(TIME_REGEX, 'Invalid time format (expected HH:mm)'),
});

/**
 * Vote schema
 */
export const VoteSchema = z.object({
  participantName: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  selections: z.array(z.boolean()),
  submittedAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * ConfirmedTime schema
 */
export const ConfirmedTimeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  confirmedBy: z.string().min(1).max(50),
  confirmedAt: z.string().datetime(),
  note: z.string().max(500).optional(),
});

/**
 * Event schema with full validation
 */
export const EventSchema = z
  .object({
    id: z.string().regex(EVENT_ID_REGEX, 'Invalid event ID format'),
    name: z
      .string()
      .min(1, 'Event name is required')
      .max(100, 'Event name is too long'),
    duration: z
      .number()
      .int('Duration must be an integer')
      .min(15, 'Duration must be at least 15 minutes')
      .max(480, 'Duration must be at most 480 minutes (8 hours)')
      .multipleOf(15, 'Duration must be a multiple of 15'),
    candidateDates: z
      .array(z.string().regex(ISO_DATE_REGEX))
      .min(1, 'At least one date is required')
      .max(30, 'Maximum 30 dates allowed'),
    timeRange: TimeRangeSchema,
    excludeLunch: z.boolean(),
    lunchRange: TimeRangeSchema.optional(),
    passwordHash: z
      .string()
      .regex(SHA256_REGEX, 'Invalid password hash format')
      .nullable(),
    createdAt: z.string().datetime(),
    slots: z.array(TimeSlotSchema),
    votes: z.array(VoteSchema),
    requiredAttendees: z.array(z.string().min(1).max(50)),
    confirmed: ConfirmedTimeSchema.nullable(),
  })
  .refine(
    data => {
      // If excludeLunch is true, lunchRange must be provided
      if (data.excludeLunch && !data.lunchRange) {
        return false;
      }
      return true;
    },
    {
      message: 'Lunch range is required when excludeLunch is true',
      path: ['lunchRange'],
    }
  );

/**
 * EventFormData schema for form validation
 */
export const EventFormDataSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Event name is required')
      .max(100, 'Event name is too long')
      .refine(
        name => !/<script|<iframe|javascript:/i.test(name),
        'Event name contains invalid characters'
      ),
    duration: z
      .number()
      .int()
      .min(15, 'Duration must be at least 15 minutes')
      .max(480, 'Duration must be at most 480 minutes')
      .multipleOf(15, 'Duration must be a multiple of 15'),
    candidateDates: z
      .array(z.date())
      .min(1, 'At least one date is required')
      .max(30, 'Maximum 30 dates allowed'),
    timeRange: TimeRangeSchema,
    excludeLunch: z.boolean(),
    lunchRange: TimeRangeSchema.optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  })
  .refine(
    data => {
      if (data.excludeLunch && !data.lunchRange) {
        return false;
      }
      return true;
    },
    {
      message: 'Lunch range is required when excludeLunch is true',
      path: ['lunchRange'],
    }
  );

/**
 * Validate event data
 */
export function validateEvent(event: unknown) {
  return EventSchema.parse(event);
}

/**
 * Validate event form data
 */
export function validateEventFormData(formData: unknown) {
  return EventFormDataSchema.parse(formData);
}

/**
 * Check if participant name is duplicate
 */
export function isDuplicateParticipantName(
  votes: Array<{ participantName: string }>,
  name: string
): boolean {
  return votes.some(vote => vote.participantName.toLowerCase() === name.toLowerCase());
}
