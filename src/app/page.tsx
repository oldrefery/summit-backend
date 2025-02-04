// src/app/page.tsx
'use client';

import { usePeople } from '@/hooks/use-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarDays, MapPin, BellRing } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: people } = usePeople();

  const stats = [
    {
      title: 'Total People',
      value: people?.length || 0,
      icon: Users,
      description: `${people?.filter(p => p.role === 'speaker')?.length || 0} speakers`,
      href: '/people',
    },
    {
      title: 'Events',
      value: '12', // Здесь будет динамическое значение когда добавим хук useEvents
      icon: CalendarDays,
      description: '3 upcoming',
      href: '/events',
    },
    {
      title: 'Locations',
      value: '4', // Здесь будет динамическое значение когда добавим хук useLocations
      icon: MapPin,
      description: '2 active',
      href: '/locations',
    },
    {
      title: 'Announcements',
      value: '8', // Здесь будет динамическое значение когда добавим хук useAnnouncements
      icon: BellRing,
      description: '3 new',
      href: '/announcements',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Здесь можно добавить дополнительные секции, например: */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Здесь будет список последних действий */}
            <p className="text-sm text-muted-foreground">
              Activity feed will be displayed here
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Здесь будут кнопки быстрых действий */}
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => (window.location.href = '/people')}
              >
                Add New Person
              </Button>

              <Link
                href="/events/new"
                className="block w-full p-2 text-center bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Create Event
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
