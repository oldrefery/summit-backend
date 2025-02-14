// src/app/notifications/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationForm } from '@/components/notifications/notification-form';
import { NotificationHistory } from '@/components/notifications/notification-history';
import { NotificationStats } from '@/components/notifications/notification-stats';
import { ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              <CardTitle>Push Notifications</CardTitle>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>Send Notification</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <NotificationStats />
            <NotificationHistory />
            <NotificationForm
              open={isFormOpen}
              onOpenChangeAction={setIsFormOpen}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
