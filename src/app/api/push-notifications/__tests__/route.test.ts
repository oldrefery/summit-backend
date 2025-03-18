import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { Expo } from 'expo-server-sdk';
import { supabase, ensureAuthenticated } from '@/lib/supabase-server';
import type { NotificationFormData } from '@/types/push';
import type { Mock } from 'vitest';

// Мокаем модули
vi.mock('expo-server-sdk', () => {
    const mockExpo = {
        chunkPushNotifications: vi.fn(messages => [messages]),
        sendPushNotificationsAsync: vi.fn().mockResolvedValue([
            { status: 'ok', id: 'receipt-id-1' },
            { status: 'ok', id: 'receipt-id-2' },
        ]),
    };

    return {
        Expo: vi.fn(() => mockExpo),
        ExpoPushMessage: vi.fn(),
        ExpoPushTicket: {
            ERROR: 'error',
            OK: 'ok'
        },
        ExpoPushErrorReceipt: {
            DeviceNotRegistered: 'DeviceNotRegistered'
        },
        ExpoPushReceipt: vi.fn(),
    };
});

// Добавляем статический метод после мока
vi.stubGlobal('Expo', {
    isExpoPushToken: vi.fn((token) =>
        typeof token === 'string' && token.startsWith('ExponentPushToken')
    )
});

// Используем any для мокинга сложных типов Supabase
// @ts-ignore - игнорируем ошибки типов для Supabase мока
vi.mock('@/lib/supabase-server', () => ({
    supabase: {
        // @ts-ignore - сложная типизация PostgrestQueryBuilder
        from: vi.fn((table: string): any => {
            // Мокаем app_user_settings table
            if (table === 'app_user_settings') {
                return {
                    select: vi.fn().mockReturnValue({
                        not: vi.fn().mockReturnValue({
                            data: [
                                { push_token: 'ExponentPushToken[valid-token-1]' },
                                { push_token: 'ExponentPushToken[valid-token-2]' },
                            ],
                        }),
                        in: vi.fn().mockReturnValue({
                            not: vi.fn().mockReturnValue({
                                data: [
                                    { push_token: 'ExponentPushToken[valid-token-1]' },
                                ],
                            }),
                        }),
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            error: null,
                        }),
                    }),
                };
            }

            // Мокаем notification_history table
            if (table === 'notification_history') {
                return {
                    insert: vi.fn().mockReturnValue({
                        error: null,
                    }),
                };
            }

            // Default для других таблиц
            return {
                select: vi.fn().mockReturnValue({
                    data: [],
                }),
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        error: null,
                    }),
                }),
                insert: vi.fn().mockReturnValue({
                    error: null,
                }),
            };
        }),
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
            }),
        },
    },
    ensureAuthenticated: vi.fn(),
}));

// Сохраняем оригинальные консольные методы
const originalConsole = { ...console };

beforeEach(() => {
    // Мокаем консольные методы для каждого теста
    console.warn = vi.fn();
    console.error = vi.fn();
    console.log = vi.fn();
    vi.clearAllMocks();
});

afterEach(() => {
    // Восстанавливаем консольные методы после каждого теста
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
});

// Создаем объект для тестового уведомления
const createMockNotification = (targetType: 'all' | 'specific_users' = 'all') => ({
    title: 'Test Notification',
    body: 'This is a test notification',
    target_type: targetType,
    data: { action: 'open' },
    ...(targetType === 'specific_users' ? { target_users: ['user1', 'user2'] } : {}),
});

describe('Push Notifications API', () => {
    describe('POST method', () => {
        it('should send notifications to all users successfully', async () => {
            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({ successful: 2, failed: 0 });
            expect(ensureAuthenticated).toHaveBeenCalledTimes(1);
            expect(supabase.from).toHaveBeenCalledWith('app_user_settings');
            expect(supabase.from).toHaveBeenCalledWith('notification_history');
        });

        it('should send notifications to specific users successfully', async () => {
            const mockNotification = createMockNotification('specific_users' as const);
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({ successful: 2, failed: 0 });
        });

        it('should handle case with no valid tokens', async () => {
            // Меняем реализацию для этого теста
            const originalMock = supabase.from;
            supabase.from = vi.fn((table) => {
                if (table === 'app_user_settings') {
                    return {
                        select: vi.fn().mockReturnValue({
                            not: vi.fn().mockReturnValue({
                                data: [], // Пустой массив токенов
                            }),
                        }),
                    };
                }
                return originalMock(table);
            });

            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data).toEqual({ error: 'No valid push tokens found' });

            // Восстанавливаем оригинальный мок
            supabase.from = originalMock;
        });

        it('should filter out invalid tokens', async () => {
            // Меняем реализацию для этого теста
            const originalMock = supabase.from;
            supabase.from = vi.fn((table) => {
                if (table === 'app_user_settings') {
                    return {
                        select: vi.fn().mockReturnValue({
                            not: vi.fn().mockReturnValue({
                                data: [
                                    { push_token: 'ExponentPushToken[valid-token-1]' },
                                    { push_token: 'invalid-token' }, // Будет отфильтрован
                                ],
                            }),
                        }),
                    };
                }
                return originalMock(table);
            });

            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({ successful: 1, failed: 0 });
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('is not a valid Expo push token')
            );

            // Восстанавливаем оригинальный мок
            supabase.from = originalMock;
        });

        it('should handle error when sending notification chunks', async () => {
            // Меняем реализацию sendPushNotificationsAsync для этого теста
            const mock = new Expo();
            const originalSendMethod = mock.sendPushNotificationsAsync;
            mock.sendPushNotificationsAsync = vi.fn().mockRejectedValueOnce(
                new Error('Failed to send push notifications')
            );

            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({ successful: 0, failed: 0 });
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Error sending push notification chunk:'),
                expect.any(Error)
            );

            // Восстанавливаем оригинальный метод
            mock.sendPushNotificationsAsync = originalSendMethod;
        });

        it('should handle DeviceNotRegistered errors', async () => {
            // Меняем реализацию sendPushNotificationsAsync для этого теста
            const mock = new Expo();
            const originalSendMethod = mock.sendPushNotificationsAsync;
            mock.sendPushNotificationsAsync = vi.fn().mockResolvedValueOnce([
                {
                    status: 'error',
                    message: 'DeviceNotRegistered',
                    details: { error: 'DeviceNotRegistered' }
                }
            ]);

            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({ successful: 0, failed: 1 });
            expect(supabase.from).toHaveBeenCalledWith('app_user_settings');
            expect(console.error).toHaveBeenCalledWith(
                'Push notification error:',
                expect.objectContaining({ error: 'DeviceNotRegistered' })
            );

            // Восстанавливаем оригинальный метод
            mock.sendPushNotificationsAsync = originalSendMethod;
        });

        it('should handle general API error', async () => {
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: 'invalid-json', // Невалидный JSON
                headers: { 'content-type': 'application/json' },
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data).toEqual({ error: 'Failed to send push notifications' });
            expect(console.error).toHaveBeenCalledWith(
                'Error sending push notifications:',
                expect.any(Error)
            );
        });
    });

    describe('saveNotificationHistory function', () => {
        it('should save notification history successfully', async () => {
            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            await POST(request);

            expect(ensureAuthenticated).toHaveBeenCalledTimes(1);
            expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
            expect(supabase.from).toHaveBeenCalledWith('notification_history');
        });

        it('should handle error when saving notification history', async () => {
            // Меняем реализацию для этого теста
            const originalMock = supabase.from;
            supabase.from = vi.fn((table) => {
                if (table === 'notification_history') {
                    return {
                        insert: vi.fn().mockReturnValue({
                            error: new Error('Database error'),
                        }),
                    };
                }
                return originalMock(table);
            });

            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            await POST(request);

            expect(console.error).toHaveBeenCalledWith(
                'Error saving notification history:',
                expect.any(Error)
            );

            // Восстанавливаем оригинальный мок
            supabase.from = originalMock;
        });
    });

    describe('handleInvalidToken function', () => {
        it('should update invalid token to null', async () => {
            // Меняем реализацию sendPushNotificationsAsync для этого теста
            const mock = new Expo();
            const originalSendMethod = mock.sendPushNotificationsAsync;
            mock.sendPushNotificationsAsync = vi.fn().mockResolvedValueOnce([
                {
                    status: 'error',
                    message: 'DeviceNotRegistered',
                    details: { error: 'DeviceNotRegistered' }
                }
            ]);

            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            await POST(request);

            expect(supabase.from).toHaveBeenCalledWith('app_user_settings');

            // Восстанавливаем оригинальный метод
            mock.sendPushNotificationsAsync = originalSendMethod;
        });

        it('should handle error when updating invalid token', async () => {
            // Меняем реализацию для этого теста
            const originalMock = supabase.from;
            supabase.from = vi.fn((table) => {
                if (table === 'app_user_settings') {
                    return {
                        update: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                error: new Error('Database error'),
                            }),
                        }),
                        select: vi.fn().mockReturnValue({
                            not: vi.fn().mockReturnValue({
                                data: [
                                    { push_token: 'ExponentPushToken[valid-token-1]' },
                                    { push_token: 'ExponentPushToken[valid-token-2]' },
                                ],
                            }),
                        }),
                    };
                }
                return originalMock(table);
            });

            // Меняем реализацию sendPushNotificationsAsync для этого теста
            const mock = new Expo();
            const originalSendMethod = mock.sendPushNotificationsAsync;
            mock.sendPushNotificationsAsync = vi.fn().mockResolvedValueOnce([
                {
                    status: 'error',
                    message: 'DeviceNotRegistered',
                    details: { error: 'DeviceNotRegistered' }
                }
            ]);

            const mockNotification = createMockNotification();
            const request = new NextRequest('http://localhost/api/push-notifications', {
                method: 'POST',
                body: JSON.stringify(mockNotification),
                headers: { 'content-type': 'application/json' },
            });

            await POST(request);

            expect(console.error).toHaveBeenCalledWith(
                'Error updating invalid token:',
                expect.any(Error)
            );

            // Восстанавливаем оригинальные моки
            supabase.from = originalMock;
            mock.sendPushNotificationsAsync = originalSendMethod;
        });
    });
}); 