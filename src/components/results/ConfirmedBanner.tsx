import { format } from 'date-fns';
import type { Event } from '@/types';

interface ConfirmedBannerProps {
  event: Event;
  onUnconfirm: () => void;
}

export function ConfirmedBanner({ event, onUnconfirm }: ConfirmedBannerProps) {
  if (!event.confirmed) return null;

  const startDate = new Date(event.confirmed.start);
  const endDate = new Date(event.confirmed.end);
  const confirmedAtDate = new Date(event.confirmed.confirmedAt);

  return (
    <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">✅</span>
            <h2 className="text-2xl font-bold text-gray-900">회의 시간이 확정되었습니다!</h2>
          </div>

          <div className="space-y-2 text-gray-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-yellow-800">날짜/시간:</span>
              <span className="text-lg font-medium">
                {format(startDate, 'yyyy년 M월 d일 (EEE) HH:mm')} -{' '}
                {format(endDate, 'HH:mm')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-yellow-800">소요 시간:</span>
              <span>{event.duration}분</span>
            </div>

            {event.confirmed.note && (
              <div className="mt-3 p-3 bg-white rounded-md border border-yellow-200">
                <span className="font-semibold text-yellow-800 block mb-1">메모:</span>
                <p className="text-gray-700">{event.confirmed.note}</p>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              {event.confirmed.confirmedBy}님이{' '}
              {format(confirmedAtDate, 'M월 d일 HH:mm')}에 확정하였습니다
            </div>
          </div>
        </div>

        <button
          onClick={onUnconfirm}
          className="ml-4 rounded-md bg-white border border-yellow-600 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          확정 취소
        </button>
      </div>
    </div>
  );
}
