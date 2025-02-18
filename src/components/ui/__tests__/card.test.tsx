import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
} from '../card';

describe('Card Components', () => {
    // Test Card component
    describe('Card', () => {
        it('renders with default classes', () => {
            render(<Card data-testid="card">Card Content</Card>);
            const card = screen.getByTestId('card');
            expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
        });

        it('accepts custom className', () => {
            const customClass = 'custom-class';
            render(<Card data-testid="card" className={customClass}>Card Content</Card>);
            const card = screen.getByTestId('card');
            expect(card).toHaveClass(customClass);
            expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
        });
    });

    // Test CardHeader component
    describe('CardHeader', () => {
        it('renders with default classes', () => {
            render(<CardHeader data-testid="header">Header Content</CardHeader>);
            const header = screen.getByTestId('header');
            expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
        });

        it('accepts custom className', () => {
            const customClass = 'custom-header';
            render(<CardHeader data-testid="header" className={customClass}>Header Content</CardHeader>);
            const header = screen.getByTestId('header');
            expect(header).toHaveClass(customClass);
            expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
        });
    });

    // Test CardTitle component
    describe('CardTitle', () => {
        it('renders with default classes', () => {
            render(<CardTitle data-testid="title">Card Title</CardTitle>);
            const title = screen.getByTestId('title');
            expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
            expect(title.tagName.toLowerCase()).toBe('h3');
        });

        it('accepts custom className', () => {
            const customClass = 'custom-title';
            render(<CardTitle data-testid="title" className={customClass}>Card Title</CardTitle>);
            const title = screen.getByTestId('title');
            expect(title).toHaveClass(customClass);
            expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
        });
    });

    // Test CardDescription component
    describe('CardDescription', () => {
        it('renders with default classes', () => {
            render(<CardDescription data-testid="desc">Card Description</CardDescription>);
            const desc = screen.getByTestId('desc');
            expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
            expect(desc.tagName.toLowerCase()).toBe('p');
        });

        it('accepts custom className', () => {
            const customClass = 'custom-desc';
            render(<CardDescription data-testid="desc" className={customClass}>Card Description</CardDescription>);
            const desc = screen.getByTestId('desc');
            expect(desc).toHaveClass(customClass);
            expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
        });
    });

    // Test CardContent component
    describe('CardContent', () => {
        it('renders with default classes', () => {
            render(<CardContent data-testid="content">Content</CardContent>);
            const content = screen.getByTestId('content');
            expect(content).toHaveClass('p-6', 'pt-0');
        });

        it('accepts custom className', () => {
            const customClass = 'custom-content';
            render(<CardContent data-testid="content" className={customClass}>Content</CardContent>);
            const content = screen.getByTestId('content');
            expect(content).toHaveClass(customClass);
            expect(content).toHaveClass('p-6', 'pt-0');
        });
    });

    // Test CardFooter component
    describe('CardFooter', () => {
        it('renders with default classes', () => {
            render(<CardFooter data-testid="footer">Footer Content</CardFooter>);
            const footer = screen.getByTestId('footer');
            expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
        });

        it('accepts custom className', () => {
            const customClass = 'custom-footer';
            render(<CardFooter data-testid="footer" className={customClass}>Footer Content</CardFooter>);
            const footer = screen.getByTestId('footer');
            expect(footer).toHaveClass(customClass);
            expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
        });
    });

    // Test Card composition
    describe('Card Composition', () => {
        it('renders all components together correctly', () => {
            render(
                <Card data-testid="card">
                    <CardHeader data-testid="header">
                        <CardTitle data-testid="title">Title</CardTitle>
                        <CardDescription data-testid="desc">Description</CardDescription>
                    </CardHeader>
                    <CardContent data-testid="content">Content</CardContent>
                    <CardFooter data-testid="footer">Footer</CardFooter>
                </Card>
            );

            expect(screen.getByTestId('card')).toBeInTheDocument();
            expect(screen.getByTestId('header')).toBeInTheDocument();
            expect(screen.getByTestId('title')).toBeInTheDocument();
            expect(screen.getByTestId('desc')).toBeInTheDocument();
            expect(screen.getByTestId('content')).toBeInTheDocument();
            expect(screen.getByTestId('footer')).toBeInTheDocument();

            // Verify structure
            expect(screen.getByTestId('header')).toContainElement(screen.getByTestId('title'));
            expect(screen.getByTestId('header')).toContainElement(screen.getByTestId('desc'));
        });
    });
}); 