// src/components/pages/pages-table.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import type { MarkdownPage } from '@/types';

interface PagesTableProps {
  pages: MarkdownPage[];
  onEditAction: (page: MarkdownPage) => void;
  onDeleteAction: (page: MarkdownPage) => void;
}

export function PagesTable({
  pages,
  onEditAction,
  onDeleteAction,
}: PagesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[25%]">Title</TableHead>
          <TableHead className="w-[20%]">Slug</TableHead>
          <TableHead className="w-[30%]">Content Preview</TableHead>
          <TableHead className="w-[15%]">Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map(page => (
          <TableRow key={page.id}>
            <TableCell>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{page.title}</span>
                {page.published && (
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-400/10 dark:text-green-400 ring-1 ring-inset ring-green-700/10">
                    Published
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>{page.slug}</TableCell>
            <TableCell>
              <p className="truncate text-sm text-muted-foreground">
                {page.content.substring(0, 100)}...
              </p>
            </TableCell>
            <TableCell>
              {format(new Date(page.updated_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAction(page)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteAction(page)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
