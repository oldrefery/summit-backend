// src/components/notifications/notification-form.tsx
'use client';

import { FormEvent, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { usePushUsers, useSendNotification } from '@/hooks/use-push';
import type { NotificationFormData } from '@/types/push';

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

  const userOptions = users.map(user => ({
    label: `${user.device_info.deviceName} (${user.device_info.osName})`,
    value: user.id.toString(),
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendNotification({
      ...formData,
      target_users:
        formData.target_type === 'specific_users' ? selectedUsers : undefined,
    });
    onOpenChangeAction(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Push Notification</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={e =>
                setFormData(prev => ({ ...prev, body: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Send to</Label>
            <Select
              value={formData.target_type}
              onValueChange={value =>
                setFormData(prev => ({
                  ...prev,
                  target_type: value as 'all' | 'specific_users',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="specific_users">Specific Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.target_type === 'specific_users' && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <ReactSelect
                isMulti
                options={userOptions}
                value={userOptions.filter(option =>
                  selectedUsers.includes(option.value)
                )}
                onChange={selected => {
                  setSelectedUsers(
                    selected ? selected.map(option => option.value) : []
                  );
                }}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select users..."
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChangeAction(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                (formData.target_type === 'specific_users' &&
                  selectedUsers.length === 0)
              }
            >
              {isPending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
