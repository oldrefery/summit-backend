import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EventFilters } from '../event-filters';

describe('EventFilters', () => {
    const mockOnSearchChangeAction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders search input correctly', () => {
        render(
            <EventFilters
                searchQuery=""
                onSearchChangeAction={mockOnSearchChangeAction}
                totalResults={0}
            />
        );

        expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
    });

    it('displays total results count', () => {
        render(
            <EventFilters
                searchQuery=""
                onSearchChangeAction={mockOnSearchChangeAction}
                totalResults={5}
            />
        );

        expect(screen.getByText('5 events found')).toBeInTheDocument();
    });

    it('displays singular form for one result', () => {
        render(
            <EventFilters
                searchQuery=""
                onSearchChangeAction={mockOnSearchChangeAction}
                totalResults={1}
            />
        );

        expect(screen.getByText('1 event found')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(
            <EventFilters
                searchQuery=""
                onSearchChangeAction={mockOnSearchChangeAction}
                totalResults={0}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search events...');
        fireEvent.change(searchInput, { target: { value: 'test' } });

        expect(mockOnSearchChangeAction).toHaveBeenCalledWith('test');
    });

    it('shows clear button when search query exists', () => {
        render(
            <EventFilters
                searchQuery="test"
                onSearchChangeAction={mockOnSearchChangeAction}
                totalResults={0}
            />
        );

        const clearButton = screen.getByRole('button', { name: /clear search/i });
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(mockOnSearchChangeAction).toHaveBeenCalledWith('');
    });

    it('hides clear button when search query is empty', () => {
        render(
            <EventFilters
                searchQuery=""
                onSearchChangeAction={mockOnSearchChangeAction}
                totalResults={0}
            />
        );

        const clearButton = screen.queryByRole('button', { name: /clear search/i });
        expect(clearButton).not.toBeInTheDocument();
    });
}); 