import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDelete } from '../confirm-delete';

describe('ConfirmDelete Component', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        onConfirm: vi.fn(),
        title: 'Delete Item',
        description: 'Are you sure you want to delete this item?',
    };

    // Test rendering
    it('renders with provided title and description', () => {
        render(<ConfirmDelete {...defaultProps} />);

        expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
        expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
    });

    it('renders cancel and delete buttons', () => {
        render(<ConfirmDelete {...defaultProps} />);

        expect(screen.getByTestId('confirm-cancel-button')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument();
    });

    // Test visibility
    it('is visible when open is true', () => {
        render(<ConfirmDelete {...defaultProps} open={true} />);
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('is not visible when open is false', () => {
        render(<ConfirmDelete {...defaultProps} open={false} />);
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    // Test interactions
    it('calls onConfirm when delete button is clicked', () => {
        const onConfirm = vi.fn();
        render(<ConfirmDelete {...defaultProps} onConfirm={onConfirm} />);

        fireEvent.click(screen.getByTestId('confirm-delete-button'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenChange when cancel button is clicked', () => {
        const onOpenChange = vi.fn();
        render(<ConfirmDelete {...defaultProps} onOpenChange={onOpenChange} />);

        fireEvent.click(screen.getByTestId('confirm-cancel-button'));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    // Test accessibility
    it('has proper accessibility attributes', () => {
        render(<ConfirmDelete {...defaultProps} />);

        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('has proper heading structure', () => {
        render(<ConfirmDelete {...defaultProps} />);

        const title = screen.getByText(defaultProps.title);
        expect(title.tagName).toBe('H2');
    });

    // Test custom styles
    it('applies dark mode classes correctly', () => {
        render(<ConfirmDelete {...defaultProps} />);

        const content = screen.getByRole('alertdialog');
        expect(content).toHaveClass('bg-white', 'dark:bg-gray-800');

        const title = screen.getByText(defaultProps.title);
        expect(title).toHaveClass('text-gray-900', 'dark:text-gray-100');

        const description = screen.getByText(defaultProps.description);
        expect(description).toHaveClass('text-gray-600', 'dark:text-gray-300');
    });
}); 