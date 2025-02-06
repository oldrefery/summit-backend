// src/app/sections/page.tsx
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
import { SectionFilters } from '@/components/sections/section-filters';
import { SectionForm } from '@/components/sections/section-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import { useSections } from '@/hooks/use-sections';
import type { Section } from '@/types';
import { CalendarDays, Plus } from 'lucide-react';

type SortKey = 'name' | 'date';
type SortOrder = 'asc' | 'desc';

export default function SectionsPage() {
  const { data: sections = [], isLoading, deleteSection } = useSections();
  const [selectedSection, setSelectedSection] = useState<Section | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedSections = useMemo(() => {
    let result = [...sections];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(section =>
        section.name.toLowerCase().includes(query)
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
  }, [sections, searchQuery, sortKey, sortOrder]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const handleDelete = async () => {
    if (sectionToDelete?.id) {
      try {
        await deleteSection.mutateAsync(sectionToDelete.id);
        setSectionToDelete(null);
      } catch (error) {
        console.error('Failed to delete section:', error);
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
            <CalendarDays className="h-6 w-6" />
            <CardTitle>Sections</CardTitle>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </CardHeader>
        <CardContent>
          <SectionFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalResults={filteredAndSortedSections.length}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {filteredAndSortedSections.length === 0 ? (
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead className="w-[30%]">Date</TableHead>
                    <TableHead className="w-[20%]">Created</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSections.map(section => (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium">
                        {section.name}
                      </TableCell>
                      <TableCell>{formatDate(section.date)}</TableCell>
                      <TableCell>
                        {format(new Date(section.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSection(section);
                              setIsFormOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSectionToDelete(section)}
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

      <SectionForm
        section={selectedSection}
        open={isFormOpen}
        onOpenChange={open => {
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
