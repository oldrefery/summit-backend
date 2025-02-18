import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationHistory } from '../notification-history';
import { useNotificationHistory } from '@/hooks/use-push';
import type { NotificationHistory as NotificationHistoryType } from '@/hooks/use-push';

// Mock the hooks
vi.mock('@/hooks/use-push', () => ({
    useNotificationHistory: vi.fn(),
}));

interface NotificationDetailsProps {
    notification: NotificationHistoryType;
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
}

// Mock NotificationDetails component
vi.mock('../notification-details', () => ({
    NotificationDetails: ({ notification, open, onOpenChangeAction }: NotificationDetailsProps) => (
        open ? (
            <td data-testid="notification-details">
                <h2>Details for {notification.title}</h2>
                <button onClick={() => onOpenChangeAction(false)}>Close</button>
            </td>
        ) : null
    ),
}));

describe('NotificationHistory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state', () => {
        (useNotificationHistory as jest.Mock).mockReturnValue({
            data: [],
            isLoading: true,
        });

        render(<NotificationHistory />);
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('renders empty history', () => {
        (useNotificationHistory as jest.Mock).mockReturnValue({
            data: [],
            isLoading: false,
        });

        render(<NotificationHistory />);

        expect(screen.getByText('Notification History')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByRole('cell')).toBeNull();
    });

    it('renders notification list', () => {
        const mockNotifications: NotificationHistoryType[] = [
            {
                id: 1,
                title: 'Test Notification 1',
                body: 'Test body 1',
                sent_at: new Date().toISOString(),
                sent_by: 'test-user',
                success_count: 10,
                failure_count: 0,
                target_type: 'all',
                target_users: [],
                data: { action: 'open' },
            },
            {
                id: 2,
                title: 'Test Notification 2',
                body: 'Test body 2',
                sent_at: new Date().toISOString(),
                sent_by: 'test-user',
                success_count: 8,
                failure_count: 2,
                target_type: 'specific_users',
                target_users: ['1', '2', '3'],
                data: { action: 'open' },
            },
        ];

        (useNotificationHistory as jest.Mock).mockReturnValue({
            data: mockNotifications,
            isLoading: false,
        });

        render(<NotificationHistory />);

        // Проверяем заголовки таблицы
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Sent At')).toBeInTheDocument();
        expect(screen.getByText('Target')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();

        // Проверяем данные уведомлений
        expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
        expect(screen.getByText('Test Notification 2')).toBeInTheDocument();
        expect(screen.getByText('All Users')).toBeInTheDocument();
        expect(screen.getByText('3 users')).toBeInTheDocument();
        expect(screen.getByText('10 delivered')).toBeInTheDocument();
        expect(screen.getByText('8 delivered')).toBeInTheDocument();
        expect(screen.getByText('2 failed')).toBeInTheDocument();
    });

    it('handles view details click', () => {
        const mockNotification: NotificationHistoryType = {
            id: 1,
            title: 'Test Notification',
            body: 'Test body',
            sent_at: new Date().toISOString(),
            sent_by: 'test-user',
            success_count: 1,
            failure_count: 0,
            target_type: 'all',
            target_users: [],
            data: { action: 'open' },
        };

        (useNotificationHistory as jest.Mock).mockReturnValue({
            data: [mockNotification],
            isLoading: false,
        });

        render(<NotificationHistory />);

        // Открываем детали
        const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
        fireEvent.click(viewDetailsButton);

        // Проверяем, что детали отображаются
        expect(screen.getByTestId('notification-details')).toBeInTheDocument();
        expect(screen.getByText(`Details for ${mockNotification.title}`)).toBeInTheDocument();

        // Закрываем детали
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        // Проверяем, что детали скрыты
        expect(screen.queryByTestId('notification-details')).not.toBeInTheDocument();
    });
}); 