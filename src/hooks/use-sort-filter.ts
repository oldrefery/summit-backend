// src/hooks/use-sort-filter.ts
import { useState, useMemo } from 'react';

type SortFilterReturn<T> = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortKey: keyof T;
  sortOrder: 'asc' | 'desc';
  handleSort: (key: keyof T) => void;
  filteredAndSorted: T[];
};

export function useSortFilter<T>(
  items: T[],
  {
    initialSortKey,
    initialSortOrder = 'asc' as const,
    searchField,
  }: {
    initialSortKey: keyof T;
    initialSortOrder?: 'asc' | 'desc';
    searchField: keyof T;
  }
): SortFilterReturn<T> {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    const sortItems = (
      a: T,
      b: T,
      key: keyof T,
      order: 'asc' | 'desc'
    ): number => {
      const aValue = a[key];
      const bValue = b[key];
      const modifier = order === 'asc' ? 1 : -1;

      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    };

    let result = [...items];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        String(item[searchField]).toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => sortItems(a, b, sortKey, sortOrder));

    return result;
  }, [items, searchQuery, searchField, sortKey, sortOrder]);

  return {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortOrder,
    handleSort,
    filteredAndSorted,
  };
}
