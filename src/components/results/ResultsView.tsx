import type { Event } from '@/types';
import { Heatmap } from './Heatmap';
import { Timeline } from './Timeline';

interface ResultsViewProps {
  event: Event;
}

export function ResultsView({ event }: ResultsViewProps) {
  return (
    <div className="space-y-8">
      {/* Heatmap Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Heatmap event={event} />
      </div>

      {/* Timeline Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Timeline event={event} />
      </div>
    </div>
  );
}
