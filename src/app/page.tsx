// src/app/page.tsx
'use client';

import { usePeople } from '@/hooks/use-query';
import { useEvents } from '@/hooks/use-events';
import { useLocations } from '@/hooks/use-locations';
import { useMarkdownPages } from '@/hooks/use-markdown';
import { useResources } from '@/hooks/use-resources';
import { useSections } from '@/hooks/use-sections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  CalendarDays,
  MapPin,
  FileText,
  Files,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { Event } from '@/types';

const getUpcomingEventsCount = (events: Event[] = []) => {
  return events.filter(e => new Date(e.date) > new Date()).length;
};

export default function DashboardPage() {
  const { data: people, isLoading: peopleLoading } = usePeople();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: resources, isLoading: resourcesLoading } = useResources();
  const { data: sections, isLoading: sectionsLoading } = useSections();
  const { data: markdownPages, isLoading: markdownLoading } =
    useMarkdownPages();

  const stats = [
    {
      title: 'People',
      value: people?.length || 0,
      loading: peopleLoading,
      icon: Users,
      description: `${people?.filter(p => p.role === 'speaker')?.length || 0} speakers`,
      href: '/people',
    },
    {
      title: 'Events',
      value: events?.length || 0,
      loading: eventsLoading,
      icon: CalendarDays,
      description: `${getUpcomingEventsCount()} upcoming`,
      href: '/events',
    },
    {
      title: 'Locations',
      value: locations?.length || 0,
      loading: locationsLoading,
      icon: MapPin,
      description: `${locations?.filter(l => l.link_map)?.length || 0} with map`,
      href: '/locations',
    },
    {
      title: 'Resources',
      value: resources?.length || 0,
      loading: resourcesLoading,
      icon: Files,
      description: `${resources?.filter(r => r.is_route)?.length || 0} routes`,
      href: '/resources',
    },
    {
      title: 'Sections',
      value: sections?.length || 0,
      loading: sectionsLoading,
      icon: Layers,
      description: 'Program sections',
      href: '/sections',
    },
    {
      title: 'Pages',
      value: markdownPages?.length || 0,
      loading: markdownLoading,
      icon: FileText,
      description: `${markdownPages?.filter(p => p.published)?.length || 0} published`,
      href: '/pages',
    },
  ];

  const recentActivity = events
    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(event => ({
      title: event.title,
      date: format(new Date(event.date), 'MMM d, yyyy'),
      description: `${event.event_people?.length || 0} speakers`,
    }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link href={stat.href} key={stat.title}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentActivity?.length ? (
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.date}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/people" className="block">
                <Button className="w-full">Add New Person</Button>
              </Link>
              <Link href="/events/new" className="block">
                <Button variant="outline" className="w-full">
                  Create Event
                </Button>
              </Link>
              <Link href="/pages/new" className="block">
                <Button variant="outline" className="w-full">
                  New Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
