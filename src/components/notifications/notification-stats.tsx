// src/components/notifications/notification-stats.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePushStatistics } from '@/hooks/use-push';

export function NotificationStats() {
  const { data: stats, isLoading } = usePushStatistics();

  if (isLoading) {
    return <Skeleton className="h-28" role="status" />;
  }

  const metrics = [
    { label: 'Total Users', value: stats?.total_users ?? 0 },
    { label: 'Active Users', value: stats?.active_users ?? 0 },
    { label: 'Active Tokens', value: stats?.active_tokens ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map(metric => (
        <Card key={metric.label}>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
