// src/components/locations/location-form.tsx
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
import { useLocations } from '@/hooks/use-locations';
import type { Location, LocationFormData } from '@/types';

interface LocationFormProps {
  location?: Location;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export function LocationForm({
  location,
  open,
  onOpenChangeAction,
}: LocationFormProps) {
  const { showError } = useToastContext();
  const { createLocation, updateLocation } = useLocations();
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    link_map: null,
    link: null,
    link_address: null,
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        link_map: location.link_map,
        link: location.link,
        link_address: location.link_address,
      });
    } else {
      setFormData({
        name: '',
        link_map: null,
        link: null,
        link_address: null,
      });
    }
    setIsDirty(false);
  }, [location]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      showError('Name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (location?.id) {
        await updateLocation.mutateAsync({
          id: location.id,
          data: formData,
        });
      } else {
        await createLocation.mutateAsync(formData);
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
            {location ? 'Edit Location' : 'Create New Location'}
          </DialogTitle>
          <DialogDescription>
            {location
              ? 'Edit location details below.'
              : 'Enter the details for the new location.'}
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
              <Label htmlFor="link_map">Map Link</Label>
              <Input
                id="link_map"
                type="url"
                value={formData.link_map || ''}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    link_map: e.target.value || null,
                  }));
                  setIsDirty(true);
                }}
                placeholder="https://"
              />
            </div>

            <div>
              <Label htmlFor="link_address">Address Link</Label>
              <Input
                id="link_address"
                type="url"
                value={formData.link_address || ''}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    link_address: e.target.value || null,
                  }));
                  setIsDirty(true);
                }}
                placeholder="https://"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createLocation.isPending || updateLocation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createLocation.isPending || updateLocation.isPending}
            >
              {createLocation.isPending || updateLocation.isPending
                ? 'Saving...'
                : location
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
