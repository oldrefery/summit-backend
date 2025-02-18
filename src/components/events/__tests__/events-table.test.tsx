import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EventsTable } from '../events-table';
import { format } from 'date-fns';
import type { Event, EventPerson, Person } from '@/types';
import { createTestData } from '@/__mocks__/hooks';

// Мок данных для тестов
const mockEvents: (Event & {
    event_people: (EventPerson & { person: Person })[];
})[] = [
        {
            ...createTestData.event({
                id: 1,
                title: 'Test Event 1',
                date: '2024-03-20',
                start_time: '10:00:00',
                end_time: '11:00:00',
                description: 'Test description 1',
                section_id: 1,
            }),
            section: { name: 'Test Section 1' },
            location: createTestData.location({
                id: 1,
                name: 'Test Location 1',
            }),
            event_people: [
                {
                    id: 1,
                    event_id: 1,
                    person_id: 1,
                    role: 'speaker',
                    created_at: new Date().toISOString(),
                    person: createTestData.person({
                        id: 1,
                        name: 'Test Speaker 1',
                        role: 'speaker',
                    })
                }
            ]
        },
        {
            ...createTestData.event({
                id: 2,
                title: 'Test Event 2',
                date: '2024-03-21',
                start_time: '14:00:00',
                end_time: '15:00:00',
                description: null,
                section_id: 2,
            }),
            section: { name: 'Test Section 2' },
            location: undefined,
            event_people: []
        }
    ];

describe('EventsTable', () => {
    const mockOnDeleteAction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders events correctly', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);

        // Проверяем отображение заголовков событий
        expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        expect(screen.getByText('Test Event 2')).toBeInTheDocument();

        // Проверяем отображение секций
        expect(screen.getByText('Test Section 1')).toBeInTheDocument();
        expect(screen.getByText('Test Section 2')).toBeInTheDocument();

        // Проверяем отображение дат и времени
        const formattedDate1 = format(new Date('2024-03-20'), 'MMMM d, yyyy');
        const formattedDate2 = format(new Date('2024-03-21'), 'MMMM d, yyyy');

        expect(screen.getByText(`${formattedDate1} | 10:00 - 11:00`)).toBeInTheDocument();
        expect(screen.getByText(`${formattedDate2} | 14:00 - 15:00`)).toBeInTheDocument();
    });

    it('displays location when available', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);
        expect(screen.getByText('Test Location 1')).toBeInTheDocument();
    });

    it('displays description when available', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);
        expect(screen.getByText('Test description 1')).toBeInTheDocument();
    });

    it('displays speakers when available', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);
        expect(screen.getByText('Test Speaker 1')).toBeInTheDocument();
    });

    it('handles delete action', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);

        // Находим все кнопки удаления
        const deleteButtons = screen.getAllByRole('button', { name: /delete event/i });

        // Кликаем по первой кнопке удаления
        fireEvent.click(deleteButtons[0]);

        // Проверяем, что функция onDeleteAction была вызвана с правильным событием
        expect(mockOnDeleteAction).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('renders edit links correctly', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);

        // Проверяем наличие ссылок на редактирование
        const editLinks = screen.getAllByRole('link');
        expect(editLinks[0]).toHaveAttribute('href', '/events/1/edit');
        expect(editLinks[1]).toHaveAttribute('href', '/events/2/edit');
    });

    it('handles invalid time format gracefully', () => {
        const eventsWithInvalidTime = [{
            ...mockEvents[0],
            start_time: 'invalid',
            end_time: 'invalid'
        }];

        render(<EventsTable events={eventsWithInvalidTime} onDeleteAction={mockOnDeleteAction} />);

        const formattedDate = format(new Date('2024-03-20'), 'MMMM d, yyyy');
        expect(screen.getByText(`${formattedDate} | Invalid time - Invalid time`)).toBeInTheDocument();
    });
}); 