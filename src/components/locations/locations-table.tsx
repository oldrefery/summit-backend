// src/components/locations/locations-table.tsx
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
import type { Location } from '@/types';

interface LocationsTableProps {
  locations: Location[];
  onEditAction: (location: Location) => void;
  onDeleteAction: (location: Location) => void;
}

export function LocationsTable({
  locations,
  onEditAction,
  onDeleteAction,
}: LocationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Name</TableHead>
          <TableHead className="w-[30%]">Address</TableHead>
          <TableHead className="w-[20%]">Map Link</TableHead>
          <TableHead className="w-[10%]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locations.map(location => (
          <TableRow key={location.id}>
            <TableCell className="font-medium">{location.name}</TableCell>
            <TableCell>{location.link_address || '-'}</TableCell>
            <TableCell>{location.link_map ? 'Yes' : 'No'}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAction(location)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteAction(location)}
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
