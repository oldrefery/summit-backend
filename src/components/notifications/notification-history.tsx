// src/components/notifications/notification-history.tsx
'use client';

import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationHistory } from '@/hooks/use-push';
import type { NotificationHistory as NotificationHistoryType } from '@/types/push';

export function NotificationHistory() {
  const { data: notifications = [], isLoading } = useNotificationHistory();

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notification History</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Sent At</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map(notification => (
            <NotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface NotificationRowProps {
  notification: NotificationHistoryType;
}

function NotificationRow({ notification }: NotificationRowProps) {
  const total = notification.success_count + notification.failure_count;
  const successRate =
    total > 0 ? Math.round((notification.success_count / total) * 100) : 0;

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{notification.title}</div>
          <div className="text-sm text-muted-foreground">
            {notification.body}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {notification.target_type === 'all' ? (
          <Badge>All Users</Badge>
        ) : (
          <Badge variant="secondary">
            {notification.target_users.length} users
          </Badge>
        )}
      </TableCell>
      <TableCell>{format(new Date(notification.sent_at), 'PPp')}</TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge variant={successRate >= 90 ? 'default' : 'destructive'}>
            {successRate}% delivered
          </Badge>
          <div className="text-xs text-muted-foreground">
            {notification.success_count} successful,{' '}
            {notification.failure_count} failed
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
