import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilters } from '../search-filters';

describe('SearchFilters', () => {
    const defaultProps = {
        searchQuery: '',
        selectedRole: null,
        onSearchChange: vi.fn(),
        onRoleChange: vi.fn(),
        totalResults: 0,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with default props', () => {
        render(<SearchFilters {...defaultProps} />);

        expect(screen.getByPlaceholderText(/search by name, title, company/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /all/i })).toHaveClass('bg-primary');
        expect(screen.getByRole('button', { name: /speakers/i })).not.toHaveClass('bg-primary');
        expect(screen.getByRole('button', { name: /attendees/i })).not.toHaveClass('bg-primary');
        expect(screen.getByText('0 people found')).toBeInTheDocument();
    });

    it('renders correctly with active search', () => {
        render(<SearchFilters {...defaultProps} searchQuery="John" totalResults={1} />);

        const searchInput = screen.getByPlaceholderText(/search by name, title, company/i);
        expect(searchInput).toHaveValue('John');
        expect(screen.getByText('1 person found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });

    it('renders correctly with selected role', () => {
        render(<SearchFilters {...defaultProps} selectedRole="speaker" totalResults={5} />);

        expect(screen.getByRole('button', { name: /speakers/i })).toHaveClass('bg-primary');
        expect(screen.getByText('5 people found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });

    it('handles search input change', () => {
        const onSearchChange = vi.fn();
        render(<SearchFilters {...defaultProps} onSearchChange={onSearchChange} />);

        const searchInput = screen.getByPlaceholderText(/search by name, title, company/i);
        fireEvent.change(searchInput, { target: { value: 'John' } });

        expect(onSearchChange).toHaveBeenCalledWith('John');
    });

    it('handles search clear button click', () => {
        const onSearchChange = vi.fn();
        render(
            <SearchFilters
                {...defaultProps}
                searchQuery="John"
                onSearchChange={onSearchChange}
            />
        );

        const clearButton = screen.getByRole('button', { name: /clear search/i });
        fireEvent.click(clearButton);

        expect(onSearchChange).toHaveBeenCalledWith('');
    });

    it('handles role filter changes', () => {
        const onRoleChange = vi.fn();
        render(<SearchFilters {...defaultProps} onRoleChange={onRoleChange} />);

        fireEvent.click(screen.getByRole('button', { name: /speakers/i }));
        expect(onRoleChange).toHaveBeenCalledWith('speaker');

        fireEvent.click(screen.getByRole('button', { name: /attendees/i }));
        expect(onRoleChange).toHaveBeenCalledWith('attendee');

        fireEvent.click(screen.getByRole('button', { name: /all/i }));
        expect(onRoleChange).toHaveBeenCalledWith(null);
    });

    it('handles clear all filters', () => {
        const onSearchChange = vi.fn();
        const onRoleChange = vi.fn();
        render(
            <SearchFilters
                {...defaultProps}
                searchQuery="John"
                selectedRole="speaker"
                onSearchChange={onSearchChange}
                onRoleChange={onRoleChange}
            />
        );

        const clearAllButton = screen.getByRole('button', { name: /clear all filters/i });
        fireEvent.click(clearAllButton);

        expect(onSearchChange).toHaveBeenCalledWith('');
        expect(onRoleChange).toHaveBeenCalledWith(null);
    });

    it('shows singular form for one result', () => {
        render(<SearchFilters {...defaultProps} totalResults={1} />);
        expect(screen.getByText('1 person found')).toBeInTheDocument();
    });

    it('shows plural form for multiple results', () => {
        render(<SearchFilters {...defaultProps} totalResults={2} />);
        expect(screen.getByText('2 people found')).toBeInTheDocument();
    });
}); 