import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PersonForm } from '../person-form';
import { usePeople } from '@/hooks/use-people';
import { useToastContext } from '@/components/providers/toast-provider';
import { storage } from '@/lib/supabase';

// Mock ResizeObserver
class ResizeObserverMock {
    observe() { }
    unobserve() { }
    disconnect() { }
}

global.ResizeObserver = ResizeObserverMock;

// Mock the hooks and services
vi.mock('@/hooks/use-people', () => ({
    usePeople: vi.fn(),
}));

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    storage: {
        uploadAvatar: vi.fn(),
        removeAvatar: vi.fn(),
    },
}));

vi.mock('@/components/ui/image-upload', () => ({
    ImageUpload: ({ onChange }: { onChange: (file: File | null) => void }) => (
        <input
            type="file"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
            data-testid="image-upload"
        />
    ),
}));

describe('PersonForm', () => {
    const mockOnOpenChangeAction = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockCreatePerson = { mutateAsync: vi.fn() };
    const mockUpdatePerson = { mutateAsync: vi.fn() };
    const mockShowError = vi.fn();
    const mockShowSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        (usePeople as jest.Mock).mockReturnValue({
            createPerson: mockCreatePerson,
            updatePerson: mockUpdatePerson,
        });

        (useToastContext as jest.Mock).mockReturnValue({
            showError: mockShowError,
            showSuccess: mockShowSuccess,
        });

        // Reset window.confirm mock
        vi.spyOn(window, 'confirm').mockImplementation(() => true);
    });

    it('renders create form correctly', () => {
        render(
            <PersonForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText('Add Person')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('renders edit form correctly', () => {
        const person = {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'speaker' as const,
        };

        render(
            <PersonForm
                person={person}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText('Edit Person')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe');
        expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
        expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(
            <PersonForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Name is required');
        });
        expect(mockCreatePerson.mutateAsync).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
        render(
            <PersonForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { name: 'email', value: 'invalid-email' } });

        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();

        const submitButton = screen.getByRole('button', { name: /create/i });
        fireEvent.click(submitButton);

        expect(mockCreatePerson.mutateAsync).not.toHaveBeenCalled();
    });

    it('validates mobile format', async () => {
        render(
            <PersonForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        const nameInput = screen.getByLabelText(/name/i);
        const mobileInput = screen.getByLabelText(/mobile/i);

        fireEvent.change(nameInput, { target: { name: 'name', value: 'John Doe' } });
        fireEvent.change(mobileInput, { target: { name: 'mobile', value: 'invalid-mobile' } });

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Invalid mobile number format');
        });
        expect(mockCreatePerson.mutateAsync).not.toHaveBeenCalled();
    });

    it('handles successful person creation', async () => {
        render(
            <PersonForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);

        fireEvent.change(nameInput, { target: { name: 'name', value: 'John Doe' } });
        fireEvent.change(emailInput, { target: { name: 'email', value: 'john@example.com' } });

        const submitButton = screen.getByRole('button', { name: /create/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockCreatePerson.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
                name: 'John Doe',
                email: 'john@example.com',
                hidden: false,
            }));
            expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    it('handles successful person update', async () => {
        const person = {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'speaker' as const,
        };

        render(
            <PersonForm
                person={person}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { name: 'name', value: 'Jane Doe' } });

        const submitButton = screen.getByRole('button', { name: /update/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockUpdatePerson.mutateAsync).toHaveBeenCalledWith({
                id: 1,
                data: expect.objectContaining({
                    name: 'Jane Doe',
                }),
            });
            expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    it('handles photo upload', async () => {
        const mockPhotoUrl = 'https://example.com/photo.jpg';
        (storage.uploadAvatar as jest.Mock).mockResolvedValue(mockPhotoUrl);

        render(
            <PersonForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
        const imageUpload = screen.getByTestId('image-upload');
        fireEvent.change(imageUpload, { target: { files: [file] } });

        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { name: 'name', value: 'John Doe' } });

        const submitButton = screen.getByRole('button', { name: /create/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(storage.uploadAvatar).toHaveBeenCalledWith(file, expect.any(String));
            expect(mockCreatePerson.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
                name: 'John Doe',
                photo_url: mockPhotoUrl,
            }));
        });
    });

    it('shows unsaved changes warning', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');

        render(
            <PersonForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { name: 'name', value: 'John Doe' } });

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?');
    });

    it('renders bio field and allows editing it', async () => {
        const person = {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'speaker' as const,
            bio: 'Initial bio text',
        };

        render(
            <PersonForm
                person={person}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        // Check if bio field exists and has the correct initial value
        const bioInput = screen.getByLabelText(/bio/i);
        expect(bioInput).toBeInTheDocument();
        expect(bioInput).toHaveValue('Initial bio text');

        // Change bio value
        fireEvent.change(bioInput, { target: { name: 'bio', value: 'Updated bio information' } });
        expect(bioInput).toHaveValue('Updated bio information');

        // Submit the form and check if bio is included in the update
        const submitButton = screen.getByRole('button', { name: /update/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockUpdatePerson.mutateAsync).toHaveBeenCalledWith({
                id: 1,
                data: expect.objectContaining({
                    bio: 'Updated bio information',
                }),
            });
        });
    });

    it('toggles hidden status correctly', async () => {
        render(
            <PersonForm
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
                onSuccess={mockOnSuccess}
            />
        );

        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { name: 'name', value: 'John Doe' } });

        // Find the hidden toggle by looking for the label text
        const hiddenLabel = screen.getByText('Hidden');
        const hiddenSwitch = hiddenLabel.closest('div')?.parentElement?.querySelector('button');
        if (hiddenSwitch) {
            fireEvent.click(hiddenSwitch);
        }

        const submitButton = screen.getByRole('button', { name: /create/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockCreatePerson.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
                name: 'John Doe',
                hidden: true,
            }));
        });
    });
}); 