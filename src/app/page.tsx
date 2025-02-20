// src/app/page.tsx
'use client';

import { usePeople } from '@/hooks/use-people';
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
  Upload,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Event, StatItem } from '@/types';
import { useChanges } from '@/hooks/use-changes';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { usePushStatistics } from '@/hooks/use-push';

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
  const {
    data: changes,
    isLoading: changesLoading,
    publishVersion,
  } = useChanges();
  const { data: pushStats, isLoading: pushStatsLoading } = usePushStatistics();

  const stats: StatItem[] = [
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
    {
      title: 'Push Notifications',
      value: pushStats?.active_tokens ?? 0,
      loading: pushStatsLoading,
      icon: Bell,
      description: `${pushStats?.active_users ?? 0} active users`,
      href: '/notifications',
    },
  ];

  const totalChanges = Object.values(changes).reduce((a, b) => a + b, 0);

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
                    <Skeleton className="h-8 w-20" role="status" />
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <CardTitle>Pending Changes</CardTitle>
              </div>
              {totalChanges > 0 && (
                <Badge variant="secondary">{totalChanges} total changes</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {changesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" role="status" />
                <Skeleton className="h-12 w-full" role="status" />
                <Skeleton className="h-12 w-full" role="status" />
              </div>
            ) : Object.entries(changes).some(([, count]) => count > 0) ? (
              <div className="space-y-4">
                {Object.entries(changes).map(([entity, count]) =>
                  count > 0 ? (
                    <div
                      key={entity}
                      className="flex justify-between items-center"
                    >
                      <p className="capitalize font-medium">
                        {entity.replace('_', ' ')}
                      </p>
                      <Badge>
                        {count} {count === 1 ? 'change' : 'changes'}
                      </Badge>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending changes
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => publishVersion.mutate()}
                disabled={totalChanges === 0 || publishVersion.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Publish New Version
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
