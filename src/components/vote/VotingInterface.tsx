/**
 * VotingInterface Component
 * Based on FEATURE_SPECS.md - FR-004
 * Combined voting UI with grid, form, and vote list
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  submitVote,
  updateVote,
  deleteVote,
  checkDuplicateParticipant,
  toggleRequiredAttendee,
} from '@/services/storage';
import type { Event, Vote } from '@/types';

interface VotingInterfaceProps {
  event: Event;
  onVoteChange: (updatedEvent: Event) => void;
}

export function VotingInterface({ event, onVoteChange }: VotingInterfaceProps) {
  const [participantName, setParticipantName] = useState('');
  const [selections, setSelections] = useState<boolean[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);

  // Initialize selections array
  useEffect(() => {
    setSelections(new Array(event.slots.length).fill(false));
  }, [event.slots.length]);

  const handleToggleSlot = (index: number) => {
    const newSelections = [...selections];
    newSelections[index] = !newSelections[index];
    setSelections(newSelections);
  };

  const handleSelectAll = () => {
    setSelections(new Array(event.slots.length).fill(true));
  };

  const handleSelectMorning = () => {
    const newSelections = event.slots.map((slot) => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour < 12;
    });
    setSelections(newSelections);
  };

  const handleSelectAfternoon = () => {
    const newSelections = event.slots.map((slot) => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 13;
    });
    setSelections(newSelections);
  };

  const handleReset = () => {
    setSelections(new Array(event.slots.length).fill(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!participantName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    // Check if any slot is selected
    if (!selections.some((s) => s)) {
      toast.error('Please select at least one time slot');
      return;
    }

    try {
      let updatedEvent: Event;

      if (isEditing && editingName) {
        // Update existing vote
        updatedEvent = updateVote(event.id, editingName, selections);
        toast.success('Vote updated successfully!');
      } else {
        // Submit new vote
        const vote: Vote = {
          participantName: participantName.trim(),
          selections,
          submittedAt: new Date().toISOString(),
        };
        updatedEvent = submitVote(event.id, vote);
        toast.success('Vote submitted successfully!');
      }

      // Notify parent component
      onVoteChange(updatedEvent);

      // Reset form
      setParticipantName('');
      setSelections(new Array(event.slots.length).fill(false));
      setIsEditing(false);
      setEditingName(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to submit vote');
      }
    }
  };

  const handleEdit = (vote: Vote) => {
    setParticipantName(vote.participantName);
    setSelections(vote.selections);
    setIsEditing(true);
    setEditingName(vote.participantName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (participantName: string) => {
    if (!confirm(`Delete vote from ${participantName}?`)) {
      return;
    }

    try {
      const updatedEvent = deleteVote(event.id, participantName);
      onVoteChange(updatedEvent);
      toast.success('Vote deleted successfully');

      // If we were editing this vote, cancel editing
      if (editingName === participantName) {
        setParticipantName('');
        setSelections(new Array(event.slots.length).fill(false));
        setIsEditing(false);
        setEditingName(null);
      }
    } catch (error) {
      toast.error('Failed to delete vote');
    }
  };

  const handleCancelEdit = () => {
    setParticipantName('');
    setSelections(new Array(event.slots.length).fill(false));
    setIsEditing(false);
    setEditingName(null);
  };

  const handleToggleRequired = (participantName: string) => {
    try {
      const updatedEvent = toggleRequiredAttendee(event.id, participantName);
      onVoteChange(updatedEvent);
    } catch (error) {
      toast.error('Failed to toggle required status');
    }
  };

  // Group slots by date
  const slotsByDate = event.slots.reduce((acc, slot, index) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push({ slot, index });
    return {};
  }, {} as Record<string, Array<{ slot: typeof event.slots[0]; index: number }>>);

  const dates = Array.from(new Set(event.slots.map((s) => s.date))).sort();

  return (
    <div className="space-y-6">
      {/* Participant Form */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          {isEditing ? 'Edit Your Vote' : 'Vote on Available Times'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="participant-name" className="block text-sm font-medium text-gray-700">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="participant-name"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Enter your name"
              maxLength={50}
              disabled={isEditing}
              required
            />
          </div>

          {/* Bulk Selection Buttons */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quick Selection
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleSelectMorning}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Select Morning
              </button>
              <button
                type="button"
                onClick={handleSelectAfternoon}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Select Afternoon
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Time Slot Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="mb-2 text-sm font-medium text-gray-700">
                Select your available times
              </div>
              <div className="space-y-1">
                {event.slots.map((slot, index) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleToggleSlot(index)}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                      selections[index]
                        ? 'bg-green-100 text-green-900 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {format(new Date(slot.date), 'EEE, MMM d')} - {slot.time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {isEditing ? 'Update Vote' : 'Submit Vote'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Vote List */}
      {event.votes.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Participants ({event.votes.length})
          </h3>
          <div className="space-y-2">
            {event.votes.map((vote) => {
              const isRequired = event.requiredAttendees.includes(vote.participantName);
              return (
                <div
                  key={vote.participantName}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleRequired(vote.participantName)}
                      className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                      aria-label={
                        isRequired ? 'Remove from required' : 'Mark as required'
                      }
                      title={
                        isRequired
                          ? 'Required participant (click to remove)'
                          : 'Mark as required participant'
                      }
                    >
                      {isRequired ? '⭐' : '☆'}
                    </button>
                    <div>
                      <div className="font-medium text-gray-900">
                        {vote.participantName}
                        {isRequired && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {vote.selections.filter((s) => s).length} / {event.slots.length} slots
                        selected
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vote)}
                      className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vote.participantName)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                    >
                    Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
