// src/components/resources/resource-form.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useResources } from '@/hooks/use-resources';
import type { Resource } from '@/types';

interface ResourceFormProps {
  resource?: Resource;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export function ResourceForm({
  resource,
  open,
  onOpenChangeAction,
}: ResourceFormProps) {
  const { showError } = useToastContext();
  const { createResource, updateResource } = useResources();
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    description: '',
    is_route: false,
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        link: resource.link,
        description: resource.description || '',
        is_route: resource.is_route,
      });
    } else {
      setFormData({
        name: '',
        link: '',
        description: '',
        is_route: false,
      });
    }
    setIsDirty(false);
  }, [resource]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.link.trim()) {
      errors.link = 'Link is required';
    }

    if (!formData.is_route) {
      try {
        new URL(formData.link);
      } catch {
        errors.link = 'Please enter a valid URL';
      }
    }

    console.log(errors);

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => showError(error));
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
      if (resource?.id) {
        await updateResource.mutateAsync({
          id: resource.id,
          data: formData,
        });
      } else {
        await createResource.mutateAsync(formData);
      }

      setIsDirty(false);
      onOpenChangeAction(false);
    } catch (error) {
      showError(error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isDirty) {
      if (
        window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        )
      ) {
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
            {resource ? 'Edit Resource' : 'Create New Resource'}
          </DialogTitle>
          <DialogDescription>
            {resource
              ? 'Edit resource details below.'
              : 'Enter the details for the new resource.'}
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
              <Label htmlFor="link">
                Link <span className="text-red-500">*</span>
              </Label>
              <Input
                id="link"
                value={formData.link}
                onChange={e => {
                  setFormData(prev => ({ ...prev, link: e.target.value }));
                  setIsDirty(true);
                }}
                placeholder={formData.is_route ? '/example-route' : 'https://'}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }));
                  setIsDirty(true);
                }}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_route"
                checked={formData.is_route}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    is_route: e.target.checked,
                  }));
                  setIsDirty(true);
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_route">Use the link as a route</Label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createResource.isPending || updateResource.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createResource.isPending || updateResource.isPending}
            >
              {createResource.isPending || updateResource.isPending
                ? 'Saving...'
                : resource
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
