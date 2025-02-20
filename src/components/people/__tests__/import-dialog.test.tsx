import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportDialog } from '../import-dialog';
import { useToastContext, ToastContextType } from '@/components/providers/toast-provider';
import { usePeople } from '@/hooks/use-people';
import readXlsxFile from 'read-excel-file';
import { EXCEL_IMPORT } from '@/app/constants';
import type { Person, PersonFormData } from '@/types';
import type { UseMutationResult } from '@tanstack/react-query';

// Мокаем зависимости
vi.mock('read-excel-file');
vi.mock('@/hooks/use-people');
vi.mock('@/components/providers/toast-provider');

describe('ImportDialog', () => {
    const mockOnOpenChange = vi.fn();
    const mockShowError = vi.fn();
    const mockShowSuccess = vi.fn();
    const mockCreatePerson = vi.fn();
    const mockUpdatePerson = vi.fn();
    const mockDeletePerson = vi.fn();

    const createMockMutation = <TData, TVariables>(mutateAsyncFn: (variables: TVariables) => Promise<TData>): UseMutationResult<TData, Error, TVariables, unknown> => ({
        mutateAsync: mutateAsyncFn,
        mutate: vi.fn(),
        data: undefined,
        error: null,
        failureCount: 0,
        failureReason: null,
        isError: false,
        isPaused: false,
        isSuccess: false,
        isIdle: true,
        isPending: false,
        reset: vi.fn(),
        status: 'idle',
        submittedAt: 0,
        variables: undefined,
        context: undefined
    });

    beforeEach(() => {
        vi.clearAllMocks();

        // Мокаем хуки
        vi.mocked(useToastContext).mockReturnValue({
            showError: mockShowError,
            showSuccess: mockShowSuccess,
        } as ToastContextType);

        vi.mocked(usePeople).mockReturnValue({
            createPerson: createMockMutation<Person, PersonFormData>(mockCreatePerson),
            updatePerson: createMockMutation<Person, { id: number; data: Partial<PersonFormData> }>(mockUpdatePerson),
            deletePerson: createMockMutation<void, number>(mockDeletePerson),
            data: [],
            isLoading: false,
            isError: false,
            error: null,
        });
    });

    it('renders correctly when open', () => {
        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChange} />);

        expect(screen.getByText('Import People from Excel')).toBeInTheDocument();
        expect(screen.getByLabelText('file')).toBeInTheDocument();
    });

    it('handles file size validation', async () => {
        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChange} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        Object.defineProperty(file, 'size', { value: EXCEL_IMPORT.MAX_FILE_SIZE + 1 });

        const input = screen.getByLabelText('file');
        fireEvent.change(input, { target: { files: [file] } });

        expect(mockShowError).toHaveBeenCalledWith('File size exceeds 5MB limit');
    });

    it('handles empty Excel file', async () => {
        vi.mocked(readXlsxFile).mockResolvedValueOnce([]);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChange} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText('file');
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Excel file must contain at least one data row');
        });
    });

    it('handles invalid Excel structure', async () => {
        vi.mocked(readXlsxFile).mockResolvedValueOnce([
            ['Invalid', 'Headers'],
            ['Data', 'Row'],
        ]);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChange} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText('file');
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Invalid Excel file structure. Please check column headers');
        });
    });

    it('handles successful import with no duplicates', async () => {
        const mockData = [
            ['Name', 'Role', 'Title', 'Company', 'Country', 'Email', 'Mobile', 'Bio'],
            ['John Doe', 'speaker', 'Developer', 'Company', 'US', 'john@example.com', '123456', 'Bio'],
        ];

        vi.mocked(readXlsxFile).mockResolvedValueOnce(mockData);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChange} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText('file');
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockCreatePerson).toHaveBeenCalledTimes(1);
            expect(mockShowSuccess).toHaveBeenCalledWith('Successfully imported 1 people');
            expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it('handles duplicate records', async () => {
        const existingPeople: Person[] = [{
            id: 1,
            name: 'John Doe',
            role: 'speaker',
            created_at: new Date().toISOString(),
            email: 'john@example.com',
            title: 'Developer',
            company: 'Company',
            country: 'US',
            mobile: '123456',
            bio: 'Bio'
        }];

        vi.mocked(usePeople).mockReturnValue({
            createPerson: createMockMutation<Person, PersonFormData>(mockCreatePerson),
            updatePerson: createMockMutation<Person, { id: number; data: Partial<PersonFormData> }>(mockUpdatePerson),
            deletePerson: createMockMutation<void, number>(mockDeletePerson),
            data: existingPeople,
            isLoading: false,
            isError: false,
            error: null,
        });

        const mockData = [
            ['Name', 'Role', 'Title', 'Company', 'Country', 'Email', 'Mobile', 'Bio'],
            ['John Doe', 'speaker', 'Developer', 'Company', 'US', 'john@example.com', '123456', 'Bio'],
        ];

        vi.mocked(readXlsxFile).mockResolvedValueOnce(mockData);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChange} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText('file');
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('All records are duplicates. Nothing to import');
            expect(mockCreatePerson).not.toHaveBeenCalled();
        });
    });

    it('handles missing required fields', async () => {
        const mockData = [
            ['Name', 'Role', 'Title', 'Company', 'Country', 'Email', 'Mobile', 'Bio'],
            ['', 'speaker', 'Developer', 'Company', 'US', 'john@example.com', '123456', 'Bio'],
        ];

        vi.mocked(readXlsxFile).mockResolvedValueOnce(mockData);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChange} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText('file');
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Validation errors:\nRow 2: Name is required');
            expect(mockCreatePerson).not.toHaveBeenCalled();
        });
    });

    it('handles read-excel-file errors', async () => {
        const mockError = new Error('Failed to read file');
        vi.mocked(readXlsxFile).mockRejectedValueOnce(mockError);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChange} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText('file');
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Failed to read file');
        });
    });
}); 