/**
 * EventForm Component
 * Based on FEATURE_SPECS.md - FR-001
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { generateUniqueEventId } from '@/utils/idGenerator';
import { generateTimeSlots, formatDate } from '@/utils/timeSlots';
import { validateEventFormData } from '@/services/validation';
import { saveEvent } from '@/services/storage';
import { hashPassword } from '@/services/crypto';
import type { EventFormData, Event } from '@/types';

const DEFAULT_DURATION = 60;
const DEFAULT_TIME_RANGE = { start: '09:00', end: '18:00' };
const DEFAULT_LUNCH_RANGE = { start: '12:00', end: '13:00' };

export function EventForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    duration: DEFAULT_DURATION,
    candidateDates: [],
    timeRange: DEFAULT_TIME_RANGE,
    excludeLunch: true,
    lunchRange: DEFAULT_LUNCH_RANGE,
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = validateEventFormData(formData);

      // Generate unique ID
      const eventId = generateUniqueEventId();

      // Generate time slots
      const slots = generateTimeSlots(
        validatedData.candidateDates,
        validatedData.timeRange,
        validatedData.excludeLunch,
        validatedData.lunchRange
      );

      // Hash password if provided
      const passwordHash = validatedData.password
        ? await hashPassword(validatedData.password)
        : null;

      // Create event object
      const event: Event = {
        id: eventId,
        name: validatedData.name,
        duration: validatedData.duration,
        candidateDates: validatedData.candidateDates.map(formatDate),
        timeRange: validatedData.timeRange,
        excludeLunch: validatedData.excludeLunch,
        lunchRange: validatedData.lunchRange,
        passwordHash,
        createdAt: new Date().toISOString(),
        slots,
        votes: [],
        requiredAttendees: [],
        confirmed: null,
      };

      // Save to storage
      saveEvent(event);

      // Show success message
      toast.success('Event created successfully!');

      // Redirect to event page
      navigate(`/event/${eventId}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          setErrors({ form: 'Please check your inputs and try again.' });
        } else {
          setErrors({ form: error.message });
        }
        toast.error('Failed to create event. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateAdd = () => {
    const input = document.getElementById('date-input') as HTMLInputElement;
    if (input?.value) {
      const date = new Date(input.value);
      if (!formData.candidateDates.some(d => d.getTime() === date.getTime())) {
        setFormData(prev => ({
          ...prev,
          candidateDates: [...prev.candidateDates, date].sort(
            (a, b) => a.getTime() - b.getTime()
          ),
        }));
      }
      input.value = '';
    }
  };

  const handleDateRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      candidateDates: prev.candidateDates.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Create New Event</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Team Sprint Planning"
              required
              maxLength={100}
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Expected Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <select
              id="duration"
              value={formData.duration}
              onChange={e =>
                setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          {/* Candidate Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Candidate Dates <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="date"
                id="date-input"
                className="block flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <button
                type="button"
                onClick={handleDateAdd}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Add Date
              </button>
            </div>
            {formData.candidateDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.candidateDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1 text-sm"
                  >
                    <span>{format(date, 'MMM dd, yyyy')}</span>
                    <button
                      type="button"
                      onClick={() => handleDateRemove(index)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {formData.candidateDates.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Add at least one candidate date
              </p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="time-start"
                className="block text-sm font-medium text-gray-700"
              >
                Start Time
              </label>
              <input
                type="time"
                id="time-start"
                value={formData.timeRange.start}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    timeRange: { ...prev.timeRange, start: e.target.value },
                  }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="time-end" className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="time"
                id="time-end"
                value={formData.timeRange.end}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    timeRange: { ...prev.timeRange, end: e.target.value },
                  }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Exclude Lunch */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.excludeLunch}
                onChange={e =>
                  setFormData(prev => ({ ...prev, excludeLunch: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Exclude lunch hours</span>
            </label>
          </div>

          {/* Lunch Range (conditional) */}
          {formData.excludeLunch && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="lunch-start"
                  className="block text-sm font-medium text-gray-700"
                >
                  Lunch Start
                </label>
                <input
                  type="time"
                  id="lunch-start"
                  value={formData.lunchRange?.start || '12:00'}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      lunchRange: {
                        ...prev.lunchRange!,
                        start: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="lunch-end"
                  className="block text-sm font-medium text-gray-700"
                >
                  Lunch End
                </label>
                <input
                  type="time"
                  id="lunch-end"
                  value={formData.lunchRange?.end || '13:00'}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      lunchRange: {
                        ...prev.lunchRange!,
                        end: e.target.value,
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Password (optional) */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password (optional)
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Leave empty for no password"
              maxLength={100}
            />
            <p className="mt-1 text-sm text-gray-500">
              Protect your event with a password. Participants will need it to vote.
            </p>
          </div>

          {/* Error Message */}
          {errors.form && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.form}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting || formData.candidateDates.length === 0}
              className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
