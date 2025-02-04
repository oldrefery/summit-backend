// src/app/events/[id]/edit/edit-client.tsx
'use client';

import { useEvent } from '@/hooks/use-events';
import { EventForm } from '@/components/events/event-form';

interface EditEventClientProps {
  id: string;
}

export default function EditEventClient({ id }: EditEventClientProps) {
  const { data: event, isLoading } = useEvent(parseInt(id));

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-32 flex items-center justify-center">
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <div className="h-32 flex items-center justify-center">
          <p className="text-muted-foreground">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Edit Event</h1>
      <EventForm initialData={event} />
    </div>
  );
}
