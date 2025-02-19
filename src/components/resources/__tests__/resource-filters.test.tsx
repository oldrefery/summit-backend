import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ResourceFilters } from '../resource-filters';

describe('ResourceFilters', () => {
    const mockOnSearchChangeAction = vi.fn();
    const mockOnRoutesToggleAction = vi.fn();

    const defaultProps = {
        searchQuery: '',
        onSearchChangeAction: mockOnSearchChangeAction,
        totalResults: 10,
        showRoutesOnly: false,
        onRoutesToggleAction: mockOnRoutesToggleAction,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders search input with placeholder', () => {
        render(<ResourceFilters {...defaultProps} />);

        expect(screen.getByPlaceholderText('Search resources...')).toBeInTheDocument();
    });

    it('displays total results count', () => {
        render(<ResourceFilters {...defaultProps} />);

        expect(screen.getByText('10 resources found')).toBeInTheDocument();
    });

    it('displays singular form for one result', () => {
        render(<ResourceFilters {...defaultProps} totalResults={1} />);

        expect(screen.getByText('1 resource found')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<ResourceFilters {...defaultProps} />);

        const searchInput = screen.getByPlaceholderText('Search resources...');
        fireEvent.change(searchInput, { target: { value: 'test' } });

        expect(mockOnSearchChangeAction).toHaveBeenCalledWith('test');
    });

    it('shows clear search button when search query exists', () => {
        render(<ResourceFilters {...defaultProps} searchQuery="test" />);

        const clearButton = screen.getByRole('button', { name: /clear search/i });
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(mockOnSearchChangeAction).toHaveBeenCalledWith('');
    });

    it('handles routes toggle button click', () => {
        render(<ResourceFilters {...defaultProps} />);

        const routesButton = screen.getByRole('button', { name: /routes only/i });
        fireEvent.click(routesButton);

        expect(mockOnRoutesToggleAction).toHaveBeenCalled();
    });

    it('applies correct styles to routes button based on showRoutesOnly', () => {
        const { rerender } = render(<ResourceFilters {...defaultProps} />);

        let routesButton = screen.getByRole('button', { name: /routes only/i });
        expect(routesButton.className).toContain('border-input');

        rerender(<ResourceFilters {...defaultProps} showRoutesOnly={true} />);

        routesButton = screen.getByRole('button', { name: /routes only/i });
        expect(routesButton.className).toContain('bg-primary');
    });
}); 