import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { LocationForm } from '../location-form';
import { useToastContext } from '@/components/providers/toast-provider';
import { useLocations } from '@/hooks/use-locations';
import type { Location } from '@/types';

// Мокаем хуки
vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

vi.mock('@/hooks/use-locations', () => ({
    useLocations: vi.fn(),
}));

describe('LocationForm', () => {
    const mockShowError = vi.fn();
    const mockCreateLocation = vi.fn();
    const mockUpdateLocation = vi.fn();
    const mockOnOpenChangeAction = vi.fn();

    const mockLocation: Location = {
        id: 1,
        name: 'Test Location',
        link_map: 'https://maps.test.com',
        link: null,
        link_address: 'https://address.test.com',
        created_at: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        (useToastContext as jest.Mock).mockReturnValue({
            showError: mockShowError,
        });

        (useLocations as jest.Mock).mockReturnValue({
            createLocation: {
                mutateAsync: mockCreateLocation,
                isPending: false,
            },
            updateLocation: {
                mutateAsync: mockUpdateLocation,
                isPending: false,
            },
        });
    });

    it('renders create form correctly', () => {
        render(
            <LocationForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByText('Create New Location')).toBeInTheDocument();
        expect(screen.getByText('Enter the details for the new location.')).toBeInTheDocument();
        expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Map Link/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Address Link/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('renders edit form correctly', () => {
        render(
            <LocationForm
                location={mockLocation}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByText('Edit Location')).toBeInTheDocument();
        expect(screen.getByText('Edit location details below.')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://maps.test.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://address.test.com')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(
            <LocationForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        await act(async () => {
            const form = screen.getByRole('form');
            await fireEvent.submit(form);
        });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Name is required');
        });
        expect(mockCreateLocation).not.toHaveBeenCalled();
    });

    it('handles form submission for create', async () => {
        render(
            <LocationForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        await act(async () => {
            const nameInput = screen.getByLabelText(/Name/);
            const mapLinkInput = screen.getByLabelText(/Map Link/);

            fireEvent.change(nameInput, { target: { value: 'New Location' } });
            fireEvent.change(mapLinkInput, { target: { value: 'https://maps.example.com' } });

            const form = screen.getByRole('form');
            await fireEvent.submit(form);
        });

        await waitFor(() => {
            expect(mockCreateLocation).toHaveBeenCalledWith({
                name: 'New Location',
                link_map: 'https://maps.example.com',
                link: null,
                link_address: null,
            });
        });

        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });

    it('handles form submission for update', async () => {
        render(
            <LocationForm
                location={mockLocation}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        await act(async () => {
            const nameInput = screen.getByLabelText(/Name/);
            fireEvent.change(nameInput, { target: { value: 'Updated Location' } });

            const form = screen.getByRole('form');
            await fireEvent.submit(form);
        });

        await waitFor(() => {
            expect(mockUpdateLocation).toHaveBeenCalledWith({
                id: mockLocation.id,
                data: {
                    name: 'Updated Location',
                    link_map: mockLocation.link_map,
                    link: null,
                    link_address: mockLocation.link_address,
                },
            });
        });

        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });

    it('shows loading state during submission', async () => {
        (useLocations as jest.Mock).mockReturnValue({
            createLocation: {
                mutateAsync: mockCreateLocation,
                isPending: true,
            },
            updateLocation: {
                mutateAsync: mockUpdateLocation,
                isPending: false,
            },
        });

        render(
            <LocationForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('handles unsaved changes warning', async () => {
        global.confirm = vi.fn(() => true);

        render(
            <LocationForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        await act(async () => {
            const nameInput = screen.getByLabelText(/Name/);
            fireEvent.change(nameInput, { target: { value: 'New Name' } });

            const cancelButton = screen.getByRole('button', { name: 'Cancel' });
            fireEvent.click(cancelButton);
        });

        expect(global.confirm).toHaveBeenCalledWith(
            'You have unsaved changes. Are you sure you want to leave?'
        );
        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });
}); 