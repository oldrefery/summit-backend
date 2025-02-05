// src/app/events/[id]/edit/edit-client.tsx
'use client';

import { useEvent } from '@/hooks/use-events';
import { EventForm } from '@/components/events/event-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface EditEventClientProps {
  id: string;
}

export default function EditEventClient({ id }: EditEventClientProps) {
  const { data: event, isLoading } = useEvent(parseInt(id));

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
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
