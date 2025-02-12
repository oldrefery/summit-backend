// src/app/resources/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Files, Plus } from 'lucide-react';
import { useResources } from '@/hooks/use-resources';
import { ResourcesTable } from '@/components/resources/resources-table';
import { ResourceFilters } from '@/components/resources/resource-filters';
import { ResourceForm } from '@/components/resources/resource-form';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { useToastContext } from '@/components/providers/toast-provider';
import type { Resource } from '@/types';
import Link from 'next/link';

export default function ResourcesPage() {
  const { data: resources = [], isLoading, deleteResource } = useResources();
  const { showError } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoutesOnly, setShowRoutesOnly] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(
    null
  );

  const filteredResources = resources.filter(
    resource =>
      (!showRoutesOnly || resource.is_route) &&
      (resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (resourceToDelete?.id) {
      try {
        await deleteResource.mutateAsync(resourceToDelete.id);
        setResourceToDelete(null);
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
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-2">
              <Files className="h-6 w-6" />
              <CardTitle>Resources</CardTitle>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </CardHeader>
        <CardContent>
          <ResourceFilters
            searchQuery={searchTerm}
            onSearchChangeAction={setSearchTerm}
            totalResults={filteredResources.length}
            showRoutesOnly={showRoutesOnly}
            onRoutesToggleAction={() => setShowRoutesOnly(!showRoutesOnly)}
          />

          {filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <Files className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No resources found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || showRoutesOnly
                  ? 'Try adjusting your filters'
                  : 'Create your first resource'}
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <ResourcesTable
                resources={filteredResources}
                onEditAction={handleEdit}
                onDeleteAction={setResourceToDelete}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ResourceForm
        resource={selectedResource}
        open={isFormOpen}
        onOpenChangeAction={(open: boolean) => {
          setIsFormOpen(open);
          if (!open) setSelectedResource(undefined);
        }}
      />

      <ConfirmDelete
        open={!!resourceToDelete}
        onOpenChange={() => setResourceToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Resource"
        description={`Are you sure you want to delete "${resourceToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
