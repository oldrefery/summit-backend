import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { usePushStatistics, useNotificationHistory, usePushUsers, useSendNotification } from '../use-push';
import { api } from '@/lib/supabase';
import { showErrorMock, toastContext } from '@/__mocks__/providers-mock';
import { TEST_DATA } from '@/__mocks__/test-constants';
import { Providers, queryClient } from '@/__mocks__/test-wrapper';

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

// Мокаем fetch API для тестов useSendNotification
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

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

    describe('useSendNotification hook', () => {
        const mockNotification = {
            title: 'Test Notification',
            body: 'Test message',
            target_type: 'all' as 'all' | 'specific_users',
            data: { action: 'open' } as Record<string, unknown>,
        };

        const successResponse = {
            successful: 2,
            failed: 0
        };

        beforeEach(() => {
            // Reset all mocks
            vi.clearAllMocks();
            // Mock fetch для всех тестов
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(successResponse),
            });
            // Мокаем метод invalidateQueries у queryClient
            queryClient.invalidateQueries = vi.fn();
        });

        it('sends notification successfully', async () => {
            const { result } = renderHook(() => useSendNotification(), { wrapper: Providers });

            result.current.mutate(mockNotification);

            // Проверяем, что fetch был вызван с правильными аргументами
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/push-notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mockNotification),
                });
            });

            // Проверяем, что успешный ответ обрабатывается правильно
            await waitFor(() => {
                expect(toastContext.showSuccess).toHaveBeenCalledWith(
                    `Notification sent successfully to ${successResponse.successful} devices. Failed: ${successResponse.failed}`
                );
            });

            // Проверяем, что данные были инвалидированы
            await waitFor(() => {
                expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
                    queryKey: ['push_notifications']
                });
                expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
                    queryKey: ['push_statistics']
                });
            });
        });

        it('handles error when sending notification', async () => {
            // Мокаем ошибку со стороны API
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Failed to send notification' }),
            });

            const { result } = renderHook(() => useSendNotification(), { wrapper: Providers });

            result.current.mutate(mockNotification);

            // Проверяем, что error callback вызван с правильной ошибкой
            await waitFor(() => {
                expect(showErrorMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: 'Failed to send notification'
                    })
                );
            });
        });

        it('handles network error when sending notification', async () => {
            // Мокаем ошибку сети
            const networkError = new Error('Network error');
            mockFetch.mockRejectedValueOnce(networkError);

            const { result } = renderHook(() => useSendNotification(), { wrapper: Providers });

            result.current.mutate({
                title: 'Test Notification',
                body: 'Network Test',
                target_type: 'all' as 'all' | 'specific_users',
                data: { screen: 'home' } as Record<string, unknown>,
            });

            // Проверяем, что error callback вызван с сетевой ошибкой
            await waitFor(() => {
                expect(showErrorMock).toHaveBeenCalledWith(networkError);
            });
        });

        it('sends notification to specific users', async () => {
            const { result } = renderHook(() => useSendNotification(), { wrapper: Providers });

            const targetedNotification = {
                title: 'Targeted Notification',
                body: 'For specific users',
                target_type: 'specific_users' as 'all' | 'specific_users',
                data: { screen: 'profile' } as Record<string, unknown>,
                target_users: ['user1', 'user2'],
            };

            result.current.mutate(targetedNotification);

            // Проверяем, что fetch был вызван с правильными данными для конкретных пользователей
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/push-notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(targetedNotification),
                });
            });
        });

        it('handles JSON parsing error', async () => {
            // Мокаем ошибку парсинга JSON
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.reject(new Error('Invalid JSON')),
            });

            const { result } = renderHook(() => useSendNotification(), { wrapper: Providers });

            result.current.mutate({
                title: 'JSON Error Test',
                body: 'Testing JSON error',
                target_type: 'all' as 'all' | 'specific_users',
                data: { action: 'test' } as Record<string, unknown>,
            });

            // Проверяем, что error callback вызван с ошибкой парсинга JSON
            await waitFor(() => {
                expect(showErrorMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: 'Invalid JSON'
                    })
                );
            });
        });
    });
}); 