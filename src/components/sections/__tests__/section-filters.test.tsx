import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SectionFilters } from '../section-filters';

describe('SectionFilters', () => {
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
        render(<SectionFilters {...defaultProps} />);

        expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
    });

    it('displays total results count', () => {
        render(<SectionFilters {...defaultProps} />);

        expect(screen.getByText('10 sections found')).toBeInTheDocument();
    });

    it('displays singular form for one result', () => {
        render(<SectionFilters {...defaultProps} totalResults={1} />);

        expect(screen.getByText('1 section found')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<SectionFilters {...defaultProps} />);

        const searchInput = screen.getByPlaceholderText('Search by name...');
        fireEvent.change(searchInput, { target: { value: 'test' } });

        expect(mockOnSearchChangeAction).toHaveBeenCalledWith('test');
    });

    it('shows clear search button when search query exists', () => {
        render(<SectionFilters {...defaultProps} searchQuery="test" />);

        const clearButton = screen.getByRole('button', { name: /clear search/i });
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(mockOnSearchChangeAction).toHaveBeenCalledWith('');
    });

    it('handles name sort button click', () => {
        render(<SectionFilters {...defaultProps} />);

        const nameButton = screen.getByRole('button', { name: /name/i });
        fireEvent.click(nameButton);

        expect(mockOnSortAction).toHaveBeenCalledWith('name');
    });

    it('handles date sort button click', () => {
        render(<SectionFilters {...defaultProps} />);

        const dateButton = screen.getByRole('button', { name: /date/i });
        fireEvent.click(dateButton);

        expect(mockOnSortAction).toHaveBeenCalledWith('date');
    });

    it('highlights active sort button', () => {
        render(<SectionFilters {...defaultProps} sortKey="date" />);

        const dateButton = screen.getByRole('button', { name: /date/i });
        const nameButton = screen.getByRole('button', { name: /name/i });

        // Проверяем наличие bg-primary класса для активной кнопки
        expect(dateButton.className).toContain('bg-primary');
        // Проверяем наличие border класса для неактивной кнопки
        expect(nameButton.className).toContain('border');
    });

    it('displays current sort information', () => {
        render(<SectionFilters {...defaultProps} sortKey="name" sortOrder="desc" />);

        expect(screen.getByText('Sorted by name (descending)')).toBeInTheDocument();
    });

    it('shows arrow icon for active sort button', () => {
        render(<SectionFilters {...defaultProps} sortKey="name" />);

        const nameButton = screen.getByRole('button', { name: /name/i });
        expect(nameButton).toContainElement(screen.getByTestId('arrow-icon'));
    });
}); 