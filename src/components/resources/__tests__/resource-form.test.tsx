import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ResourceForm } from '../resource-form';
import { useToastContext } from '@/components/providers/toast-provider';
import { useResources } from '@/hooks/use-resources';
import type { Resource } from '@/types';

// Mock hooks
vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

vi.mock('@/hooks/use-resources', () => ({
    useResources: vi.fn(),
}));

describe('ResourceForm', () => {
    const mockShowError = vi.fn();
    const mockCreateResource = vi.fn();
    const mockUpdateResource = vi.fn();
    const mockOnOpenChangeAction = vi.fn();

    const mockResource: Resource = {
        id: 1,
        name: 'Test Resource',
        description: 'Test description',
        link: 'https://test.com',
        is_route: false,
        created_at: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        (useToastContext as jest.Mock).mockReturnValue({
            showError: mockShowError,
        });

        (useResources as jest.Mock).mockReturnValue({
            createResource: {
                mutateAsync: mockCreateResource,
                isPending: false,
            },
            updateResource: {
                mutateAsync: mockUpdateResource,
                isPending: false,
            },
        });
    });

    it('renders create form correctly', () => {
        render(
            <ResourceForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByText('Create New Resource')).toBeInTheDocument();
        expect(screen.getByText('Enter the details for the new resource.')).toBeInTheDocument();
        expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Link/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Use the link as a route/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('renders edit form correctly', () => {
        render(
            <ResourceForm
                resource={mockResource}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByText('Edit Resource')).toBeInTheDocument();
        expect(screen.getByText('Edit resource details below.')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Resource')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://test.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(
            <ResourceForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Name is required');
        });
        expect(mockCreateResource).not.toHaveBeenCalled();
    });

    it('validates URL format for non-route links', async () => {
        render(
            <ResourceForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        const nameInput = screen.getByLabelText(/Name/);
        const linkInput = screen.getByLabelText(/Link/);

        fireEvent.change(nameInput, { target: { value: 'Test Resource' } });
        fireEvent.change(linkInput, { target: { value: 'invalid-url' } });

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Please enter a valid URL');
        });
        expect(mockCreateResource).not.toHaveBeenCalled();
    });

    it('handles form submission for create', async () => {
        render(
            <ResourceForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        const nameInput = screen.getByLabelText(/Name/);
        const linkInput = screen.getByLabelText(/Link/);
        const descriptionInput = screen.getByLabelText(/Description/);

        fireEvent.change(nameInput, { target: { value: 'New Resource' } });
        fireEvent.change(linkInput, { target: { value: 'https://example.com' } });
        fireEvent.change(descriptionInput, { target: { value: 'New description' } });

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockCreateResource).toHaveBeenCalledWith({
                name: 'New Resource',
                link: 'https://example.com',
                description: 'New description',
                is_route: false,
            });
        });

        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });

    it('handles form submission for update', async () => {
        render(
            <ResourceForm
                resource={mockResource}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        const nameInput = screen.getByLabelText(/Name/);
        fireEvent.change(nameInput, { target: { value: 'Updated Resource' } });

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockUpdateResource).toHaveBeenCalledWith({
                id: mockResource.id,
                data: {
                    name: 'Updated Resource',
                    link: mockResource.link,
                    description: mockResource.description,
                    is_route: mockResource.is_route,
                },
            });
        });

        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });

    it('shows loading state during submission', () => {
        (useResources as jest.Mock).mockReturnValue({
            createResource: {
                mutateAsync: mockCreateResource,
                isPending: true,
            },
            updateResource: {
                mutateAsync: mockUpdateResource,
                isPending: false,
            },
        });

        render(
            <ResourceForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('handles unsaved changes warning', () => {
        global.confirm = vi.fn(() => true);

        render(
            <ResourceForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        const nameInput = screen.getByLabelText(/Name/);
        fireEvent.change(nameInput, { target: { value: 'New Name' } });

        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        fireEvent.click(cancelButton);

        expect(global.confirm).toHaveBeenCalledWith(
            'You have unsaved changes. Are you sure you want to leave?'
        );
        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });

    it('handles route link validation', async () => {
        render(
            <ResourceForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        const nameInput = screen.getByLabelText(/Name/);
        const linkInput = screen.getByLabelText(/Link/);
        const routeCheckbox = screen.getByLabelText(/Use the link as a route/);

        fireEvent.change(nameInput, { target: { value: 'Route Resource' } });
        fireEvent.change(linkInput, { target: { value: '/my-route' } });
        fireEvent.click(routeCheckbox);

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockCreateResource).toHaveBeenCalledWith({
                name: 'Route Resource',
                link: '/my-route',
                description: '',
                is_route: true,
            });
        });
    });
}); 