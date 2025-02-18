// src/components/sections/section-filters.tsx
'use client';

import { InputSearch } from '@/components/ui/input-search';
import { Button } from '@/components/ui/button';
import { X, ArrowUpDown } from 'lucide-react';

interface SectionFiltersProps {
  searchQuery: string;
  onSearchChangeAction: (value: string) => void;
  totalResults: number;
  sortKey: 'name' | 'date';
  sortOrder: 'asc' | 'desc';
  onSortAction: (key: 'name' | 'date') => void;
}

export function SectionFilters({
  searchQuery,
  onSearchChangeAction,
  totalResults,
  sortKey,
  sortOrder,
  onSortAction,
}: SectionFiltersProps) {
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
            {sortKey === 'name' && <ArrowUpDown data-testid="arrow-icon" className="h-4 w-4 ml-2" />}
          </Button>
          <Button
            variant={sortKey === 'date' ? 'default' : 'outline'}
            onClick={() => onSortAction('date')}
            className="min-w-[100px]"
          >
            Date{' '}
            {sortKey === 'date' && <ArrowUpDown className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground flex justify-between items-center">
        <div>
          {totalResults} {totalResults === 1 ? 'section' : 'sections'} found
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
