import toast from 'react-hot-toast';
import type { Event } from '@/types';
import { Heatmap } from './Heatmap';
import { Timeline } from './Timeline';
import { ConfirmedBanner } from './ConfirmedBanner';
import { unconfirmTime } from '@/services/storage';

interface ResultsViewProps {
  event: Event;
  onEventChange?: (updatedEvent: Event) => void;
}

export function ResultsView({ event, onEventChange }: ResultsViewProps) {
  const handleUnconfirm = () => {
    if (!confirm('확정을 취소하시겠습니까?')) {
      return;
    }

    try {
      const updatedEvent = unconfirmTime(event.id);
      if (onEventChange) {
        onEventChange(updatedEvent);
      }
      toast.success('확정이 취소되었습니다');
    } catch (error) {
      toast.error('확정 취소에 실패했습니다');
    }
  };

  return (
    <div className="space-y-8">
      {/* Confirmed Time Banner */}
      {event.confirmed && (
        <ConfirmedBanner event={event} onUnconfirm={handleUnconfirm} />
      )}

      {/* Heatmap Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Heatmap event={event} />
      </div>

      {/* Timeline Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Timeline event={event} {...(onEventChange && { onEventChange })} />
      </div>
    </div>
  );
}
