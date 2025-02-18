// src/components/people/search-filters.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchFiltersProps {
  searchQuery: string;
  selectedRole: string | null;
  onSearchChange: (value: string) => void;
  onRoleChange: (role: string | null) => void;
  totalResults: number;
}

export function SearchFilters({
  searchQuery,
  selectedRole,
  onSearchChange,
  onRoleChange,
  totalResults,
}: SearchFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, title, company..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              className="absolute right-2 top-2 h-6 w-6 p-0"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedRole === null ? 'default' : 'outline'}
            onClick={() => onRoleChange(null)}
            className="min-w-[80px]"
          >
            All
          </Button>
          <Button
            variant={selectedRole === 'speaker' ? 'default' : 'outline'}
            onClick={() => onRoleChange('speaker')}
            className="min-w-[80px]"
          >
            Speakers
          </Button>
          <Button
            variant={selectedRole === 'attendee' ? 'default' : 'outline'}
            onClick={() => onRoleChange('attendee')}
            className="min-w-[80px]"
          >
            Attendees
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {totalResults} {totalResults === 1 ? 'person' : 'people'} found
        {(searchQuery || selectedRole) && (
          <>
            {' '}
            <Button
              variant="link"
              className="px-0 text-sm h-auto"
              onClick={() => {
                onSearchChange('');
                onRoleChange(null);
              }}
            >
              Clear all filters
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
