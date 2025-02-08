// src/components/pages/markdown-form.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import MDEditor from '@uiw/react-md-editor';
import { useToastContext } from '@/components/providers/toast-provider';
import { useMarkdownPages } from '@/hooks/use-markdown';
import type { MarkdownPage } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MarkdownFormProps {
  page?: MarkdownPage;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export function MarkdownForm({
  page,
  open,
  onOpenChangeAction,
}: MarkdownFormProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToastContext();
  const { createMarkdownPage, updateMarkdownPage } = useMarkdownPages();
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    published: false,
  });

  useEffect(() => {
    if (page) {
      setFormData({
        slug: page.slug,
        title: page.title,
        content: page.content,
        published: page.published,
      });
    } else {
      setFormData({
        slug: '',
        title: '',
        content: '',
        published: false,
      });
    }
    setIsDirty(false);
  }, [page]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug =
        'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }

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
      if (page?.id) {
        await updateMarkdownPage.mutateAsync({
          id: page.id,
          data: formData,
        });
        showSuccess('Page updated successfully');
      } else {
        await createMarkdownPage.mutateAsync(formData);
        showSuccess('Page created successfully');
      }

      setIsDirty(false);
      onOpenChangeAction(false); // Закрываем форму
      router.push('/pages');
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
      <DialogContent
        className="max-w-4xl"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle>{page ? 'Edit Page' : 'Create New Page'}</DialogTitle>
          <DialogDescription id="dialog-description">
            {page
              ? 'Edit page details below.'
              : 'Enter the details for the new page.'}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    if (!page && !formData.slug) {
                      setFormData(prev => ({
                        ...prev,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, ''),
                      }));
                    }
                    setIsDirty(true);
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={e => {
                    setFormData(prev => ({
                      ...prev,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-'),
                    }));
                    setIsDirty(true);
                  }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Content <span className="text-red-500">*</span>
              </Label>
              <div data-color-mode="light" className="border rounded-md">
                <MDEditor
                  value={formData.content}
                  onChange={value => {
                    setFormData(prev => ({ ...prev, content: value || '' }));
                    setIsDirty(true);
                  }}
                  preview="live"
                  className="min-h-[400px]"
                  height={400}
                  previewOptions={{
                    className: 'prose dark:prose-invert max-w-none',
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    published: e.target.checked,
                  }));
                  setIsDirty(true);
                }}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="published">Published</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={
                  createMarkdownPage.isPending || updateMarkdownPage.isPending
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMarkdownPage.isPending || updateMarkdownPage.isPending
                }
              >
                {createMarkdownPage.isPending || updateMarkdownPage.isPending
                  ? 'Saving...'
                  : page
                    ? 'Update Page'
                    : 'Create Page'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
