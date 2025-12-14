import { useState } from 'react';
import type { Event } from '@/types';
import {
  aggregateVotes,
  findContinuousBlocks,
  formatBlockTime,
  formatDuration,
  type TimeBlock,
} from '@/services/calculation';

interface TimelineProps {
  event: Event;
}

export function Timeline({ event }: TimelineProps) {
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);

  // Aggregate votes and find continuous blocks
  const availability = aggregateVotes(event);
  const blocks = findContinuousBlocks(event, availability, event.duration);

  const maxCount = Math.max(...blocks.map((b) => b.availableCount), 0);

  // Show top 10 blocks
  const topBlocks = blocks.slice(0, 10);

  const handleBlockClick = (block: TimeBlock) => {
    setSelectedBlock(selectedBlock?.start.id === block.start.id ? null : block);
  };

  return (
    <div className="space-y-4">
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
                        className={`h-full transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{
                          width: `${heightPercent}%`,
                          backgroundColor: '#3b82f6', // blue-500
                        }}
                      >
                        <span className="ml-3 text-white font-medium text-sm">
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
