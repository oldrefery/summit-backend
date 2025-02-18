import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from '../skeleton';

describe('Skeleton Component', () => {
    // Test basic rendering
    it('renders with default classes', () => {
        render(<Skeleton data-testid="skeleton" />);
        const skeleton = screen.getByTestId('skeleton');
        expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    // Test custom className
    it('accepts and applies custom className', () => {
        const customClass = 'custom-class';
        render(<Skeleton data-testid="skeleton" className={customClass} />);
        const skeleton = screen.getByTestId('skeleton');
        expect(skeleton).toHaveClass(customClass);
        expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    // Test custom attributes
    it('accepts and applies custom HTML attributes', () => {
        render(<Skeleton data-testid="test-skeleton" aria-label="Loading..." />);
        const skeleton = screen.getByTestId('test-skeleton');
        expect(skeleton).toHaveAttribute('aria-label', 'Loading...');
    });

    // Test different sizes
    it('renders with custom dimensions', () => {
        render(
            <Skeleton
                style={{ width: '200px', height: '100px' }}
                data-testid="sized-skeleton"
            />
        );
        const skeleton = screen.getByTestId('sized-skeleton');
        expect(skeleton).toHaveStyle({
            width: '200px',
            height: '100px',
        });
    });
}); 