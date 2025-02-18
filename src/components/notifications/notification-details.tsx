// src/components/notifications/notification-details.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { NotificationHistory } from '@/types/push';
import { format } from 'date-fns';

interface NotificationDetailsProps {
  notification: NotificationHistory | null;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export function NotificationDetails({
  notification,
  open,
  onOpenChangeAction,
}: NotificationDetailsProps) {
  if (!notification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Details</DialogTitle>
          <DialogDescription>
            View detailed information about the notification
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Title</h4>
            <p>{notification.title}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Message</h4>
            <p>{notification.body}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Sent At</h4>
            <p>{format(new Date(notification.sent_at), 'PPPp')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Target</h4>
            <p>
              {notification.target_type === 'all'
                ? 'All Users'
                : `${notification.target_users.length} specific users`}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Additional Data</h4>
            <pre className="mt-2 rounded bg-muted p-4">
              {JSON.stringify(notification.data, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
