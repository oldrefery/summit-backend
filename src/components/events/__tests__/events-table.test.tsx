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
                section_id: 1,
                title: 'Test Event 1',
                date: '2024-02-21',
                start_time: '2024-02-21T10:00:00Z',
                end_time: '2024-02-21T11:00:00Z',
                description: 'Test Description 1',
                duration: '1h',
                location_id: 1
            }),
            section: {
                name: 'Test Section'
            },
            location: {
                id: 1,
                name: 'Test Location',
                link_map: null,
                created_at: '2024-02-21T10:00:00Z'
            },
            event_people: [
                {
                    id: 1,
                    event_id: 1,
                    person_id: 1,
                    role: 'speaker',
                    created_at: '2024-02-21T10:00:00Z',
                    person: {
                        id: 1,
                        name: 'Test Speaker',
                        role: 'speaker',
                        created_at: '2024-02-21T10:00:00Z'
                    }
                }
            ]
        },
        {
            ...createTestData.event({
                id: 2,
                section_id: 2,
                title: 'Test Event 2',
                date: '2024-02-21',
                start_time: '2024-02-21T11:00:00Z',
                end_time: '2024-02-21T12:00:00Z',
                description: null,
                duration: null,
                location_id: null
            }),
            section: {
                name: 'Test Section 2'
            },
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
        expect(screen.getByText('Test Section')).toBeInTheDocument();
        expect(screen.getByText('Test Section 2')).toBeInTheDocument();

        // Проверяем отображение дат и времени
        const formattedDate = format(new Date('2024-02-21'), 'MMMM d, yyyy');

        // Проверяем каждый элемент времени отдельно
        const timeElements = screen.getAllByText((content) => {
            return content.includes(formattedDate) ||
                content.includes('11:00') ||
                content.includes('12:00');
        });

        expect(timeElements.length).toBeGreaterThan(0);

        // Проверяем наличие всех временных интервалов
        const timeText = timeElements.map(el => el.textContent).join(' ');
        expect(timeText).toMatch(/11:00.*12:00/);
        expect(timeText).toContain(formattedDate);
    });

    it('displays location when available', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);
        expect(screen.getByText('Test Location')).toBeInTheDocument();
    });

    it('displays description when available', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);
        expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    });

    it('displays speakers when available', () => {
        render(<EventsTable events={mockEvents} onDeleteAction={mockOnDeleteAction} />);
        expect(screen.getByText('Test Speaker')).toBeInTheDocument();
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

        const formattedDate = format(new Date('2024-02-21'), 'MMMM d, yyyy');
        expect(screen.getByText(`${formattedDate} | Invalid time - Invalid time`)).toBeInTheDocument();
    });
}); 