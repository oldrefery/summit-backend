import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationDetails } from '../notification-details';
import type { NotificationHistory } from '@/hooks/use-push';
import { format } from 'date-fns';

describe('NotificationDetails', () => {
    const mockOnOpenChangeAction = vi.fn();
    const mockDate = new Date();
    const mockNotification: NotificationHistory = {
        id: 1,
        title: 'Test Notification',
        body: 'Test notification body',
        sent_at: mockDate.toISOString(),
        sent_by: 'test-user',
        target_type: 'all',
        target_users: [],
        success_count: 10,
        failure_count: 2,
        data: { action: 'open', url: 'https://example.com' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders notification details when open', () => {
        render(
            <NotificationDetails
                notification={mockNotification}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        // Проверяем заголовок
        expect(screen.getByText('Notification Details')).toBeInTheDocument();
        expect(screen.getByText('View detailed information about the notification')).toBeInTheDocument();

        // Проверяем основные данные
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
        expect(screen.getByText('Message')).toBeInTheDocument();
        expect(screen.getByText('Test notification body')).toBeInTheDocument();

        // Проверяем метаданные
        expect(screen.getByText('Sent At')).toBeInTheDocument();
        expect(screen.getByText(format(mockDate, 'PPPp'))).toBeInTheDocument();

        // Проверяем целевую аудиторию
        expect(screen.getByText('Target')).toBeInTheDocument();
        expect(screen.getByText('All Users')).toBeInTheDocument();

        // Проверяем дополнительные данные
        expect(screen.getByText('Additional Data')).toBeInTheDocument();
        const preElement = screen.getByText((content: string) => {
            const normalizedContent = content.replace(/\s+/g, '');
            const expectedJson = JSON.stringify(mockNotification.data).replace(/\s+/g, '');
            return normalizedContent === expectedJson;
        });
        expect(preElement).toBeInTheDocument();
    });

    it('renders specific users target correctly', () => {
        const notificationWithUsers = {
            ...mockNotification,
            target_type: 'specific_users' as const,
            target_users: ['user1', 'user2', 'user3'],
        };

        render(
            <NotificationDetails
                notification={notificationWithUsers}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByText('3 specific users')).toBeInTheDocument();
    });

    it('handles close button click', () => {
        render(
            <NotificationDetails
                notification={mockNotification}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });

    it('does not render when closed', () => {
        render(
            <NotificationDetails
                notification={mockNotification}
                open={false}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.queryByText('Notification Details')).not.toBeInTheDocument();
    });

    it('handles empty data object', () => {
        const notificationWithoutData = {
            ...mockNotification,
            data: {},
        };

        render(
            <NotificationDetails
                notification={notificationWithoutData}
                open={true}
                onOpenChangeAction={mockOnOpenChangeAction}
            />
        );

        expect(screen.getByText('Additional Data')).toBeInTheDocument();
        expect(screen.getByText('{}')).toBeInTheDocument();
    });
}); 