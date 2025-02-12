// src/app/pages/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { useMarkdownPages } from '@/hooks/use-markdown';
import { PageFilters } from '@/components/pages/page-filters';
import { PagesTable } from '@/components/pages/pages-table';
import { MarkdownForm } from '@/components/pages/markdown-form';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { useToastContext } from '@/components/providers/toast-provider';
import type { MarkdownPage } from '@/types';
import Link from 'next/link';

export default function PagesPage() {
  const {
    data: pages = [],
    isLoading,
    deleteMarkdownPage,
  } = useMarkdownPages();
  const { showError } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);
  const [selectedPage, setSelectedPage] = useState<MarkdownPage>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<MarkdownPage | null>(null);

  const filteredPages = useMemo(
    () =>
      pages.filter(page => {
        const searchLower = searchTerm.toLowerCase();
        if (showPublishedOnly && !page.published) {
          return false;
        }

        return (
          !searchTerm ||
          page.title.toLowerCase().includes(searchLower) ||
          page.content.toLowerCase().includes(searchLower)
        );
      }),
    [pages, searchTerm, showPublishedOnly]
  );

  const handleEdit = (page: MarkdownPage) => {
    setSelectedPage(page);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (pageToDelete?.id) {
      try {
        await deleteMarkdownPage.mutateAsync(pageToDelete.id);
        setPageToDelete(null);
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
              <FileText className="h-6 w-6" />
              <CardTitle>Pages</CardTitle>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </CardHeader>
        <CardContent>
          <PageFilters
            searchQuery={searchTerm}
            onSearchChangeAction={setSearchTerm}
            totalResults={filteredPages.length}
            showPublishedOnly={showPublishedOnly}
            onPublishedToggleAction={() =>
              setShowPublishedOnly(!showPublishedOnly)
            }
          />

          {filteredPages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No pages found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || showPublishedOnly
                  ? 'Try adjusting your filters'
                  : 'Create your first page'}
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <PagesTable
                pages={filteredPages}
                onEditAction={handleEdit}
                onDeleteAction={setPageToDelete}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <MarkdownForm
        page={selectedPage}
        open={isFormOpen}
        onOpenChangeAction={(open: boolean) => {
          setIsFormOpen(open);
          if (!open) setSelectedPage(undefined);
        }}
      />

      <ConfirmDelete
        open={!!pageToDelete}
        onOpenChange={() => setPageToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Page"
        description={`Are you sure you want to delete "${pageToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
