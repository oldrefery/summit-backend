// src/app/locations/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LocationFilters } from '@/components/locations/location-filters';
import { LocationForm } from '@/components/locations/location-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { useLocations } from '@/hooks/use-locations';
import type { Location } from '@/types';
import { MapPin, Plus } from 'lucide-react';

type SortKey = 'name' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function LocationsPage() {
  const { data: locations = [], isLoading, deleteLocation } = useLocations();
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedLocations = useMemo(() => {
    let result = [...locations];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(location =>
        location.name.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      const modifier = sortOrder === 'asc' ? 1 : -1;

      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    });

    return result;
  }, [locations, searchQuery, sortKey, sortOrder]);

  const handleDelete = async () => {
    if (locationToDelete?.id) {
      try {
        await deleteLocation.mutateAsync(locationToDelete.id);
        setLocationToDelete(null);
      } catch (error) {
        console.error('Failed to delete location:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-md" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
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
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            <CardTitle>Locations</CardTitle>
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
            totalResults={filteredAndSortedLocations.length}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSortAction={handleSort}
          />

          {filteredAndSortedLocations.length === 0 ? (
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead className="w-[30%]">Address</TableHead>
                    <TableHead className="w-[20%]">Map Link</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedLocations.map(location => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        {location.name}
                      </TableCell>
                      <TableCell>{location.address}</TableCell>
                      <TableCell>{location.link_map ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLocation(location);
                              setIsFormOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setLocationToDelete(location)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <LocationForm
        location={selectedLocation}
        open={isFormOpen}
        onOpenChangeAction={open => {
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
