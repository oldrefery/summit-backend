import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { LocationsTable } from '../locations-table';
import type { Location } from '@/types';

describe('LocationsTable', () => {
    const mockOnEditAction = vi.fn();
    const mockOnDeleteAction = vi.fn();

    const mockLocations: Location[] = [
        {
            id: 1,
            name: 'Test Location 1',
            link_map: 'https://maps.test.com',
            link: null,
            link_address: 'https://address.test.com',
            created_at: new Date().toISOString(),
        },
        {
            id: 2,
            name: 'Test Location 2',
            link_map: null,
            link: null,
            link_address: null,
            created_at: new Date().toISOString(),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders table headers correctly', () => {
        render(
            <LocationsTable
                locations={[]}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(screen.getByText('Map Link')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders locations data correctly', () => {
        render(
            <LocationsTable
                locations={mockLocations}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        // Check location names
        expect(screen.getByText('Test Location 1')).toBeInTheDocument();
        expect(screen.getByText('Test Location 2')).toBeInTheDocument();

        // Check address links
        expect(screen.getByText('https://address.test.com')).toBeInTheDocument();
        expect(screen.getByText('-')).toBeInTheDocument();

        // Check map links
        const mapLinks = screen.getAllByText(/Yes|No/);
        expect(mapLinks[0]).toHaveTextContent('Yes'); // First location has map link
        expect(mapLinks[1]).toHaveTextContent('No'); // Second location has no map link

        // Check actions
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        expect(editButtons).toHaveLength(2);
        expect(deleteButtons).toHaveLength(2);
    });

    it('handles edit action', () => {
        render(
            <LocationsTable
                locations={mockLocations}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        fireEvent.click(editButtons[0]);

        expect(mockOnEditAction).toHaveBeenCalledWith(mockLocations[0]);
    });

    it('handles delete action', () => {
        render(
            <LocationsTable
                locations={mockLocations}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        expect(mockOnDeleteAction).toHaveBeenCalledWith(mockLocations[0]);
    });

    it('renders empty state when no locations provided', () => {
        render(
            <LocationsTable
                locations={[]}
                onEditAction={mockOnEditAction}
                onDeleteAction={mockOnDeleteAction}
            />
        );

        const tableBody = screen.getAllByRole('rowgroup')[1]; // Get the tbody element
        expect(tableBody.children).toHaveLength(0);
    });
}); 