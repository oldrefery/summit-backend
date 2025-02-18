import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Link from 'next/link';
import { Button } from '../button';

describe('Button', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders button with default variant and size', () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });

        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('bg-primary');
        expect(button).toHaveClass('h-10');
    });

    it('renders button with different variants', () => {
        const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

        variants.forEach((variant) => {
            cleanup();
            render(<Button variant={variant}>Button</Button>);
            const button = screen.getByRole('button', { name: /button/i });

            switch (variant) {
                case 'default':
                    expect(button).toHaveClass('bg-primary');
                    break;
                case 'destructive':
                    expect(button).toHaveClass('bg-destructive');
                    break;
                case 'outline':
                    expect(button).toHaveClass('border-input');
                    break;
                case 'secondary':
                    expect(button).toHaveClass('bg-secondary');
                    break;
                case 'ghost':
                    expect(button).toHaveClass('hover:bg-accent');
                    break;
                case 'link':
                    expect(button).toHaveClass('text-primary');
                    break;
            }
        });
    });

    it('renders button with different sizes', () => {
        const sizes = ['default', 'sm', 'lg', 'icon'] as const;

        sizes.forEach((size) => {
            cleanup();
            render(<Button size={size}>Button</Button>);
            const button = screen.getByRole('button', { name: /button/i });

            switch (size) {
                case 'default':
                    expect(button).toHaveClass('h-10 px-4 py-2');
                    break;
                case 'sm':
                    expect(button).toHaveClass('h-9');
                    break;
                case 'lg':
                    expect(button).toHaveClass('h-11');
                    break;
                case 'icon':
                    expect(button).toHaveClass('h-10 w-10');
                    break;
            }
        });
    });

    it('renders as child component when asChild prop is true', () => {
        render(
            <Button asChild>
                <Link href="/">Link Button</Link>
            </Button>
        );

        const link = screen.getByRole('link', { name: /link button/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveClass('bg-primary');
    });

    it('applies additional className when provided', () => {
        render(<Button className="custom-class">Button</Button>);
        const button = screen.getByRole('button', { name: /button/i });

        expect(button).toHaveClass('custom-class');
    });

    it('handles click events', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();

        render(<Button onClick={handleClick}>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });

        await user.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();

        render(<Button disabled onClick={handleClick}>Disabled</Button>);
        const button = screen.getByRole('button', { name: /disabled/i });

        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled:opacity-50');

        await user.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });
}); 