// src/components/pages/markdown-form.tsx
'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToastContext } from '@/components/providers/toast-provider';
import type { MarkdownPage } from '@/types';

interface MarkdownFormProps {
  initialData?: MarkdownPage;
  onSuccess?: () => void;
}

export function MarkdownForm({ initialData, onSuccess }: MarkdownFormProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    published: initialData?.published || false,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiData = {
        ...formData,
        // Generate slug from title if not provided
        slug:
          formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
      };

      if (initialData?.id) {
        // Update existing page
        // Добавить здесь вызов API для обновления
        showSuccess('Page updated successfully');
      } else {
        // Create new page
        // Добавить здесь вызов API для создания
        showSuccess('Page created successfully');
      }

      onSuccess?.();
      router.push('/pages');
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTogglePublished = () => {
    setFormData(prev => ({ ...prev, published: !prev.published }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Page' : 'Create New Page'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              placeholder="generated-from-title"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to generate from title
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content (Markdown)</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={15}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={formData.published ? 'default' : 'outline'}
              onClick={handleTogglePublished}
            >
              {formData.published ? 'Published' : 'Draft'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/pages')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span>Saving...</span>
            ) : initialData ? (
              'Update'
            ) : (
              'Create'
            )}{' '}
            Page
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
