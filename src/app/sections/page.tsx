// src/app/sections/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionFilters } from '@/components/sections/section-filters';
import { SectionForm } from '@/components/sections/section-form';
import { SectionsTable } from '@/components/sections/sections-table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { useSections } from '@/hooks/use-sections';
import { useToastContext } from '@/components/providers/toast-provider';
import { useSortFilter } from '@/hooks/use-sort-filter';
import type { Section } from '@/types';
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react';
import Link from 'next/link';

export default function SectionsPage() {
  const {
    data: sections = [],
    isLoading,
    isError,
    deleteSection,
  } = useSections();
  const { showError } = useToastContext();
  const [selectedSection, setSelectedSection] = useState<Section>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortOrder,
    handleSort,
    filteredAndSorted: filteredSections,
  } = useSortFilter<Section>(sections, {
    initialSortKey: 'date',
    searchField: 'name',
  });

  useEffect(() => {
    if (isError) {
      showError('Failed to load sections. Please try again later.');
    }
  }, [isError, showError]);

  const handleEdit = (section: Section) => {
    setSelectedSection(section);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (sectionToDelete?.id) {
      try {
        await deleteSection.mutateAsync(sectionToDelete.id);
        setSectionToDelete(null);
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
            <div className="mt-4 space-y-4">
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
              <CalendarDays className="h-6 w-6" />
              <CardTitle>Sections</CardTitle>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </CardHeader>
        <CardContent>
          <SectionFilters
            searchQuery={searchQuery}
            onSearchChangeAction={setSearchQuery}
            totalResults={filteredSections.length}
            sortKey={sortKey as 'name' | 'date'}
            sortOrder={sortOrder}
            onSortAction={handleSort}
          />

          {filteredSections.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sections found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? 'No sections match your search. Try different keywords.'
                  : 'There are no sections yet. Create your first one!'}
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          ) : (
            <div className="relative mt-4">
              <SectionsTable
                sections={filteredSections}
                onEditAction={handleEdit}
                onDeleteAction={setSectionToDelete}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <SectionForm
        section={selectedSection}
        open={isFormOpen}
        onOpenChangeAction={(open: boolean) => {
          setIsFormOpen(open);
          if (!open) setSelectedSection(undefined);
        }}
      />

      <ConfirmDelete
        open={!!sectionToDelete}
        onOpenChange={() => setSectionToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Section"
        description={`Are you sure you want to delete "${sectionToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
