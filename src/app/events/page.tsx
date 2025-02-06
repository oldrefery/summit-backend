// src/app/events/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/hooks/use-events';
import { Skeleton } from '@/components/ui/skeleton';
import { useToastContext } from '@/components/providers/toast-provider';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { EventFilters } from '@/components/events/event-filters';
import { EventsTable } from '@/components/events/events-table';
import { CalendarDays, Plus } from 'lucide-react';
import type { Event } from '@/types';

export default function EventsPage() {
  const { data: events = [], isLoading, isError, deleteEvent } = useEvents();
  const { showError, showSuccess } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  useEffect(() => {
    if (isError) {
      showError('Failed to load events. Please try again later.');
    }
  }, [isError, showError]);

  const sortedAndFilteredEvents = events
    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(
      event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.section.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleDeleteConfirm = async () => {
    if (eventToDelete) {
      try {
        await deleteEvent.mutateAsync(eventToDelete.id);
        setEventToDelete(null);
        showSuccess('Event deleted successfully');
      } catch (error) {
        showError(error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-md" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            <CardTitle>Events</CardTitle>
          </div>
          <Link href="/events/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <EventFilters
            searchQuery={searchTerm}
            onSearchChangeAction={setSearchTerm}
            totalResults={sortedAndFilteredEvents?.length || 0}
          />

          {sortedAndFilteredEvents?.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? 'No events match your search. Try different keywords.'
                  : 'There are no events yet. Create your first one!'}
              </p>
              <Link href="/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <EventsTable
                events={sortedAndFilteredEvents}
                onDeleteAction={setEventToDelete}
              />
            </div>
          )}
        </CardContent>
      </Card>

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
