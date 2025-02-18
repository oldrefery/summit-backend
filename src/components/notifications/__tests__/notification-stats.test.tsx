import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationStats } from '../notification-stats';
import { usePushStatistics } from '@/hooks/use-push';

// Mock the hooks
vi.mock('@/hooks/use-push', () => ({
    usePushStatistics: vi.fn(),
}));

describe('NotificationStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state', () => {
        (usePushStatistics as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        render(<NotificationStats />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('h-28');
    });

    it('renders statistics correctly', () => {
        const mockStats = {
            total_users: 100,
            active_users: 50,
            active_tokens: 75,
        };

        (usePushStatistics as jest.Mock).mockReturnValue({
            data: mockStats,
            isLoading: false,
        });

        render(<NotificationStats />);

        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Total Users')).toBeInTheDocument();

        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();

        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('Active Tokens')).toBeInTheDocument();
    });

    it('handles undefined data', () => {
        (usePushStatistics as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: false,
        });

        render(<NotificationStats />);

        // Проверяем, что отображаются нулевые значения
        const zeros = screen.getAllByText('0');
        expect(zeros).toHaveLength(3);

        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Active Tokens')).toBeInTheDocument();
    });

    it('handles partial data', () => {
        const mockStats = {
            total_users: 100,
            // active_users и active_tokens отсутствуют
        };

        (usePushStatistics as jest.Mock).mockReturnValue({
            data: mockStats,
            isLoading: false,
        });

        render(<NotificationStats />);

        expect(screen.getByText('100')).toBeInTheDocument();

        // Проверяем, что для отсутствующих данных отображаются нули
        const zeros = screen.getAllByText('0');
        expect(zeros).toHaveLength(2);
    });
}); 