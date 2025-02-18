import { renderHook, act } from '@testing-library/react';
import { useSortFilter } from '../use-sort-filter';

interface TestItem {
    id: number;
    name: string;
    age: number;
}

describe('useSortFilter', () => {
    const testItems: TestItem[] = [
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Alice', age: 25 },
        { id: 3, name: 'Bob', age: 35 },
        { id: 4, name: 'Charlie', age: 28 },
    ];

    it('initializes with default values', () => {
        const { result } = renderHook(() =>
            useSortFilter(testItems, {
                initialSortKey: 'name',
                searchField: 'name',
            })
        );

        expect(result.current.searchQuery).toBe('');
        expect(result.current.sortKey).toBe('name');
        expect(result.current.sortOrder).toBe('asc');
        expect(result.current.filteredAndSorted).toEqual([
            { id: 2, name: 'Alice', age: 25 },
            { id: 3, name: 'Bob', age: 35 },
            { id: 4, name: 'Charlie', age: 28 },
            { id: 1, name: 'John', age: 30 },
        ]);
    });

    it('filters items based on search query', () => {
        const { result } = renderHook(() =>
            useSortFilter(testItems, {
                initialSortKey: 'name',
                searchField: 'name',
            })
        );

        act(() => {
            result.current.setSearchQuery('al');
        });

        expect(result.current.searchQuery).toBe('al');
        expect(result.current.filteredAndSorted).toEqual([
            { id: 2, name: 'Alice', age: 25 },
        ]);
    });

    it('sorts items by different keys', () => {
        const { result } = renderHook(() =>
            useSortFilter(testItems, {
                initialSortKey: 'age',
                searchField: 'name',
            })
        );

        expect(result.current.filteredAndSorted).toEqual([
            { id: 2, name: 'Alice', age: 25 },
            { id: 4, name: 'Charlie', age: 28 },
            { id: 1, name: 'John', age: 30 },
            { id: 3, name: 'Bob', age: 35 },
        ]);

        act(() => {
            result.current.handleSort('name');
        });

        expect(result.current.sortKey).toBe('name');
        expect(result.current.sortOrder).toBe('asc');
        expect(result.current.filteredAndSorted).toEqual([
            { id: 2, name: 'Alice', age: 25 },
            { id: 3, name: 'Bob', age: 35 },
            { id: 4, name: 'Charlie', age: 28 },
            { id: 1, name: 'John', age: 30 },
        ]);
    });

    it('toggles sort order when clicking the same key', () => {
        const { result } = renderHook(() =>
            useSortFilter(testItems, {
                initialSortKey: 'name',
                searchField: 'name',
            })
        );

        // Initial state (ascending)
        expect(result.current.sortOrder).toBe('asc');
        expect(result.current.filteredAndSorted[0].name).toBe('Alice');

        // First click on same key (descending)
        act(() => {
            result.current.handleSort('name');
        });

        expect(result.current.sortOrder).toBe('desc');
        expect(result.current.filteredAndSorted[0].name).toBe('John');

        // Second click on same key (back to ascending)
        act(() => {
            result.current.handleSort('name');
        });

        expect(result.current.sortOrder).toBe('asc');
        expect(result.current.filteredAndSorted[0].name).toBe('Alice');
    });

    it('handles custom initial sort order', () => {
        const { result } = renderHook(() =>
            useSortFilter(testItems, {
                initialSortKey: 'name',
                initialSortOrder: 'desc',
                searchField: 'name',
            })
        );

        expect(result.current.sortOrder).toBe('desc');
        expect(result.current.filteredAndSorted).toEqual([
            { id: 1, name: 'John', age: 30 },
            { id: 4, name: 'Charlie', age: 28 },
            { id: 3, name: 'Bob', age: 35 },
            { id: 2, name: 'Alice', age: 25 },
        ]);
    });

    it('combines search and sort functionality', () => {
        const { result } = renderHook(() =>
            useSortFilter(testItems, {
                initialSortKey: 'age',
                searchField: 'name',
            })
        );

        act(() => {
            result.current.setSearchQuery('b');
        });

        expect(result.current.filteredAndSorted).toEqual([
            { id: 3, name: 'Bob', age: 35 },
        ]);

        act(() => {
            result.current.handleSort('age');
        });

        expect(result.current.sortOrder).toBe('desc');
        expect(result.current.filteredAndSorted).toEqual([
            { id: 3, name: 'Bob', age: 35 },
        ]);
    });

    it('handles case-insensitive search', () => {
        const { result } = renderHook(() =>
            useSortFilter(testItems, {
                initialSortKey: 'name',
                searchField: 'name',
            })
        );

        act(() => {
            result.current.setSearchQuery('ALICE');
        });

        expect(result.current.filteredAndSorted).toEqual([
            { id: 2, name: 'Alice', age: 25 },
        ]);

        act(() => {
            result.current.setSearchQuery('alice');
        });

        expect(result.current.filteredAndSorted).toEqual([
            { id: 2, name: 'Alice', age: 25 },
        ]);
    });

    it('handles empty search query', () => {
        const { result } = renderHook(() =>
            useSortFilter(testItems, {
                initialSortKey: 'name',
                searchField: 'name',
            })
        );

        act(() => {
            result.current.setSearchQuery('al');
        });

        expect(result.current.filteredAndSorted.length).toBe(1);

        act(() => {
            result.current.setSearchQuery('');
        });

        expect(result.current.filteredAndSorted.length).toBe(4);
    });

    it('handles empty items array', () => {
        const { result } = renderHook(() =>
            useSortFilter([], {
                initialSortKey: 'name',
                searchField: 'name',
            })
        );

        expect(result.current.filteredAndSorted).toEqual([]);

        act(() => {
            result.current.setSearchQuery('test');
        });

        expect(result.current.filteredAndSorted).toEqual([]);

        act(() => {
            result.current.handleSort('name');
        });

        expect(result.current.filteredAndSorted).toEqual([]);
    });
}); 