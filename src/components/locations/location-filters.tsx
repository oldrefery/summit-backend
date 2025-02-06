// src/components/locations/location-filters.tsx
'use client';

import { InputSearch } from '@/components/ui/input-search';
import { Button } from '@/components/ui/button';
import { X, ArrowUpDown } from 'lucide-react';

interface LocationFiltersProps {
  searchQuery: string;
  onSearchChangeAction: (value: string) => void;
  totalResults: number;
  sortKey: 'name' | 'created_at';
  sortOrder: 'asc' | 'desc';
  onSortAction: (key: 'name' | 'created_at') => void;
}

export function LocationFilters({
  searchQuery,
  onSearchChangeAction,
  totalResults,
  sortKey,
  sortOrder,
  onSortAction,
}: LocationFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <InputSearch
            placeholder="Search by name..."
            value={searchQuery}
            onChange={e => onSearchChangeAction(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              className="absolute right-2 top-2 h-6 w-6 p-0"
              onClick={() => onSearchChangeAction('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortKey === 'name' ? 'default' : 'outline'}
            onClick={() => onSortAction('name')}
            className="min-w-[100px]"
          >
            Name{' '}
            {sortKey === 'name' && <ArrowUpDown className="h-4 w-4 ml-2" />}
          </Button>
          <Button
            variant={sortKey === 'created_at' ? 'default' : 'outline'}
            onClick={() => onSortAction('created_at')}
            className="min-w-[100px]"
          >
            Created{' '}
            {sortKey === 'created_at' && (
              <ArrowUpDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground flex justify-between items-center">
        <div>
          {totalResults} {totalResults === 1 ? 'location' : 'locations'} found
          {searchQuery && (
            <>
              {' '}
              <Button
                variant="link"
                className="px-0 text-sm h-auto"
                onClick={() => onSearchChangeAction('')}
              >
                Clear search
              </Button>
            </>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Sorted by {sortKey} (
          {sortOrder === 'asc' ? 'ascending' : 'descending'})
        </div>
      </div>
    </div>
  );
}
