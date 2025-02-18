import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationFilters } from '../location-filters';

describe('LocationFilters', () => {
    const mockOnSearchChangeAction = vi.fn();
    const mockOnSortAction = vi.fn();

    const defaultProps = {
        searchQuery: '',
        onSearchChangeAction: mockOnSearchChangeAction,
        totalResults: 10,
        sortKey: 'name' as const,
        sortOrder: 'asc' as const,
        onSortAction: mockOnSortAction,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders search input with placeholder', () => {
        render(<LocationFilters {...defaultProps} />);

        expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
    });

    it('displays total results count', () => {
        render(<LocationFilters {...defaultProps} />);

        expect(screen.getByText('10 locations found')).toBeInTheDocument();
    });

    it('displays singular form for one result', () => {
        render(<LocationFilters {...defaultProps} totalResults={1} />);

        expect(screen.getByText('1 location found')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<LocationFilters {...defaultProps} />);

        const searchInput = screen.getByPlaceholderText('Search by name...');
        fireEvent.change(searchInput, { target: { value: 'test' } });

        expect(mockOnSearchChangeAction).toHaveBeenCalledWith('test');
    });

    it('shows clear search button when search query exists', () => {
        render(<LocationFilters {...defaultProps} searchQuery="test" />);

        const clearButton = screen.getByRole('button', { name: /clear search/i });
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(mockOnSearchChangeAction).toHaveBeenCalledWith('');
    });

    it('handles name sort button click', () => {
        render(<LocationFilters {...defaultProps} />);

        const nameButton = screen.getByRole('button', { name: /name/i });
        fireEvent.click(nameButton);

        expect(mockOnSortAction).toHaveBeenCalledWith('name');
    });

    it('handles created sort button click', () => {
        render(<LocationFilters {...defaultProps} />);

        const createdButton = screen.getByRole('button', { name: /created/i });
        fireEvent.click(createdButton);

        expect(mockOnSortAction).toHaveBeenCalledWith('created_at');
    });

    it('displays current sort information', () => {
        render(<LocationFilters {...defaultProps} sortKey="created_at" sortOrder="desc" />);

        expect(screen.getByText('Sorted by created_at (descending)')).toBeInTheDocument();
    });

    it('applies correct styles to sort buttons based on active sort', () => {
        const { rerender } = render(<LocationFilters {...defaultProps} />);

        // Name sort is active
        let nameButton = screen.getByRole('button', { name: /name/i });
        let createdButton = screen.getByRole('button', { name: /created/i });

        expect(nameButton.className).toContain('bg-primary');
        expect(createdButton.className).toContain('border-input');

        // Switch to created_at sort
        rerender(<LocationFilters {...defaultProps} sortKey="created_at" />);

        nameButton = screen.getByRole('button', { name: /name/i });
        createdButton = screen.getByRole('button', { name: /created/i });

        expect(nameButton.className).toContain('border-input');
        expect(createdButton.className).toContain('bg-primary');
    });
}); 