// src/app/pages/[id]/edit/edit-client.tsx
'use client';

import { useState } from 'react';
import { MarkdownForm } from '@/components/pages/markdown-form';
import { useMarkdownPages } from '@/hooks/use-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface EditPageClientProps {
  id: string;
}

export default function EditPageClient({ id }: EditPageClientProps) {
  const { data: page, isLoading } = useMarkdownPages(id);
  const [isFormOpen, setIsFormOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-8">
        <div className="h-32 flex items-center justify-center">
          <p className="text-muted-foreground">Page not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Edit Page</h1>
      <MarkdownForm
        page={page}
        open={isFormOpen}
        onOpenChangeAction={setIsFormOpen}
      />
    </div>
  );
}
