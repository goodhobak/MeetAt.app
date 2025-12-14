/**
 * EventPage Component
 * Display event details and share options
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getEvent } from '@/services/storage';
import { LockScreen } from './LockScreen';
import { SharePanel } from '@/components/shared/SharePanel';
import { VotingInterface } from '@/components/vote/VotingInterface';
import type { Event } from '@/types';

export function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Event ID is missing');
      setLoading(false);
      return;
    }

    try {
      const loadedEvent = getEvent(id);
      setEvent(loadedEvent);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error('Event not found');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Event Not Found</h2>
          <p className="mt-2 text-gray-600">{error || 'This event does not exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Create New Event
          </button>
        </div>
      </div>
    );
  }

  // Show lock screen if event is password protected and not unlocked
  if (event.passwordHash && !isUnlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center py-12">
        <LockScreen
          eventId={event.id}
          passwordHash={event.passwordHash}
          onUnlock={() => setIsUnlocked(true)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-lg bg-white p-6 shadow-md">
        {/* Event Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Created {format(new Date(event.createdAt), 'PPP')}
          </p>
        </div>

        {/* Event Details */}
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Duration</h3>
            <p className="mt-1 text-lg text-gray-900">{event.duration} minutes</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">Candidate Dates</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              {event.candidateDates.map(date => (
                <span
                  key={date}
                  className="rounded-md bg-primary-100 px-3 py-1 text-sm text-primary-800"
                >
                  {format(new Date(date), 'MMM dd, yyyy')}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">Time Range</h3>
            <p className="mt-1 text-lg text-gray-900">
              {event.timeRange.start} - {event.timeRange.end}
            </p>
          </div>

          {event.excludeLunch && event.lunchRange && (
            <div>
              <h3 className="text-sm font-medium text-gray-700">Lunch Break</h3>
              <p className="mt-1 text-lg text-gray-900">
                {event.lunchRange.start} - {event.lunchRange.end} (excluded)
              </p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700">Time Slots</h3>
            <p className="mt-1 text-lg text-gray-900">{event.slots.length} slots</p>
          </div>
        </div>

        {/* Share Section */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <SharePanel eventId={event.id} />
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Create New Event
            </button>
          </div>
        </div>

        {/* Voting Section */}
        <div className="mt-8">
          <VotingInterface event={event} onVoteChange={setEvent} />
        </div>
      </div>
    </div>
  );
}
