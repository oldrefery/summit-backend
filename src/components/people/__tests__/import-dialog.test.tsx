import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportDialog } from '../import-dialog';
import { useToastContext, ToastContextType } from '@/components/providers/toast-provider';
import { usePeople, UsePeopleReturn } from '@/hooks/use-people';
import readXlsxFile from 'read-excel-file';
import { EXCEL_IMPORT } from '@/app/constants';

// Мокаем зависимости
vi.mock('read-excel-file');
vi.mock('@/hooks/use-people');
vi.mock('@/components/providers/toast-provider');

describe('ImportDialog', () => {
    const mockOnOpenChange = vi.fn();
    const mockShowError = vi.fn();
    const mockShowSuccess = vi.fn();
    const mockCreatePerson = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Мокаем хуки
        vi.mocked(useToastContext).mockReturnValue({
            showError: mockShowError,
            showSuccess: mockShowSuccess,
        } as ToastContextType);

        vi.mocked(usePeople).mockReturnValue({
            createPerson: { mutateAsync: mockCreatePerson },
            data: [],
            isLoading: false,
            error: null,
        } as UsePeopleReturn);
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
        const existingPeople = [{ name: 'John Doe', role: 'speaker' }];
        vi.mocked(usePeople).mockReturnValue({
            createPerson: { mutateAsync: mockCreatePerson },
            data: existingPeople,
            isLoading: false,
            error: null,
        } as UsePeopleReturn);

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