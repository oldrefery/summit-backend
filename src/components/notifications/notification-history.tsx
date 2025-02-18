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
import type { NotificationHistory } from '@/types/push';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NotificationDetails } from './notification-details';

export function NotificationHistory() {
  const { data: notifications = [], isLoading } = useNotificationHistory();

  if (isLoading) {
    return <Skeleton className="h-64" data-testid="skeleton" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notification History</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Sent At</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
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
  notification: NotificationHistory;
}

export function NotificationRow({ notification }: NotificationRowProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <TableRow>
      <TableCell>{notification.title}</TableCell>
      <TableCell>{format(new Date(notification.sent_at), 'PPp')}</TableCell>
      <TableCell>
        {notification.target_type === 'all'
          ? 'All Users'
          : `${notification.target_users.length} users`}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="default">
            {notification.success_count} delivered
          </Badge>
          {notification.failure_count > 0 && (
            <Badge variant="destructive">
              {notification.failure_count} failed
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDetailsOpen(true)}
        >
          View Details
        </Button>
      </TableCell>

      <NotificationDetails
        notification={notification}
        open={isDetailsOpen}
        onOpenChangeAction={setIsDetailsOpen}
      />
    </TableRow>
  );
}
