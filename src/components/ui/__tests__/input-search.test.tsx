import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InputSearch } from '../input-search';

describe('InputSearch Component', () => {
    // Test basic rendering
    it('renders with default placeholder', () => {
        render(<InputSearch />);
        const input = screen.getByPlaceholderText('Search ...');
        expect(input).toBeInTheDocument();
    });

    // Test custom placeholder
    it('renders with custom placeholder', () => {
        render(<InputSearch placeholder="Custom search..." />);
        const input = screen.getByPlaceholderText('Custom search...');
        expect(input).toBeInTheDocument();
    });

    // Test search icon
    it('renders search icon', () => {
        render(<InputSearch />);
        const searchIcon = screen.getByTestId('search-icon');
        expect(searchIcon).toBeInTheDocument();
        expect(searchIcon).toHaveClass('text-muted-foreground');
    });

    // Test input functionality
    it('handles input changes', () => {
        const handleChange = vi.fn();
        render(<InputSearch onChange={handleChange} />);

        const input = screen.getByPlaceholderText('Search ...');
        fireEvent.change(input, { target: { value: 'test' } });

        expect(handleChange).toHaveBeenCalled();
        expect(input).toHaveValue('test');
    });

    // Test custom className
    it('applies custom className', () => {
        const customClass = 'custom-class';
        render(<InputSearch className={customClass} />);

        const input = screen.getByPlaceholderText('Search ...');
        expect(input).toHaveClass(customClass);
        expect(input).toHaveClass('pl-8'); // Проверяем, что дефолтные стили сохранены
    });

    // Test disabled state
    it('handles disabled state', () => {
        render(<InputSearch disabled />);
        const input = screen.getByPlaceholderText('Search ...');
        expect(input).toBeDisabled();
    });

    // Test input attributes
    it('passes through HTML attributes', () => {
        render(
            <InputSearch
                data-testid="search-input"
                aria-label="Search input"
                maxLength={50}
            />
        );

        const input = screen.getByTestId('search-input');
        expect(input).toHaveAttribute('aria-label', 'Search input');
        expect(input).toHaveAttribute('maxLength', '50');
    });
}); 