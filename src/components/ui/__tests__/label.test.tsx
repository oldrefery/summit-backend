import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from '../label';

describe('Label Component', () => {
    // Test basic rendering
    it('renders with default classes', () => {
        render(<Label>Test Label</Label>);
        const label = screen.getByText('Test Label');
        expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none');
    });

    // Test custom className
    it('accepts and applies custom className', () => {
        const customClass = 'custom-class';
        render(<Label className={customClass}>Test Label</Label>);
        const label = screen.getByText('Test Label');
        expect(label).toHaveClass(customClass);
        expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none');
    });

    // Test HTML attributes
    it('accepts and applies HTML attributes', () => {
        render(
            <Label htmlFor="test-input" data-testid="test-label">
                Test Label
            </Label>
        );
        const label = screen.getByTestId('test-label');
        expect(label).toHaveAttribute('for', 'test-input');
    });

    // Test with form control
    it('works with form controls', () => {
        render(
            <div>
                <Label htmlFor="test-input">Test Label</Label>
                <input
                    id="test-input"
                    type="text"
                    data-testid="test-input"
                />
            </div>
        );

        const label = screen.getByText('Test Label');
        const input = screen.getByTestId('test-input');

        expect(label).toHaveAttribute('for', input.id);
    });

    // Test disabled state
    it('applies disabled styles when peer is disabled', () => {
        render(
            <div>
                <Label htmlFor="test-input">Test Label</Label>
                <input
                    id="test-input"
                    disabled
                    className="peer"
                    data-testid="test-input"
                />
            </div>
        );

        const label = screen.getByText('Test Label');
        expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
    });
}); 