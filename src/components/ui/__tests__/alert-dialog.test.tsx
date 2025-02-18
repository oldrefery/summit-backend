import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
} from '../alert-dialog';

describe('AlertDialog Components', () => {
    const TestDialog = () => (
        <AlertDialog>
            <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Test Title</AlertDialogTitle>
                    <AlertDialogDescription>Test Description</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    // Test rendering
    it('renders trigger button', () => {
        render(<TestDialog />);
        expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('renders dialog content when triggered', () => {
        render(<TestDialog />);
        fireEvent.click(screen.getByText('Open Dialog'));

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    // Test header component
    it('renders header with custom className', () => {
        render(
            <AlertDialogHeader className="custom-header">
                <div>Header Content</div>
            </AlertDialogHeader>
        );

        const header = screen.getByText('Header Content').parentElement;
        expect(header).toHaveClass('custom-header');
        expect(header).toHaveClass('flex', 'flex-col', 'space-y-2', 'text-left');
    });

    // Test footer component
    it('renders footer with custom className', () => {
        render(
            <AlertDialogFooter className="custom-footer">
                <div>Footer Content</div>
            </AlertDialogFooter>
        );

        const footer = screen.getByText('Footer Content').parentElement;
        expect(footer).toHaveClass('custom-footer');
        expect(footer).toHaveClass('flex', 'flex-col-reverse', 'sm:flex-row');
    });

    // Test title component
    it('renders title with custom className', () => {
        render(
            <AlertDialog>
                <AlertDialogTrigger>Open</AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogTitle className="custom-title">
                        Custom Title
                    </AlertDialogTitle>
                    <AlertDialogDescription>Required description</AlertDialogDescription>
                </AlertDialogContent>
            </AlertDialog>
        );

        fireEvent.click(screen.getByText('Open'));
        const title = screen.getByText('Custom Title');
        expect(title).toHaveClass('custom-title');
        expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    // Test description component
    it('renders description with custom className', () => {
        render(
            <AlertDialog>
                <AlertDialogTrigger>Open</AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogTitle>Required Title</AlertDialogTitle>
                    <AlertDialogDescription className="custom-desc">
                        Custom Description
                    </AlertDialogDescription>
                </AlertDialogContent>
            </AlertDialog>
        );

        fireEvent.click(screen.getByText('Open'));
        const desc = screen.getByText('Custom Description');
        expect(desc).toHaveClass('custom-desc');
        expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
    });

    // Test action button
    it('renders action button with custom className', () => {
        render(
            <AlertDialogAction className="custom-action">
                Custom Action
            </AlertDialogAction>
        );

        const action = screen.getByText('Custom Action');
        expect(action).toHaveClass('custom-action');
    });

    // Test accessibility
    it('has proper accessibility attributes', () => {
        render(<TestDialog />);
        fireEvent.click(screen.getByText('Open Dialog'));

        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAttribute('aria-describedby');
    });

    // Test animations
    it('applies animation classes', () => {
        render(<TestDialog />);
        fireEvent.click(screen.getByText('Open Dialog'));

        const content = screen.getByRole('alertdialog');
        expect(content).toHaveClass('data-[state=open]:animate-in');
        expect(content).toHaveClass('data-[state=closed]:animate-out');
    });

    // Test overlay
    it('renders overlay with proper classes', () => {
        render(<TestDialog />);
        fireEvent.click(screen.getByText('Open Dialog'));

        const overlay = document.querySelector('[class*="bg-black/20"]');
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveClass('backdrop-blur-sm');
    });
}); 