import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { SectionForm } from '../section-form';
import { mockHooks } from '@/__mocks__/hooks';
import { renderWithProviders } from '@/__mocks__/test-wrapper';
import { mockMutation } from '@/__mocks__/test-submit-setup';
import { TestDateUtils } from '@/__mocks__/test-constants';
import { FORM_VALIDATION } from '@/app/constants';

// Mock toast context
const mockShowError = vi.fn();
vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: () => ({
        showError: mockShowError,
    }),
}));

// Mock sections hook
vi.mock('@/hooks/use-sections', () => ({
    useSections: () => ({
        data: [],
        isLoading: false,
        createSection: mockMutation,
        updateSection: mockMutation,
    }),
}));

describe('SectionForm', () => {
    const mockOnOpenChangeAction = vi.fn();
    const testDate = TestDateUtils.getBaseTestDate();
    const formattedDate = TestDateUtils.formatDate(testDate);

    beforeEach(() => {
        mockHooks();
        vi.clearAllMocks();
        mockMutation.mutateAsync.mockClear();
        mockOnOpenChangeAction.mockClear();
        mockShowError.mockClear();
    });

    it('renders empty form for new section', () => {
        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('validates form submission for new section', async () => {
        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        await act(async () => {
            // Fill form with valid test data
            const nameInput = screen.getByLabelText(/name/i);
            const dateInput = screen.getByLabelText(/date/i);

            fireEvent.change(nameInput, { target: { value: 'Test Section' } });
            fireEvent.change(dateInput, { target: { value: formattedDate } });

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create/i });
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(mockMutation.mutateAsync).toHaveBeenCalledWith({
                name: 'Test Section',
                date: formattedDate,
            });
            expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
        });
    });

    it('shows validation error for empty name', async () => {
        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        await act(async () => {
            const form = screen.getByRole('form');
            await fireEvent.submit(form, {
                preventDefault: () => { },
            });
        });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith(FORM_VALIDATION.NAME_REQUIRED_MESSAGE);
            expect(mockMutation.mutateAsync).not.toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    it('shows validation error for empty date', async () => {
        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        await act(async () => {
            const nameInput = screen.getByLabelText(/name/i);
            await fireEvent.change(nameInput, { target: { value: 'Test Section' } });

            const dateInput = screen.getByLabelText(/date/i);
            await fireEvent.change(dateInput, { target: { value: '' } });

            const form = screen.getByRole('form');
            await fireEvent.submit(form, {
                preventDefault: () => { },
            });
        });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith(FORM_VALIDATION.DATE_REQUIRED_MESSAGE);
            expect(mockMutation.mutateAsync).not.toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    it('shows confirmation dialog on cancel with unsaved changes', async () => {
        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockImplementation(() => true);

        renderWithProviders(
            <SectionForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />
        );

        await act(async () => {
            // Make changes to the form
            const nameInput = screen.getByLabelText(/name/i);
            const dateInput = screen.getByLabelText(/date/i);

            fireEvent.change(nameInput, { target: { value: 'Test Section' } });
            fireEvent.change(dateInput, { target: { value: formattedDate } });

            // Click cancel
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            fireEvent.click(cancelButton);
        });

        await waitFor(() => {
            expect(confirmSpy).toHaveBeenCalledWith(FORM_VALIDATION.UNSAVED_CHANGES_MESSAGE);
            expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
        });

        confirmSpy.mockRestore();
    });
}); 