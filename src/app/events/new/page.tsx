// src/app/events/new/page.tsx
'use client';

import { EventForm } from '@/components/events/event-form';

export default function NewEventPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
      <EventForm />
    </div>
  );
}
