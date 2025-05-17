// src/components/notifications/notification-form.tsx
'use client';

import { FormEvent, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReactSelect from 'react-select';
import { usePushUsers, useSendNotification, PushUser } from '@/hooks/use-push';
import type { NotificationFormData } from '@/types/push';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Smartphone } from 'lucide-react';

interface NotificationFormProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export function NotificationForm({
  open,
  onOpenChangeAction,
}: NotificationFormProps) {
  const { data: users = [] } = usePushUsers();
  const { mutate: sendNotification, isPending } = useSendNotification();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    body: '',
    target_type: 'all',
    data: {
      action: 'open',
    },
  });
  const [showPreview, setShowPreview] = useState(false);

  // Filter users with announcements enabled and format user options with more details
  const userOptions = (users as PushUser[])
    // Sort users by last_active_at (most recent first)
    .sort((a, b) => {
      const dateA = new Date(a.last_active_at || 0);
      const dateB = new Date(b.last_active_at || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .filter(user => {
      // Only require push_token to be present
      return !!user.push_token;
    })
    .map(user => {
      // Get last 5 characters of push token if available
      const tokenSuffix = user.push_token
        ? `...${user.push_token.slice(-5)}`
        : 'no token';

      // Format device info
      const deviceInfo = user.device_info || {};
      const deviceModel = deviceInfo.deviceModel || 'Unknown model';
      const appVersion = deviceInfo.appVersion || 'Unknown version';

      // Ensure device_id exists and is a string
      const deviceIdPrefix = typeof user.device_id === 'string'
        ? user.device_id.slice(0, 8)
        : 'unknown';

      // Format last active date
      const lastActive = user.last_active_at
        ? new Date(user.last_active_at).toLocaleDateString()
        : 'unknown';

      return {
        label: `${deviceInfo.deviceName || 'Device'} (${deviceInfo.osName || 'Unknown OS'}) - ${deviceModel} - v${appVersion} - ID: ${deviceIdPrefix}... - Token: ${tokenSuffix} - Last active: ${lastActive}`,
        value: user.id,
      };
    });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const notificationData: NotificationFormData = {
      ...formData,
      target_users: formData.target_type === 'specific_users' ? selectedUsers : undefined,
    };

    sendNotification(notificationData, {
      onSuccess: () => {
        onOpenChangeAction(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      target_type: 'all',
      data: {
        action: 'open',
      },
    });
    setSelectedUsers([]);
    setShowPreview(false);
  };

  const handleTargetTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      target_type: value as 'all' | 'specific_users',
    }));
  };

  const handleUserSelectionChange = (
    selected: readonly { label: string; value: string }[] | null
  ) => {
    setSelectedUsers(selected ? selected.map((item) => item.value) : []);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Push Notification</DialogTitle>
          <DialogDescription>
            Send a push notification to all users or specific users.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="body" className="text-right">
                Message
              </Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={e =>
                  setFormData({ ...formData, body: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target-type" className="text-right">
                Send to
              </Label>
              <Select
                value={formData.target_type}
                onValueChange={handleTargetTypeChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="specific_users">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.target_type === 'specific_users' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="users" className="text-right">
                  Users
                </Label>
                <div className="col-span-3">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {userOptions.length} users with announcements enabled
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Select all users with active tokens
                        const usersWithTokens = (users as PushUser[])
                          .filter(u => u.push_token)
                          .map(u => u.id);
                        setSelectedUsers(usersWithTokens);
                      }}
                    >
                      Select all with tokens
                    </Button>
                  </div>
                  <ReactSelect
                    isMulti
                    name="users"
                    options={userOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={handleUserSelectionChange}
                    placeholder="Select users..."
                    isSearchable={true}
                    value={userOptions.filter(option => selectedUsers.includes(option.value))}
                    filterOption={(option, inputValue) => {
                      const label = option.label.toLowerCase();
                      const input = inputValue.toLowerCase();
                      return label.includes(input);
                    }}
                    formatOptionLabel={({ label }) => {
                      // Parse the label to extract different parts
                      const parts = label.split(' - ');
                      const devicePart = parts[0] || '';
                      const modelPart = parts[1] || '';
                      const versionPart = parts[2] || '';
                      const idPart = parts[3] || '';
                      const tokenPart = parts[4] || '';
                      const lastActivePart = parts[5] || '';

                      return (
                        <div className="flex flex-col py-1">
                          <div className="font-medium">{devicePart}</div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                            <span>{modelPart}</span>
                            <span>{versionPart}</span>
                            <span className="text-blue-500">{idPart}</span>
                            <span className="text-green-500">{tokenPart}</span>
                            <span className="text-orange-500">{lastActivePart}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>
            </div>

            {showPreview && (
              <div className="col-span-4 mt-2">
                <h3 className="text-sm font-medium mb-2">Notification Preview</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{formData.title || 'Notification Title'}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formData.body || 'Notification message will appear here'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">now</div>
                    </div>
                  </CardContent>
                </Card>
                <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    <span>
                      {formData.target_type === 'all'
                        ? `Will be sent to all users (${userOptions.length})`
                        : `Will be sent to ${selectedUsers.length} selected users`}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formData.target_type === 'all'
                      ? `${(users as PushUser[]).filter(u => u.push_token).length} users have active push tokens`
                      : `${selectedUsers.length > 0
                        ? (users as PushUser[])
                          .filter(u => selectedUsers.includes(u.id) && u.push_token)
                          .length
                        : 0} selected users have active push tokens`}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChangeAction(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Sending...' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
