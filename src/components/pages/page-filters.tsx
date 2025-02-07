// src/components/pages/page-filters.tsx
'use client';

import { InputSearch } from '@/components/ui/input-search';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PageFiltersProps {
  searchQuery: string;
  onSearchChangeAction: (value: string) => void;
  totalResults: number;
  showPublishedOnly: boolean;
  onPublishedToggleAction: () => void;
}

export function PageFilters({
  searchQuery,
  onSearchChangeAction,
  totalResults,
  showPublishedOnly,
  onPublishedToggleAction,
}: PageFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <InputSearch
            placeholder="Search in title and content..."
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
        <Button
          variant={showPublishedOnly ? 'default' : 'outline'}
          onClick={onPublishedToggleAction}
        >
          Published Only
        </Button>
      </div>

      <div className="text-sm text-muted-foreground flex justify-between items-center">
        <div>
          {totalResults} {totalResults === 1 ? 'page' : 'pages'} found
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
      </div>
    </div>
  );
}
