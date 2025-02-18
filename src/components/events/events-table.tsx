// src/components/events/events-table.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, parseISO, parse } from 'date-fns';
import {
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  Users,
  Layers,
} from 'lucide-react';
import type { Event, EventPerson, Person, Location } from '@/types';

interface EventsTableProps {
  events: (Event & {
    location: Location | null;
    event_people: (EventPerson & { person: Person })[];
  })[];
  onDeleteAction: (event: Event) => void;
}

export function EventsTable({ events, onDeleteAction }: EventsTableProps) {
  const formatEventTime = (time: string) => {
    try {
      // Если время невалидное, возвращаем сообщение об ошибке
      if (!time || time === 'invalid') {
        return 'Invalid time';
      }

      // Проверяем, является ли время полной ISO строкой
      if (time.includes('T')) {
        const dateTime = parseISO(time);
        return format(dateTime, 'HH:mm');
      }

      // Проверяем формат времени (HH:mm:ss)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return 'Invalid time';
      }

      // Если это просто время, добавляем фиктивную дату
      const dateTime = parse(time, 'HH:mm:ss', new Date());
      return format(dateTime, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map(event => {
        const speakers = event.event_people
          ?.filter(ep => ep.person?.role === 'speaker')
          .map(ep => ep.person)
          .filter((person): person is Person => person !== undefined);

        return (
          <Card key={event.id} className="relative">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      <Layers className="w-3 h-3 mr-1" />
                      {event.section?.name}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <Link href={`/events/${event.id}/edit`}>
                    <Button size="icon" variant="ghost">
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteAction(event)}
                    aria-label="Delete event"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mt-4">
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
                  <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}

                {speakers && speakers.length > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    <div>
                      {speakers.map(s => (
                        <div key={s.name}>{s.name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
