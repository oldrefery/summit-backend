import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../badge';

describe('Badge Component', () => {
    // Test default rendering
    it('renders with default variant', () => {
        render(<Badge>Default Badge</Badge>);
        const badge = screen.getByText('Default Badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-primary');
        expect(badge).toHaveClass('text-primary-foreground');
    });

    // Test different variants
    it('renders with secondary variant', () => {
        render(<Badge variant="secondary">Secondary Badge</Badge>);
        const badge = screen.getByText('Secondary Badge');
        expect(badge).toHaveClass('bg-secondary');
        expect(badge).toHaveClass('text-secondary-foreground');
    });

    it('renders with destructive variant', () => {
        render(<Badge variant="destructive">Destructive Badge</Badge>);
        const badge = screen.getByText('Destructive Badge');
        expect(badge).toHaveClass('bg-destructive');
        expect(badge).toHaveClass('text-destructive-foreground');
    });

    it('renders with outline variant', () => {
        render(<Badge variant="outline">Outline Badge</Badge>);
        const badge = screen.getByText('Outline Badge');
        expect(badge).toHaveClass('text-foreground');
    });

    // Test custom className
    it('applies custom className', () => {
        render(<Badge className="custom-class">Custom Badge</Badge>);
        const badge = screen.getByText('Custom Badge');
        expect(badge).toHaveClass('custom-class');
    });

    // Test additional props
    it('passes additional props to the div element', () => {
        render(
            <Badge data-testid="test-badge" aria-label="Test Badge">
                Badge with Props
            </Badge>
        );
        const badge = screen.getByTestId('test-badge');
        expect(badge).toHaveAttribute('aria-label', 'Test Badge');
    });

    // Test accessibility
    it('has proper accessibility attributes', () => {
        render(
            <Badge role="status" aria-label="Status Badge">
                Status
            </Badge>
        );
        const badge = screen.getByRole('status');
        expect(badge).toHaveAttribute('aria-label', 'Status Badge');
    });
}); 