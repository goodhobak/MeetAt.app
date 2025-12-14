/**
 * React Router Configuration
 * Hash-based routing for offline support
 */

import { createHashRouter, Navigate } from 'react-router-dom';
import { EventForm } from '@/components/event/EventForm';
import { EventPage } from '@/components/event/EventPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <EventForm />,
  },
  {
    path: '/event/:id',
    element: <EventPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
