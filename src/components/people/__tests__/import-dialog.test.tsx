import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ImportDialog } from '../import-dialog';
import { usePeople } from '@/hooks/use-people';
import { useToastContext } from '@/components/providers/toast-provider';
import readXlsxFile from 'read-excel-file';
import { EXCEL_IMPORT } from '@/app/constants';

// Mock the hooks
vi.mock('@/hooks/use-people', () => ({
    usePeople: vi.fn(),
}));

vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: vi.fn(),
}));

vi.mock('read-excel-file', () => ({
    default: vi.fn(),
}));

describe('ImportDialog', () => {
    const mockOnOpenChangeAction = vi.fn();
    const mockCreatePerson = { mutateAsync: vi.fn() };
    const mockShowError = vi.fn();
    const mockShowSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        (usePeople as jest.Mock).mockReturnValue({
            createPerson: mockCreatePerson,
            data: [],
        });

        (useToastContext as jest.Mock).mockReturnValue({
            showError: mockShowError,
            showSuccess: mockShowSuccess,
        });
    });

    it('renders correctly when open', () => {
        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        expect(screen.getByText('Import People from Excel')).toBeInTheDocument();
        expect(screen.getByText('Upload an Excel file with people data. The file should include required columns.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/file/i)).toBeInTheDocument();
    });

    it('handles file size validation', async () => {
        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        Object.defineProperty(file, 'size', { value: EXCEL_IMPORT.MAX_FILE_SIZE + 1 });

        const input = screen.getByLabelText(/file/i);
        fireEvent.change(input, { target: { files: [file] } });

        expect(mockShowError).toHaveBeenCalledWith('File size exceeds 5MB limit');
    });

    it('handles empty file validation', async () => {
        (readXlsxFile as jest.Mock).mockResolvedValue([[]]);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText(/file/i);
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Excel file must contain at least one data row');
        });
    });

    it('handles successful import', async () => {
        const mockData = [
            ['Name', 'Role', 'Title', 'Company', 'Country', 'Email', 'Mobile', 'Bio'],
            ['John Doe', 'Speaker', 'Developer', 'Company', 'USA', 'john@example.com', '123456789', 'Bio'],
        ];

        (readXlsxFile as jest.Mock).mockResolvedValue(mockData);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText(/file/i);
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockCreatePerson.mutateAsync).toHaveBeenCalledTimes(1);
            expect(mockShowSuccess).toHaveBeenCalledWith('Successfully imported 1 people');
            expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
        });
    });

    it('handles duplicate records', async () => {
        const existingPeople = [{ name: 'John Doe' }];
        (usePeople as jest.Mock).mockReturnValue({
            createPerson: mockCreatePerson,
            data: existingPeople,
        });

        const mockData = [
            ['Name', 'Role', 'Title', 'Company', 'Country', 'Email', 'Mobile', 'Bio'],
            ['John Doe', 'Speaker', 'Developer', 'Company', 'USA', 'john@example.com', '123456789', 'Bio'],
        ];

        (readXlsxFile as jest.Mock).mockResolvedValue(mockData);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText(/file/i);
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('All records are duplicates. Nothing to import');
        });
    });

    it('handles invalid file structure', async () => {
        const mockData = [
            ['InvalidColumn'],
            ['John Doe'],
        ];

        (readXlsxFile as jest.Mock).mockResolvedValue(mockData);

        render(<ImportDialog open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByLabelText(/file/i);
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Invalid Excel file structure. Please check column headers');
        });
    });
}); 