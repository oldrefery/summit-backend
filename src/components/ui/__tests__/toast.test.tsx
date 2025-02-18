import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
    Toast,
    ToastAction,
    ToastClose,
    ToastDescription,
    ToastTitle,
    ToastProvider,
    ToastViewport,
} from '../toast';

// Helper function to render toast with provider
const renderToast = (ui: React.ReactElement) => {
    return render(
        <ToastProvider>
            {ui}
            <ToastViewport />
        </ToastProvider>
    );
};

describe('Toast Component', () => {
    // Test basic rendering
    it('renders toast with title and description', () => {
        renderToast(
            <Toast>
                <ToastTitle>Test Title</ToastTitle>
                <ToastDescription>Test Description</ToastDescription>
            </Toast>
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    // Test variants
    it('renders different variants correctly', () => {
        const { rerender } = renderToast(<Toast variant="default" />);
        const toasts = screen.getAllByRole('status');
        const mainToast = toasts.find(toast => toast.tagName.toLowerCase() === 'li');
        expect(mainToast).toHaveClass('bg-white');

        rerender(
            <ToastProvider>
                <Toast variant="destructive" />
                <ToastViewport />
            </ToastProvider>
        );
        const destructiveToasts = screen.getAllByRole('status');
        const destructiveToast = destructiveToasts.find(toast => toast.tagName.toLowerCase() === 'li');
        expect(destructiveToast).toHaveClass('destructive');

        rerender(
            <ToastProvider>
                <Toast variant="success" />
                <ToastViewport />
            </ToastProvider>
        );
        const successToasts = screen.getAllByRole('status');
        const successToast = successToasts.find(toast => toast.tagName.toLowerCase() === 'li');
        expect(successToast).toHaveClass('border-green-500');
    });

    // Test toast action
    it('renders toast action and handles click', () => {
        const onAction = vi.fn();
        renderToast(
            <Toast>
                <ToastAction altText="Test action" onClick={onAction}>
                    Action
                </ToastAction>
            </Toast>
        );

        const actionButton = screen.getByText('Action');
        fireEvent.click(actionButton);
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    // Test close button
    it('renders close button and handles click', () => {
        const onClose = vi.fn();
        renderToast(
            <Toast>
                <ToastClose onClick={onClose} />
            </Toast>
        );

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    // Test viewport positioning
    it('renders toast viewport with correct positioning classes', () => {
        renderToast(<Toast />);

        const viewport = screen.getByRole('list');
        expect(viewport).toHaveClass('fixed');
        expect(viewport).toHaveClass('top-0');
        expect(viewport).toHaveClass('z-[100]');
    });

    // Test custom className prop
    it('accepts and applies custom className', () => {
        const customClass = 'custom-toast-class';
        renderToast(<Toast className={customClass} />);

        const toasts = screen.getAllByRole('status');
        const mainToast = toasts.find(toast => toast.tagName.toLowerCase() === 'li');
        expect(mainToast).toHaveClass(customClass);
    });

    // Test toast animation states
    it('has correct animation classes', () => {
        renderToast(<Toast />);

        const toasts = screen.getAllByRole('status');
        const mainToast = toasts.find(toast => toast.tagName.toLowerCase() === 'li');
        expect(mainToast).toHaveClass('data-[state=open]:animate-in');
        expect(mainToast).toHaveClass('data-[state=closed]:animate-out');
    });
}); 