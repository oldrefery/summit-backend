import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { usePushStatistics, useNotificationHistory, usePushUsers, useSendNotification } from '../use-push';
import { api } from '@/lib/supabase';
import { showErrorMock, toastContext } from '@/__mocks__/providers-mock';
import { TEST_DATA } from '@/__mocks__/test-constants';
import { Providers } from '@/__mocks__/test-wrapper';

// Мокаем API
vi.mock('@/lib/supabase', () => ({
    api: {
        push: {
            getStatistics: vi.fn(),
            getNotificationHistory: vi.fn(),
            getUsers: vi.fn(),
            sendNotification: vi.fn(),
        },
    },
}));

// Мокаем toast-provider
vi.mock('@/components/providers/toast-provider', () => ({
    useToastContext: () => toastContext,
}));

describe('Push Notification Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('usePushStatistics', () => {
        const mockStats = {
            active_tokens: TEST_DATA.PUSH_STATISTICS.ACTIVE_TOKENS,
            active_users: TEST_DATA.PUSH_STATISTICS.ACTIVE_USERS,
            total_users: TEST_DATA.PUSH_STATISTICS.TOTAL_USERS,
        };

        it('returns statistics data successfully', async () => {
            (api.push.getStatistics as jest.Mock).mockResolvedValue(mockStats);

            const { result } = renderHook(() => usePushStatistics(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.data).toEqual(mockStats);
                expect(result.current.isLoading).toBe(false);
                expect(result.current.isError).toBe(false);
            });

            expect(api.push.getStatistics).toHaveBeenCalledTimes(1);
        });

        it('handles error state', async () => {
            const error = new Error('Failed to fetch statistics');
            (api.push.getStatistics as jest.Mock).mockRejectedValue(error);

            const { result } = renderHook(() => usePushStatistics(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
                expect(result.current.error).toBe(error);
            });

            expect(showErrorMock).toHaveBeenCalledWith(error);
        });

        it('returns default values when data is undefined', async () => {
            (api.push.getStatistics as jest.Mock).mockResolvedValue(undefined);

            const { result } = renderHook(() => usePushStatistics(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.data).toEqual({
                    active_tokens: 0,
                    active_users: 0,
                    total_users: 0,
                });
            });
        });
    });

    describe('useNotificationHistory', () => {
        const mockNotifications = [
            {
                id: 1,
                title: 'Test Notification',
                body: 'Test Body',
                sent_at: TEST_DATA.DEFAULTS.DATETIME,
                status: 'delivered',
                target_users: ['user1', 'user2'],
            },
        ];

        it('returns notification history successfully', async () => {
            (api.push.getNotificationHistory as jest.Mock).mockResolvedValue(mockNotifications);

            const { result } = renderHook(() => useNotificationHistory(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.data).toEqual(mockNotifications);
                expect(result.current.isLoading).toBe(false);
                expect(result.current.isError).toBe(false);
            });

            expect(api.push.getNotificationHistory).toHaveBeenCalledTimes(1);
        });

        it('handles error state', async () => {
            const error = new Error('Failed to fetch history');
            (api.push.getNotificationHistory as jest.Mock).mockRejectedValue(error);

            const { result } = renderHook(() => useNotificationHistory(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
                expect(result.current.error).toBe(error);
            });

            expect(showErrorMock).toHaveBeenCalledWith(error);
        });

        it('returns empty array when data is undefined', async () => {
            (api.push.getNotificationHistory as jest.Mock).mockResolvedValue(undefined);

            const { result } = renderHook(() => useNotificationHistory(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.data).toEqual([]);
            });
        });
    });

    describe('usePushUsers', () => {
        const mockUsers = [
            {
                id: 1,
                token: 'test-token',
                platform: 'ios',
                created_at: TEST_DATA.DEFAULTS.DATETIME,
                last_active: TEST_DATA.DEFAULTS.DATETIME,
                device_info: {
                    deviceName: 'iPhone 12',
                    osName: 'iOS 15.0',
                },
            },
        ];

        it('returns push users successfully', async () => {
            (api.push.getUsers as jest.Mock).mockResolvedValue(mockUsers);

            const { result } = renderHook(() => usePushUsers(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.data).toEqual(mockUsers);
                expect(result.current.isLoading).toBe(false);
                expect(result.current.isError).toBe(false);
            });

            expect(api.push.getUsers).toHaveBeenCalledTimes(1);
        });

        it('handles error state', async () => {
            const error = new Error('Failed to fetch users');
            (api.push.getUsers as jest.Mock).mockRejectedValue(error);

            const { result } = renderHook(() => usePushUsers(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
                expect(result.current.error).toBe(error);
            });

            expect(showErrorMock).toHaveBeenCalledWith(error);
        });

        it('returns empty array when data is undefined', async () => {
            (api.push.getUsers as jest.Mock).mockResolvedValue(undefined);

            const { result } = renderHook(() => usePushUsers(), { wrapper: Providers });

            await waitFor(() => {
                expect(result.current.data).toEqual([]);
            });
        });
    });

    describe('useSendNotification', () => {
        const mockNotification = {
            title: 'Test Title',
            body: 'Test Body',
            target_type: 'all' as const,
            data: {
                action: 'open' as const,
            },
        };

        it('sends notification successfully', async () => {
            (api.push.sendNotification as jest.Mock).mockResolvedValue({ success: true });

            const { result } = renderHook(() => useSendNotification(), { wrapper: Providers });

            result.current.mutate(mockNotification);

            await waitFor(() => {
                expect(api.push.sendNotification).toHaveBeenCalledWith(mockNotification);
            });
        });

        it('handles error when sending notification', async () => {
            const error = new Error('Failed to send notification');
            (api.push.sendNotification as jest.Mock).mockRejectedValue(error);

            const { result } = renderHook(() => useSendNotification(), { wrapper: Providers });

            result.current.mutate(mockNotification);

            await waitFor(() => {
                expect(showErrorMock).toHaveBeenCalledWith(error);
            });
        });
    });
}); 