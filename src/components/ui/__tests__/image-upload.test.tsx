import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageUpload } from '../image-upload';
import type { ImageProps } from 'next/image';
import type { DetailedHTMLProps, ImgHTMLAttributes } from 'react';

// Mock next/image
vi.mock('next/image', () => ({
    default: (props: ImageProps) => {
        const { unoptimized, src, ...imgProps } = props;
        return <img {...imgProps} src={src.toString()} />;
    },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global.URL, 'createObjectURL', {
    value: mockCreateObjectURL,
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
    value: mockRevokeObjectURL,
});

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

// Mock ToastProvider
const mockShowError = vi.fn();
vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: () => ({
        showError: mockShowError,
    }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ImageUpload Component', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
        mockShowError.mockClear();
        mockCreateObjectURL.mockClear();
        mockRevokeObjectURL.mockClear();

        // Set up URL.createObjectURL mock implementation
        mockCreateObjectURL.mockImplementation((obj: Blob | MediaSource) => {
            if (obj instanceof File) {
                return `mock-url-${obj.name}`;
            }
            return 'mock-url';
        });
    });

    // Test basic rendering
    it('renders upload button when no image is selected', () => {
        render(<ImageUpload onChange={mockOnChange} />);

        expect(screen.getByText('Photo')).toBeInTheDocument();
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
    });

    // Test image preview with URL value
    it('renders image preview when value is provided', () => {
        const testUrl = 'https://example.com/test.jpg';
        render(<ImageUpload onChange={mockOnChange} value={testUrl} />);

        const previewImage = screen.getByAltText('Preview');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute('src', testUrl);
    });

    // Test image preview with storage path
    it('renders image preview with full URL when storage path is provided', () => {
        const storagePath = 'test-image.jpg';
        render(<ImageUpload onChange={mockOnChange} value={storagePath} />);

        const previewImage = screen.getByAltText('Preview');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute(
            'src',
            'https://test.supabase.co/storage/v1/object/public/avatars/test-image.jpg'
        );
    });

    // Test file upload
    it('handles valid image upload', () => {
        render(<ImageUpload onChange={mockOnChange} />);

        const input = screen.getByTestId('photo-upload');
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.change(input, { target: { files: [file] } });

        expect(mockOnChange).toHaveBeenCalledWith(file);
        expect(mockShowError).not.toHaveBeenCalled();
    });

    // Test file size validation
    it('validates file size', () => {
        render(<ImageUpload onChange={mockOnChange} />);

        const input = screen.getByTestId('photo-upload');
        const largeFile = new File(['test'.repeat(1000000)], 'large.jpg', { type: 'image/jpeg' });

        fireEvent.change(input, { target: { files: [largeFile] } });

        expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('File size'));
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    // Test file type validation
    it('validates file type', () => {
        render(<ImageUpload onChange={mockOnChange} />);

        const input = screen.getByTestId('photo-upload');
        const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

        fireEvent.change(input, { target: { files: [invalidFile] } });

        expect(mockShowError).toHaveBeenCalledWith('Only JPG and PNG files are allowed');
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    // Test image removal
    it('handles image removal', () => {
        render(<ImageUpload onChange={mockOnChange} value="https://example.com/test.jpg" />);

        const removeButton = screen.getByRole('button');
        fireEvent.click(removeButton);

        expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    // Test custom className
    it('applies custom className', () => {
        const customClass = 'custom-class';
        render(<ImageUpload onChange={mockOnChange} className={customClass} />);

        const container = screen.getByText('Photo').parentElement;
        expect(container).toHaveClass(customClass);
    });
}); 