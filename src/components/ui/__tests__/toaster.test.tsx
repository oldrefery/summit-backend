import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import { Toaster } from '../toaster';

// Mock useToast hook
vi.mock('../use-toast', () => ({
    useToast: () => ({
        toasts: []
    })
}));

// Mock ToastProvider and other toast components
vi.mock('../toast', () => ({
    Toast: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ToastClose: () => <button>Close</button>,
    ToastDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ToastTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ToastViewport: () => <div>Viewport</div>
}));

describe('Toaster Component', () => {
    it('renders without crashing', () => {
        render(<Toaster />);
    });
}); 