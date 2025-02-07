// src/components/resources/resources-table.tsx
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
import { ExternalLink } from 'lucide-react';
import type { Resource } from '@/types';

interface ResourcesTableProps {
  resources: Resource[];
  onEditAction: (resource: Resource) => void;
  onDeleteAction: (resource: Resource) => void;
}

export function ResourcesTable({
  resources,
  onEditAction,
  onDeleteAction,
}: ResourcesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Name</TableHead>
          <TableHead className="w-[40%]">Description</TableHead>
          <TableHead className="w-[20%]">Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map(resource => (
          <TableRow key={resource.id}>
            <TableCell>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{resource.name}</span>
                {resource.is_route && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10">
                    Route
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground truncate">
                  {resource.description}
                </span>
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </a>
              </div>
            </TableCell>
            <TableCell>
              {format(new Date(resource.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAction(resource)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteAction(resource)}
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
