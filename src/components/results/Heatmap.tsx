import { useState } from 'react';
import type { Event, TimeSlot } from '@/types';
import { aggregateVotes, getHeatmapColor, getParticipantsForSlot } from '@/services/calculation';

interface HeatmapProps {
  event: Event;
}

interface TooltipData {
  slot: TimeSlot;
  count: number;
  participants: string[];
  position: { x: number; y: number };
}

export function Heatmap({ event }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Aggregate votes
  const availability = aggregateVotes(event);
  const maxCount = Math.max(...Array.from(availability.values()), 0);

  // Get unique dates
  const dates = Array.from(new Set(event.slots.map((slot) => slot.date))).sort();

  // Get unique times
  const times = Array.from(new Set(event.slots.map((slot) => slot.time))).sort();

  // Create grid data: time x date
  const gridData = times.map((time) => {
    return dates.map((date) => {
      const slot = event.slots.find((s) => s.date === date && s.time === time);
      if (!slot) return null;

      const count = availability.get(slot.id) || 0;
      const color = getHeatmapColor(count, maxCount);

      return {
        slot,
        count,
        color,
      };
    });
  });

  const handleMouseEnter = (
    slot: TimeSlot,
    count: number,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const participants = getParticipantsForSlot(event, slot.id);
    const rect = e.currentTarget.getBoundingClientRect();

    setTooltip({
      slot,
      count,
      participants,
      position: { x: rect.left + rect.width / 2, y: rect.top },
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">투표 결과 히트맵</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>참여자 수:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4" style={{ backgroundColor: '#bbf7d0' }} />
            <span>낮음</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4" style={{ backgroundColor: '#86efac' }} />
            <span>중간</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4" style={{ backgroundColor: '#4ade80' }} />
            <span>높음</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4" style={{ backgroundColor: '#22c55e' }} />
            <span>최고</span>
          </div>
        </div>
      </div>

      {event.votes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          아직 투표가 없습니다. 참여자들의 투표를 기다려주세요.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">
                  시간
                </th>
                {dates.map((date) => (
                  <th
                    key={date}
                    className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 min-w-[80px]"
                  >
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, timeIndex) => (
                <tr key={times[timeIndex]}>
                  <td className="sticky left-0 z-10 bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">
                    {times[timeIndex]}
                  </td>
                  {row.map((cell, dateIndex) => {
                    if (!cell) {
                      return (
                        <td
                          key={`${timeIndex}-${dateIndex}`}
                          className="border border-gray-300"
                        />
                      );
                    }

                    return (
                      <td
                        key={cell.slot.id}
                        className="border border-gray-300 p-0"
                      >
                        <div
                          className="w-full h-12 flex items-center justify-center text-sm font-medium cursor-pointer transition-opacity hover:opacity-80"
                          style={{ backgroundColor: cell.color }}
                          onMouseEnter={(e) =>
                            handleMouseEnter(cell.slot, cell.count, e)
                          }
                          onMouseLeave={handleMouseLeave}
                        >
                          {cell.count > 0 && <span className="text-gray-800">{cell.count}</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs"
          style={{
            left: `${tooltip.position.x}px`,
            top: `${tooltip.position.y - 10}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="space-y-2">
            <div className="font-semibold text-gray-900">
              {tooltip.slot.date} {tooltip.slot.time}
            </div>
            <div className="text-sm text-gray-600">
              {tooltip.count}명 참여 가능
            </div>
            {tooltip.participants.length > 0 && (
              <div className="text-sm">
                <div className="font-medium text-gray-700 mb-1">참여자:</div>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                  {tooltip.participants.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
