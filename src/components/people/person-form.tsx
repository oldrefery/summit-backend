// src/components/people/person-form.tsx
'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { usePeople } from '@/hooks/use-query';
import { Person } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToastContext } from '@/components/providers/toast-provider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { storage } from '@/lib/supabase';

interface PersonFormProps {
  person?: Partial<Person>;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PersonForm({
  person,
  open,
  onOpenChangeAction,
  onSuccess,
}: PersonFormProps) {
  const { createPerson, updatePerson } = usePeople();
  const { showError } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    role: 'attendee',
    country: '',
    email: '',
    mobile: '',
    bio: '',
    photo_url: '',
  });
  const [emailError, setEmailError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null | undefined>(
    undefined
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        //Resetting the state on form closing
        setPhotoFile(undefined);
      }
      onOpenChangeAction(open);
    },
    [onOpenChangeAction]
  );

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
        photo_url: person.photo_url || '',
      });
      setPhotoFile(undefined);
    } else {
      setFormData({
        name: '',
        title: '',
        company: '',
        role: 'attendee',
        country: '',
        email: '',
        mobile: '',
        bio: '',
        photo_url: '',
      });
      setPhotoFile(undefined);
    }
    setEmailError('');
  }, [person]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseData = { ...formData };

      if (photoFile) {
        try {
          console.log('Handling photo upload...');

          if (person?.photo_url) {
            console.log('Removing old photo:', person.photo_url);
            try {
              await storage.removeAvatar(person.photo_url);
            } catch (removeError) {
              console.warn('Error removing old avatar:', removeError);
            }
          }

          const userId = person?.id || 'new';
          const newPhotoUrl = await storage.uploadAvatar(
            photoFile,
            `user-${userId}-${Date.now()}`
          );
          console.log('New photo uploaded:', newPhotoUrl);

          if (!newPhotoUrl) {
            throw new Error('Failed to get photo URL after upload');
          }

          baseData.photo_url = newPhotoUrl;
        } catch (uploadError) {
          console.error('Error handling photo:', uploadError);
          showError('Failed to upload photo. Please try again.');
          setIsSubmitting(false);
          return;
        }
      } else if (photoFile === null) {
        // If photoFile === null, it means that the user deleted the photo
        baseData.photo_url = '';

        // Delete the old photo if there was one
        if (person?.photo_url) {
          try {
            await storage.removeAvatar(person.photo_url);
          } catch (removeError) {
            console.warn('Error removing old avatar:', removeError);
          }
        }
      } else {
        baseData.photo_url = person?.photo_url || '';
      }

      console.log('Saving data:', baseData);

      if (person?.id) {
        await updatePerson.mutateAsync({
          id: person.id,
          data: baseData,
        });
      } else {
        await createPerson.mutateAsync(baseData);
      }

      onOpenChangeAction(false);
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to save person'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    return email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePhotoChange = useCallback((file: File | null) => {
    console.log('Photo changed:', file);
    setPhotoFile(file);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white text-black">
        <DialogHeader>
          <DialogTitle>{person?.id ? 'Edit Person' : 'Add Person'}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {person?.id
              ? 'Edit person details below.'
              : 'Add new person details below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <ImageUpload
              onChange={handlePhotoChange}
              value={person?.photo_url}
              className="mb-4"
            />
            <div>
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
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
                className="w-full rounded-md border p-2 mt-1"
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
                className="mt-1"
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
                className="mt-1"
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
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                className={`mt-1 ${emailError ? 'border-red-500' : ''}`}
              />
              {emailError && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !!emailError}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
