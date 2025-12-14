import type { Event, TimeSlot } from '@/types';

/**
 * Aggregate votes to count availability per time slot
 */
export function aggregateVotes(event: Event): Map<string, number> {
  const availability = new Map<string, number>();

  // Initialize all slots with 0
  event.slots.forEach((slot) => {
    availability.set(slot.id, 0);
  });

  // Count votes per slot
  event.votes.forEach((vote) => {
    vote.selections.forEach((isAvailable, index) => {
      if (isAvailable) {
        const slotId = event.slots[index].id;
        availability.set(slotId, (availability.get(slotId) || 0) + 1);
      }
    });
  });

  return availability;
}

/**
 * Get heatmap color based on availability count
 */
export function getHeatmapColor(count: number, maxCount: number): string {
  if (count === 0) return '#f3f4f6'; // gray-100
  if (maxCount === 0) return '#f3f4f6';

  const intensity = count / maxCount;

  // Green gradient (Tailwind colors)
  if (intensity < 0.25) return '#bbf7d0'; // green-200
  if (intensity < 0.5) return '#86efac'; // green-300
  if (intensity < 0.75) return '#4ade80'; // green-400
  return '#22c55e'; // green-500
}

/**
 * Get participants who are available for a specific slot
 */
export function getParticipantsForSlot(event: Event, slotId: string): string[] {
  const slotIndex = event.slots.findIndex((slot) => slot.id === slotId);
  if (slotIndex === -1) return [];

  const participants: string[] = [];
  event.votes.forEach((vote) => {
    if (vote.selections[slotIndex]) {
      participants.push(vote.participantName);
    }
  });

  return participants;
}

/**
 * Time block representing a continuous period of availability
 */
export interface TimeBlock {
  start: TimeSlot;
  end: TimeSlot;
  duration: number; // minutes
  availableCount: number; // minimum count across all slots in block
  participants: string[]; // participants available for entire block
}

/**
 * Find continuous time blocks that meet the required duration
 */
export function findContinuousBlocks(
  event: Event,
  availability: Map<string, number>,
  requiredDuration: number
): TimeBlock[] {
  const blocks: TimeBlock[] = [];

  // Sort slots by date and time
  const sortedSlots = [...event.slots].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time}`).getTime();
    const timeB = new Date(`${b.date}T${b.time}`).getTime();
    return timeA - timeB;
  });

  let currentBlock: TimeBlock | null = null;

  for (let i = 0; i < sortedSlots.length; i++) {
    const slot = sortedSlots[i];
    const count = availability.get(slot.id) || 0;

    if (count === 0) {
      // Gap in availability - save current block if it meets duration requirement
      if (currentBlock && currentBlock.duration >= requiredDuration) {
        blocks.push(currentBlock);
      }
      currentBlock = null;
      continue;
    }

    const slotTime = new Date(`${slot.date}T${slot.time}`);
    const nextSlot = sortedSlots[i + 1];

    // Check if next slot is contiguous (30 minutes later)
    const isContiguous =
      nextSlot &&
      new Date(`${nextSlot.date}T${nextSlot.time}`).getTime() - slotTime.getTime() ===
        30 * 60 * 1000;

    if (!currentBlock) {
      // Start new block
      currentBlock = {
        start: slot,
        end: slot,
        duration: 30,
        availableCount: count,
        participants: getParticipantsForSlot(event, slot.id),
      };
    } else if (isContiguous) {
      // Extend current block
      const blockParticipants = getParticipantsForSlot(event, slot.id);
      const commonParticipants = currentBlock.participants.filter((name) =>
        blockParticipants.includes(name)
      );

      currentBlock.end = slot;
      currentBlock.duration += 30;
      // Take minimum count in the block
      currentBlock.availableCount = Math.min(currentBlock.availableCount, count);
      // Only keep participants available for entire block
      currentBlock.participants = commonParticipants;
    } else {
      // Non-contiguous - save current block and start new
      if (currentBlock.duration >= requiredDuration) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        start: slot,
        end: slot,
        duration: 30,
        availableCount: count,
        participants: getParticipantsForSlot(event, slot.id),
      };
    }
  }

  // Don't forget the last block
  if (currentBlock && currentBlock.duration >= requiredDuration) {
    blocks.push(currentBlock);
  }

  // Sort by availability count (descending) - most popular blocks first
  return blocks.sort((a, b) => b.availableCount - a.availableCount);
}

/**
 * Format time block as readable string
 */
export function formatBlockTime(start: TimeSlot, end: TimeSlot): string {
  if (start.date === end.date) {
    return `${start.date} ${start.time} - ${end.time}`;
  }
  return `${start.date} ${start.time} - ${end.date} ${end.time}`;
}

/**
 * Format duration in minutes as readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${remainingMinutes}분`;
}
