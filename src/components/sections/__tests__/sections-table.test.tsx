import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { SectionsTable } from '../sections-table';
import type { Section } from '@/types';

describe('SectionsTable', () => {
    const mockOnEditAction = vi.fn();
    const mockOnDeleteAction = vi.fn();
    const testDate = new Date().toISOString().split('T')[0];

    const mockSections: Section[] = [
        {
            id: 1,
            name: 'Test Section 1',
            date: testDate,
            created_at: new Date().toISOString(),
        },
        {
            id: 2,
            name: 'Test Section 2',
            date: '2020-01-01', // Past date
            created_at: new Date().toISOString(),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders table headers correctly', () => {
        render(
            <SectionsTable
                sections={[]}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Created')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders sections data correctly', () => {
        render(
            <SectionsTable
                sections={mockSections}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        // Check section names
        expect(screen.getByText('Test Section 1')).toBeInTheDocument();
        expect(screen.getByText('Test Section 2')).toBeInTheDocument();

        // Check dates
        expect(screen.getByText('Today')).toBeInTheDocument();

        // Check actions
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        expect(editButtons).toHaveLength(2);
        expect(deleteButtons).toHaveLength(2);
    });

    it('handles edit action', () => {
        render(
            <SectionsTable
                sections={mockSections}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        fireEvent.click(editButtons[0]);

        expect(mockOnEditAction).toHaveBeenCalledWith(mockSections[0]);
    });

    it('handles delete action', () => {
        render(
            <SectionsTable
                sections={mockSections}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        expect(mockOnDeleteAction).toHaveBeenCalledWith(mockSections[0]);
    });

    it('formats dates correctly', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sectionsWithDifferentDates: Section[] = [
            {
                id: 1,
                name: 'Today Section',
                date: today.toISOString().split('T')[0],
                created_at: today.toISOString(),
            },
            {
                id: 2,
                name: 'Yesterday Section',
                date: yesterday.toISOString().split('T')[0],
                created_at: yesterday.toISOString(),
            },
            {
                id: 3,
                name: 'Tomorrow Section',
                date: tomorrow.toISOString().split('T')[0],
                created_at: tomorrow.toISOString(),
            },
        ];

        render(
            <SectionsTable
                sections={sectionsWithDifferentDates}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('Yesterday')).toBeInTheDocument();
        expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('handles invalid dates gracefully', () => {
        // Подавляем ошибку в консоли для этого теста
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const sectionsWithInvalidDates: Section[] = [
            {
                id: 1,
                name: 'Invalid Date Section',
                date: 'invalid-date',
                created_at: new Date().toISOString(),
            },
        ];

        render(
            <SectionsTable
                sections={sectionsWithInvalidDates}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        expect(screen.getByText('Invalid date')).toBeInTheDocument();

        // Проверяем, что ошибка была перехвачена
        expect(consoleSpy).toHaveBeenCalled();

        // Восстанавливаем console.error
        consoleSpy.mockRestore();
    });

    it('renders empty state when no sections provided', () => {
        render(
            <SectionsTable
                sections={[]}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const tableBody = screen.getAllByRole('rowgroup')[1]; // Get the tbody element
        expect(tableBody.children).toHaveLength(0);
    });

    it('handles undefined dates correctly', () => {
        const sectionWithUndefinedDates: Partial<Section>[] = [
            {
                id: 1,
                name: 'Undefined Dates Section',
                date: undefined,
                created_at: undefined,
            },
        ];

        render(
            <SectionsTable
                sections={sectionWithUndefinedDates as Section[]}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const noDates = screen.getAllByText('No date');
        expect(noDates).toHaveLength(2); // Should find 'No date' twice - for date and created_at
    });

    it('formats created_at date correctly', () => {
        const specificDate = '2024-03-15T10:00:00Z';
        const sectionWithSpecificCreatedDate: Section[] = [
            {
                id: 1,
                name: 'Test Section',
                date: testDate,
                created_at: specificDate,
            },
        ];

        render(
            <SectionsTable
                sections={sectionWithSpecificCreatedDate}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
    });
}); 