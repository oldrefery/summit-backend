// src/app/events/new/page.tsx
import { Metadata } from 'next';
import { EventForm } from '@/components/events/event-form';

export const metadata: Metadata = {
  title: 'Create New Event',
  description: 'Create a new event in the system',
};

export default function NewEventPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
      <EventForm />
    </div>
  );
}
