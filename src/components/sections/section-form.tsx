// src/components/sections/section-form.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
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
import { useToastContext } from '@/components/providers/toast-provider';
import { useSections } from '@/hooks/use-sections';
import type { Section } from '@/types';
import { FORM_VALIDATION } from '@/app/constants';

interface SectionFormProps {
  section?: Section;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export function SectionForm({
  section,
  open,
  onOpenChangeAction,
}: SectionFormProps) {
  const { showError } = useToastContext();
  const { createSection, updateSection } = useSections();
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
  });

  useEffect(() => {
    if (section) {
      setFormData({
        name: section.name,
        date: section.date,
      });
    } else {
      // Initialize with current date for new sections
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setIsDirty(false);
  }, [section]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      showError('Name is required');
      return false;
    }

    if (!formData.date) {
      showError('Date is required');
      return false;
    }

    // Validate date format (YYYY-MM-DD)
    if (!FORM_VALIDATION.DATE_FORMAT.test(formData.date)) {
      showError('Invalid date format. Use YYYY-MM-DD');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (section?.id) {
        await updateSection.mutateAsync({
          id: section.id,
          data: formData,
        });
      } else {
        await createSection.mutateAsync(formData);
      }

      setIsDirty(false);
      onOpenChangeAction(false);
    } catch (error) {
      showError(error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isDirty) {
      if (window.confirm(FORM_VALIDATION.UNSAVED_CHANGES_MESSAGE)) {
        setIsDirty(false);
        onOpenChangeAction(false);
      }
    } else {
      onOpenChangeAction(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {section ? 'Edit Section' : 'Create New Section'}
          </DialogTitle>
          <DialogDescription>
            {section
              ? 'Edit section details below.'
              : 'Enter the details for the new section.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  setIsDirty(true);
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => {
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                  setIsDirty(true);
                }}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createSection.isPending || updateSection.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSection.isPending || updateSection.isPending}
            >
              {createSection.isPending || updateSection.isPending
                ? 'Saving...'
                : section
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
