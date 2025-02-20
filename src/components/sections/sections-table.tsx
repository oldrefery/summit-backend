// src/components/sections/sections-table.tsx
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
import { format, isToday, isYesterday, isTomorrow, parseISO, isValid } from 'date-fns';
import type { Section } from '@/types';

interface SectionsTableProps {
  sections: Section[];
  onEditAction: (section: Section) => void;
  onDeleteAction: (section: Section) => void;
}

export function SectionsTable({
  sections,
  onEditAction,
  onDeleteAction,
}: SectionsTableProps) {
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'No date';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) {
        console.error('Invalid date:', dateStr);
        return 'Invalid date';
      }
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatCreatedDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'No date';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) {
        console.error('Invalid date:', dateStr);
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting created date:', error);
      return 'Invalid date';
    }
  };

  return (
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
        {sections.map(section => (
          <TableRow key={section.id}>
            <TableCell className="font-medium">{section.name}</TableCell>
            <TableCell>{formatDate(section.date)}</TableCell>
            <TableCell>{formatCreatedDate(section.created_at)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAction(section)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteAction(section)}
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
