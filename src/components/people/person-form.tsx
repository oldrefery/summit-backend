// src/components/people/person-form.tsx
'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { usePeople } from '@/hooks/use-people';
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
import { Person, PersonRole } from '@/types';
import { isToastActive } from '@/components/ui/use-toast';

interface PersonFormProps {
  person?: Partial<Person>;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSuccess?: () => void;
}

type FileImage = File | null | undefined;

export function PersonForm({
  person,
  open,
  onOpenChangeAction,
  onSuccess,
}: PersonFormProps) {
  const { createPerson, updatePerson } = usePeople();
  const { showError, showSuccess } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    title: string;
    company: string;
    role: PersonRole;
    country: string;
    email: string;
    mobile: string;
    bio: string;
    photo_url: string;
  }>({
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
  const [photoFile, setPhotoFile] = useState<FileImage>(undefined);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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
    setIsDirty(false);
  }, [person]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isDirty) {
        if (
          window.confirm(
            'You have unsaved changes. Are you sure you want to leave?'
          )
        ) {
          setPhotoFile(undefined);
          setIsDirty(false);
          onOpenChangeAction(false);
        }
      } else {
        setPhotoFile(undefined);
        setIsDirty(false);
        onOpenChangeAction(open);
      }
    },
    [isDirty, onOpenChangeAction]
  );

  const validateEmail = (email: string): boolean => {
    return email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showError('Name is required');
      return false;
    }

    if (formData.email && !validateEmail(formData.email)) {
      showError('Invalid email address');
      return false;
    }

    if (formData.mobile && !/^\+?[\d\s-]+$/.test(formData.mobile)) {
      showError('Invalid mobile number format');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const baseData = { ...formData };

      if (photoFile) {
        if (person?.photo_url) {
          try {
            await storage.removeAvatar(person.photo_url);
          } catch (removeError) {
            showError(
              'Failed to remove old photo. Please try again.' + removeError
            );
          }
        }

        const userId = person?.id || 'new';
        const newName = `user-${userId}-${Date.now()}`;
        const newPhotoUrl = await storage.uploadAvatar(photoFile, newName);

        if (!newPhotoUrl) {
          showError('Failed to upload photo: URL not received');
          setIsSubmitting(false);
          return;
        }

        baseData.photo_url = newPhotoUrl;
      } else if (photoFile === null) {
        baseData.photo_url = '';
        if (person?.photo_url) {
          try {
            await storage.removeAvatar(person.photo_url);
          } catch (removeError) {
            showError(
              'Failed to remove old photo. Please try again.' + removeError
            );
          }
        }
      } else {
        baseData.photo_url = person?.photo_url || '';
      }

      if (person?.id) {
        await updatePerson.mutateAsync({
          id: person.id,
          data: baseData,
        });
        if (!isToastActive('person-updated')) {
          showSuccess('Person updated successfully');
        }
      } else {
        await createPerson.mutateAsync(baseData);
        if (!isToastActive('person-created')) {
          showSuccess('Person created successfully');
        }
      }

      setIsDirty(false);
      onOpenChangeAction(false);
      onSuccess?.();
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);

    if (name === 'email') {
      if (!validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const handlePhotoChange = useCallback((file: File | null) => {
    setPhotoFile(file);
    setIsDirty(true);
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
        <form role="form" onSubmit={handleSubmit}>
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
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="w-full rounded-md border p-2 mt-1"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="attendee">Attendee</option>
                <option value="speaker">Speaker</option>
              </select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 ${emailError ? 'border-red-500' : ''}`}
              />
              {emailError && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="+1234567890"
              />
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
            <Button
              type="submit"
              disabled={isSubmitting || !!emailError}
              className="min-w-[80px]"
            >
              {isSubmitting ? 'Saving...' : person?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
