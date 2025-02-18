// src/app/locations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationFilters } from '@/components/locations/location-filters';
import { LocationForm } from '@/components/locations/location-form';
import { LocationsTable } from '@/components/locations/locations-table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { useLocations } from '@/hooks/use-locations';
import { useToastContext } from '@/components/providers/toast-provider';
import { useSortFilter } from '@/hooks/use-sort-filter';
import type { Location } from '@/types';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';

export default function LocationsPage() {
  const {
    data: locations = [],
    isLoading,
    isError,
    deleteLocation,
  } = useLocations();
  const { showError } = useToastContext();
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null
  );

  const {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortOrder,
    handleSort,
    filteredAndSorted: filteredLocations,
  } = useSortFilter<Location>(locations, {
    initialSortKey: 'name',
    searchField: 'name',
  });

  useEffect(() => {
    if (isError) {
      showError('Failed to load locations. Please try again later.');
    }
  }, [isError, showError]);

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (locationToDelete?.id) {
      try {
        await deleteLocation.mutateAsync(locationToDelete.id);
        setLocationToDelete(null);
      } catch (error) {
        showError(error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" role="status" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-md" role="status" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" role="status" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <MapPin className="h-6 w-6" />
              <CardTitle>Locations</CardTitle>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </CardHeader>
        <CardContent>
          <LocationFilters
            searchQuery={searchQuery}
            onSearchChangeAction={setSearchQuery}
            totalResults={filteredLocations.length}
            sortKey={sortKey as 'name' | 'created_at'}
            sortOrder={sortOrder}
            onSortAction={handleSort}
          />

          {filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No locations found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? 'No locations match your search. Try different keywords.'
                  : 'There are no locations yet. Create your first one!'}
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>
          ) : (
            <div className="relative mt-4">
              <LocationsTable
                locations={filteredLocations}
                onEditAction={handleEdit}
                onDeleteAction={setLocationToDelete}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <LocationForm
        location={selectedLocation}
        open={isFormOpen}
        onOpenChangeAction={(open: boolean) => {
          setIsFormOpen(open);
          if (!open) setSelectedLocation(undefined);
        }}
      />

      <ConfirmDelete
        open={!!locationToDelete}
        onOpenChange={() => setLocationToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Location"
        description={`Are you sure you want to delete "${locationToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
