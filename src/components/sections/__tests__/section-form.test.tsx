import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SectionForm } from '../section-form';
import { renderWithProviders } from '@/__mocks__/test-wrapper';
import { createMockMutation, UpdateSectionData, Section } from '@/__mocks__/test-submit-setup';
import { FORM_VALIDATION } from '@/app/constants';

// Mock toast context
const mockShowError = vi.fn();
const mockShowSuccess = vi.fn();

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: () => ({
        showError: mockShowError,
        showSuccess: mockShowSuccess,
    }),
}));

// Mock query client
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQueryClient: () => ({
            invalidateQueries: vi.fn(),
        }),
    };
});

// Mock sections hook
const createSectionMock = createMockMutation<Section, Section>();
const updateSectionMock = createMockMutation<Section, UpdateSectionData>(async (data) => {
    return { id: data.id, ...data.data };
});

vi.mock('@/hooks/use-sections', () => ({
    useSections: () => ({
        createSection: createSectionMock,
        updateSection: updateSectionMock,
    }),
}));

describe('SectionForm', () => {
    const mockOnOpenChangeAction = vi.fn();
    const testDate = new Date().toISOString().split('T')[0]; // Today's date

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnOpenChangeAction.mockClear();
        mockShowError.mockClear();
        mockShowSuccess.mockClear();
    });

    it('renders empty form for new section', () => {
        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        expect(screen.getByText('Create New Section')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('renders edit form with section data', () => {
        const section = {
            id: 1,
            name: 'Test Section',
            date: testDate,
            created_at: new Date().toISOString(),
        };

        renderWithProviders(
            <SectionForm
                section={section}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByText('Edit Section')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toHaveValue('Test Section');
        expect(screen.getByLabelText(/date/i)).toHaveValue(testDate);
        expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        const nameInput = screen.getByLabelText(/name/i);
        const dateInput = screen.getByLabelText(/date/i);

        await act(async () => {
            fireEvent.change(nameInput, { target: { value: '' } });
            fireEvent.change(dateInput, { target: { value: '' } });
        });

        await act(async () => {
            const form = screen.getByRole('form');
            fireEvent.submit(form);
        });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith(FORM_VALIDATION.NAME_REQUIRED_MESSAGE);
            expect(createSectionMock.mutateAsync).not.toHaveBeenCalled();
            expect(updateSectionMock.mutateAsync).not.toHaveBeenCalled();
        });
    });

    it('validates date not in past', async () => {
        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        const nameInput = screen.getByLabelText(/name/i);
        const dateInput = screen.getByLabelText(/date/i);
        const submitButton = screen.getByRole('button', { name: /create/i });
        const pastDate = '2020-01-01';

        fireEvent.change(nameInput, { target: { value: 'Test Section' } });
        fireEvent.change(dateInput, { target: { value: pastDate } });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Date cannot be in the past');
            expect(createSectionMock.mutateAsync).not.toHaveBeenCalled();
            expect(updateSectionMock.mutateAsync).not.toHaveBeenCalled();
        });
    });

    it('handles successful section creation', async () => {
        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        const nameInput = screen.getByLabelText(/name/i);
        const dateInput = screen.getByLabelText(/date/i);
        const submitButton = screen.getByRole('button', { name: /create/i });

        fireEvent.change(nameInput, { target: { value: 'New Section' } });
        fireEvent.change(dateInput, { target: { value: testDate } });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(createSectionMock.mutateAsync).toHaveBeenCalledWith({
                name: 'New Section',
                date: testDate,
            });
        });

        await waitFor(() => {
            expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
        });
    });

    it('handles successful section update', async () => {
        const section = {
            id: 1,
            name: 'Test Section',
            date: testDate,
            created_at: new Date().toISOString(),
        };

        renderWithProviders(
            <SectionForm
                section={section}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        const nameInput = screen.getByLabelText(/name/i);
        const submitButton = screen.getByRole('button', { name: /update/i });

        fireEvent.change(nameInput, { target: { value: 'Updated Section' } });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(updateSectionMock.mutateAsync).toHaveBeenCalledWith({
                id: 1,
                data: {
                    name: 'Updated Section',
                    date: testDate,
                },
            });
        });

        await waitFor(() => {
            expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
        });
    });

    it('shows confirmation dialog on cancel with unsaved changes', async () => {
        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockImplementation(() => true);

        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        const nameInput = screen.getByLabelText(/name/i);
        const cancelButton = screen.getByRole('button', { name: /cancel/i });

        fireEvent.change(nameInput, { target: { value: 'Test Section' } });
        await userEvent.click(cancelButton);

        await waitFor(() => {
            expect(confirmSpy).toHaveBeenCalledWith(FORM_VALIDATION.UNSAVED_CHANGES_MESSAGE);
            expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
        });

        confirmSpy.mockRestore();
    });
}); 