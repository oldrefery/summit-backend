import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ResourcesTable } from '../resources-table';
import type { Resource } from '@/types';

describe('ResourcesTable', () => {
    const mockOnEditAction = vi.fn();
    const mockOnDeleteAction = vi.fn();

    const mockResources: Resource[] = [
        {
            id: 1,
            name: 'Test Resource 1',
            description: 'Test description 1',
            link: 'https://test1.com',
            is_route: true,
            created_at: new Date('2024-01-01').toISOString(),
        },
        {
            id: 2,
            name: 'Test Resource 2',
            description: 'Test description 2',
            link: 'https://test2.com',
            is_route: false,
            created_at: new Date('2024-01-02').toISOString(),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders table headers correctly', () => {
        render(
            <ResourcesTable
                resources={[]}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Created')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it.skip('renders resources data correctly', () => {
        render(
            <ResourcesTable
                resources={mockResources}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        // Check resource names
        expect(screen.getByText('Test Resource 1')).toBeInTheDocument();
        expect(screen.getByText('Test Resource 2')).toBeInTheDocument();

        // Check descriptions
        expect(screen.getByText('Test description 1')).toBeInTheDocument();
        expect(screen.getByText('Test description 2')).toBeInTheDocument();

        // Check route badge
        expect(screen.getByText('Route')).toBeInTheDocument();

        // Check external links
        const links = screen.getAllByRole('link');
        expect(links[0]).toHaveAttribute('href', 'https://test1.com');
        expect(links[1]).toHaveAttribute('href', 'https://test2.com');

        // Check dates
        expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
        expect(screen.getByText('Jan 2, 2024')).toBeInTheDocument();
    });

    it('handles edit action', () => {
        render(
            <ResourcesTable
                resources={mockResources}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        fireEvent.click(editButtons[0]);

        expect(mockOnEditAction).toHaveBeenCalledWith(mockResources[0]);
    });

    it('handles delete action', () => {
        render(
            <ResourcesTable
                resources={mockResources}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        expect(mockOnDeleteAction).toHaveBeenCalledWith(mockResources[0]);
    });

    it('renders empty state when no resources provided', () => {
        render(
            <ResourcesTable
                resources={[]}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const tableBody = screen.getAllByRole('rowgroup')[1]; // Get the tbody element
        expect(tableBody.children).toHaveLength(0);
    });
}); 