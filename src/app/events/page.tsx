// src/app/events/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  Plus,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEvents, useDeleteEvent } from '@/hooks/use-events';
import type { Event } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToastContext } from '@/components/providers/toast-provider';
import { ConfirmDelete } from '@/components/ui/confirm-delete';

export default function EventsPage() {
  const { data: events, isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const { showError, showSuccess } = useToastContext();

  // Filter events based on search term
  const sortedAndFilteredEvents = events
    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(
      event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.section.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
  };

  const handleDeleteConfirm = async () => {
    if (eventToDelete) {
      try {
        await deleteEvent.mutateAsync(eventToDelete.id);
        setEventToDelete(null);
        showSuccess('Event deleted successfully');
      } catch (error) {
        console.error('Failed to delete event:', error);
        showError(error);
      }
    }
  };

  const formatEventTime = (time: string) => {
    try {
      const dateTime = parseISO(time);
      return format(dateTime, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <Link href="/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedAndFilteredEvents?.map(event => (
          <Card key={event.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {event.section}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/events/${event.id}/edit`}>
                    <Button size="icon" variant="ghost">
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteClick(event)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>
                    {format(parseISO(event.date), 'MMMM d, yyyy')} |{' '}
                    {formatEventTime(event.start_time)} -{' '}
                    {formatEventTime(event.end_time)}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    <span>{event.location.name}</span>
                  </div>
                )}
                {event.description && (
                  <p className="text-sm mt-2">{event.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDelete
        open={!!eventToDelete}
        onOpenChange={() => setEventToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Event"
        description={`Are you sure you want to delete "${eventToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
