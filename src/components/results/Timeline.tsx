import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Event } from '@/types';
import {
  aggregateVotes,
  findContinuousBlocks,
  formatBlockTime,
  formatDuration,
  filterByRequiredAttendees,
  type TimeBlock,
} from '@/services/calculation';
import { confirmTime } from '@/services/storage';

interface TimelineProps {
  event: Event;
  onEventChange?: (updatedEvent: Event) => void;
}

export function Timeline({ event, onEventChange }: TimelineProps) {
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);

  // Aggregate votes, apply filter, and find continuous blocks
  const rawAvailability = aggregateVotes(event);
  const availability = filterByRequiredAttendees(event, rawAvailability);
  const blocks = findContinuousBlocks(event, availability, event.duration);

  const maxCount = Math.max(...blocks.map((b) => b.availableCount), 0);

  // Show top 10 blocks
  const topBlocks = blocks.slice(0, 10);

  const handleBlockClick = (block: TimeBlock) => {
    setSelectedBlock(selectedBlock?.start.id === block.start.id ? null : block);
  };

  const handleConfirm = (block: TimeBlock) => {
    const organizerName = prompt('확정자 이름을 입력하세요:');
    if (!organizerName || !organizerName.trim()) {
      return;
    }

    const note = prompt('참여자에게 전달할 메모를 입력하세요 (선택사항):');

    try {
      const updatedEvent = confirmTime(
        event.id,
        block.start.date,
        block.start.time,
        block.duration,
        organizerName.trim(),
        note?.trim() || undefined
      );

      if (onEventChange) {
        onEventChange(updatedEvent);
      }

      toast.success('회의 시간이 확정되었습니다!');
    } catch (error) {
      toast.error('시간 확정에 실패했습니다');
    }
  };

  // Check if a block is the confirmed block
  const isConfirmedBlock = (block: TimeBlock): boolean => {
    if (!event.confirmed) return false;

    const blockStart = new Date(`${block.start.date}T${block.start.time}`);
    const confirmedStart = new Date(event.confirmed.start);

    return blockStart.getTime() === confirmedStart.getTime();
  };

  return (
    <div className="space-y-4">
      {/* Required Attendees Filter Indicator */}
      {event.requiredAttendees.length > 0 && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                ⭐ 필수 참여자 필터 적용 중:
              </span>
              <div className="flex flex-wrap gap-1">
                {event.requiredAttendees.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-xs text-blue-700">
              이 참여자들이 모두 가능한 시간만 표시됩니다
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          최적 시간대 (최소 {formatDuration(event.duration)} 필요)
        </h3>
        {blocks.length > 0 && (
          <div className="text-sm text-gray-600">
            {blocks.length}개의 연속 시간 블록 발견
          </div>
        )}
      </div>

      {event.votes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          아직 투표가 없습니다. 참여자들의 투표를 기다려주세요.
        </div>
      ) : blocks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          요구 시간({formatDuration(event.duration)})을 만족하는 연속된 시간 블록이
          없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timeline bars */}
          <div className="grid grid-cols-1 gap-3">
            {topBlocks.map((block, index) => {
              const heightPercent = (block.availableCount / maxCount) * 100;
              const isSelected = selectedBlock?.start.id === block.start.id;

              return (
                <div
                  key={`${block.start.id}-${block.end.id}`}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 font-semibold rounded-full text-sm">
                      {index + 1}
                    </div>

                    {/* Bar container */}
                    <div className="flex-1 h-12 bg-gray-100 rounded-lg overflow-hidden relative">
                      <button
                        onClick={() => handleBlockClick(block)}
                        className={`h-full transition-all hover:opacity-80 focus:outline-none focus:ring-2 ${
                          isConfirmedBlock(block)
                            ? 'ring-2 ring-yellow-500'
                            : isSelected
                            ? 'ring-2 ring-blue-500'
                            : ''
                        }`}
                        style={{
                          width: `${heightPercent}%`,
                          backgroundColor: isConfirmedBlock(block) ? '#fbbf24' : '#3b82f6', // yellow-400 or blue-500
                          boxShadow: isConfirmedBlock(block) ? '0 0 10px rgba(251, 191, 36, 0.5)' : undefined,
                        }}
                      >
                        <span className="ml-3 text-white font-medium text-sm flex items-center gap-1">
                          {isConfirmedBlock(block) && <span>✅</span>}
                          {block.availableCount}명
                        </span>
                      </button>
                    </div>

                    {/* Time and duration */}
                    <div className="flex-shrink-0 text-sm text-gray-700 w-48">
                      <div className="font-medium">{formatBlockTime(block.start, block.end)}</div>
                      <div className="text-gray-500">{formatDuration(block.duration)}</div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isSelected && (
                    <div className="ml-11 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-blue-900">시간:</span>
                          <span className="ml-2 text-blue-700">
                            {formatBlockTime(block.start, block.end)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-900">지속시간:</span>
                          <span className="ml-2 text-blue-700">
                            {formatDuration(block.duration)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-900">
                            참여 가능 인원:
                          </span>
                          <span className="ml-2 text-blue-700">
                            {block.availableCount}명 / {event.votes.length}명
                          </span>
                        </div>
                        {block.participants.length > 0 && (
                          <div>
                            <div className="font-medium text-blue-900 mb-1">
                              참여 가능한 사람:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {block.participants.map((name) => (
                                <span
                                  key={name}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Confirm button */}
                        {!event.confirmed && (
                          <div className="mt-4 pt-3 border-t border-blue-200">
                            <button
                              onClick={() => handleConfirm(block)}
                              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              이 시간으로 확정하기
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {blocks.length > 10 && (
            <div className="text-center text-sm text-gray-500">
              상위 10개 시간대만 표시됩니다 (총 {blocks.length}개)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
