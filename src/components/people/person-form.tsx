// src/components/people/person-form.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePeople } from '@/hooks/use-query';
import { Person } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface PersonFormProps {
  person?: Partial<Person>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PersonForm({
  person,
  open,
  onOpenChange,
  onSuccess,
}: PersonFormProps) {
  const { createPerson, updatePerson } = usePeople();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    role: 'attendee',
    country: '',
    email: '',
    mobile: '',
    bio: '',
  });

  useEffect(() => {
    if (person) {
      setFormData({
        name: person.name || '',
        title: person.title || '',
        company: person.company || '',
        role: person.role || 'attendee',
        country: person.country || '',
        email: person.email || '',
        mobile: person.mobile || '',
        bio: person.bio || '',
      });
    } else {
      // Reset the form when create a new person
      setFormData({
        name: '',
        title: '',
        company: '',
        role: 'attendee',
        country: '',
        email: '',
        mobile: '',
        bio: '',
      });
    }
  }, [person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (person?.id) {
        console.log('Updating person:', { id: person.id, data: formData }); // Для отладки
        await updatePerson.mutateAsync({
          id: person.id,
          data: {
            name: formData.name,
            title: formData.title,
            company: formData.company,
            role: formData.role,
            country: formData.country,
            email: formData.email,
            mobile: formData.mobile,
            bio: formData.bio,
          },
        });
      } else {
        await createPerson.mutateAsync({
          name: formData.name,
          title: formData.title,
          company: formData.company,
          role: formData.role,
          country: formData.country,
          email: formData.email,
          mobile: formData.mobile,
          bio: formData.bio,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving person:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white text-black"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-black">
            {person?.id ? 'Edit Person' : 'Add Person'}
          </DialogTitle>
          <DialogDescription id="dialog-description" className="text-gray-600">
            {person?.id
              ? 'Edit person details below.'
              : 'Add new person details below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="w-full rounded-md border p-2"
                value={formData.role}
                onChange={e =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="attendee">Attendee</option>
                <option value="speaker">Speaker</option>
              </select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={e =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={e =>
                  setFormData({ ...formData, country: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
