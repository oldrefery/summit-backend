import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { supabase } from '@/lib/supabase-server';
import { POST } from '../route';

// Определяем типы для уведомлений
const TARGET_TYPE = {
    ALL: 'all',
    SPECIFIC_USERS: 'specific_users'
} as const;

type TargetType = (typeof TARGET_TYPE)[keyof typeof TARGET_TYPE];

// Мокируем непосредственно необходимые зависимости
vi.mock('@/lib/supabase-server', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
            }),
        },
    },
    ensureAuthenticated: vi.fn().mockResolvedValue(true),
}));

// Мокируем Expo SDK
vi.mock('expo-server-sdk', () => {
    return {
        Expo: vi.fn(() => ({
            chunkPushNotifications: vi.fn((messages) => [messages]),
            sendPushNotificationsAsync: vi.fn().mockResolvedValue([
                { status: 'ok', id: 'receipt-id-1' },
                { status: 'ok', id: 'receipt-id-2' },
            ]),
        })),
    };
});

// Сохраняем оригинальные консольные методы
const originalConsole = { ...console };

// Функция для создания мок-запроса
function createMockRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/push-notifications', {
        method: 'POST',
        body: typeof body === 'string' ? body : JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    });
}

// Функция для создания тестового уведомления
function createMockNotification(targetType: TargetType = TARGET_TYPE.ALL) {
    return {
        title: 'Test Notification',
        body: 'This is a test notification',
        target_type: targetType,
        data: { action: 'open' as const },
        ...(targetType === TARGET_TYPE.SPECIFIC_USERS ? { target_users: ['user1', 'user2'] } : {}),
    };
}

describe('Push Notifications API', () => {
    beforeEach(() => {
        // Мокаем консольные методы
        console.warn = vi.fn();
        console.error = vi.fn();
        console.log = vi.fn();

        vi.clearAllMocks();

        // Добавляем статический метод к Expo
        // @ts-expect-error - игнорируем типы для теста
        Expo.isExpoPushToken = vi.fn((token) =>
            typeof token === 'string' && token.startsWith('ExponentPushToken')
        );

        // Настраиваем мок supabase по умолчанию для всех токенов
        const mockSelectData = {
            select: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            data: [
                { push_token: 'ExponentPushToken[valid-token-1]' },
                { push_token: 'ExponentPushToken[valid-token-2]' },
            ],
        };

        // @ts-expect-error - игнорируем типы для теста
        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'app_user_settings') {
                return {
                    ...mockSelectData,
                    update: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnValue({ error: null }),
                };
            }
            if (table === 'notification_history') {
                return {
                    insert: vi.fn().mockReturnValue({ error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                data: [],
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnValue({ error: null }),
                insert: vi.fn().mockReturnValue({ error: null }),
            };
        });
    });

    afterEach(() => {
        // Восстанавливаем консольные методы
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.log = originalConsole.log;
    });

    it('should send notifications to all users successfully', async () => {
        const request = createMockRequest(createMockNotification());

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ successful: 2, failed: 0 });

        expect(supabase.from).toHaveBeenCalledWith('app_user_settings');
        expect(supabase.from).toHaveBeenCalledWith('notification_history');
    });

    it('should send notifications to specific users', async () => {
        const request = createMockRequest(
            createMockNotification(TARGET_TYPE.SPECIFIC_USERS)
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ successful: 2, failed: 0 });
    });

    it('should handle case with no valid tokens', async () => {
        // Меняем мок на пустой массив токенов
        // @ts-expect-error - игнорируем типы для теста
        vi.mocked(supabase.from).mockImplementationOnce((table: string) => {
            if (table === 'app_user_settings') {
                return {
                    select: vi.fn().mockReturnThis(),
                    not: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    data: [], // Пустой массив токенов
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                data: [],
            };
        });

        const request = createMockRequest(createMockNotification());

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'No valid push tokens found' });
    });

    it('should filter out invalid tokens', async () => {
        // Добавляем невалидный токен
        // @ts-expect-error - игнорируем типы для теста
        vi.mocked(supabase.from).mockImplementationOnce((table: string) => {
            if (table === 'app_user_settings') {
                return {
                    select: vi.fn().mockReturnThis(),
                    not: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    data: [
                        { push_token: 'ExponentPushToken[valid-token-1]' },
                        { push_token: 'invalid-token' }, // Будет отфильтрован
                    ],
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                data: [],
            };
        });

        const request = createMockRequest(createMockNotification());

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        // Только 1 токен прошел фильтрацию
        expect(data).toEqual({ successful: 1, failed: 0 });

        // Проверяем, что предупреждение было выведено
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('is not a valid Expo push token')
        );
    });

    it('should handle error when sending notification chunks', async () => {
        // Подготавливаем экземпляр Expo для ошибки
        const expoMock = new Expo();
        // Мокируем метод экземпляра Expo с ошибкой
        vi.spyOn(expoMock, 'sendPushNotificationsAsync').mockRejectedValueOnce(
            new Error('Failed to send push notifications')
        );

        const request = createMockRequest(createMockNotification());

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ successful: 0, failed: 0 });

        // Ошибка должна быть залогирована
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error sending push notification chunk:'),
            expect.any(Error)
        );
    });

    it('should handle DeviceNotRegistered errors', async () => {
        // Подготавливаем экземпляр Expo для ошибки DeviceNotRegistered
        const expoMock = new Expo();
        // Мокируем метод экземпляра Expo с ответом о незарегистрированном устройстве
        vi.spyOn(expoMock, 'sendPushNotificationsAsync').mockResolvedValueOnce([
            {
                status: 'error',
                message: 'DeviceNotRegistered',
                details: { error: 'DeviceNotRegistered' },
            },
        ]);

        const request = createMockRequest(createMockNotification());

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ successful: 0, failed: 1 });

        // Проверка вызова апдейта токена
        expect(supabase.from).toHaveBeenCalledWith('app_user_settings');
        expect(console.error).toHaveBeenCalledWith(
            'Push notification error:',
            expect.objectContaining({ error: 'DeviceNotRegistered' })
        );
    });

    it('should handle general API error', async () => {
        const request = createMockRequest('invalid-json'); // Невалидный JSON

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: 'Failed to send push notifications' });

        // Ошибка должна быть залогирована
        expect(console.error).toHaveBeenCalledWith(
            'Error sending push notifications:',
            expect.any(Error)
        );
    });

    it('should save notification history successfully', async () => {
        const request = createMockRequest(createMockNotification());

        const response = await POST(request);
        await response.json();

        expect(supabase.auth.getUser).toHaveBeenCalled();
        expect(supabase.from).toHaveBeenCalledWith('notification_history');
    });

    it('should handle error when saving notification history', async () => {
        // Имитируем ошибку при вставке в notification_history
        // @ts-expect-error - игнорируем типы для теста
        vi.mocked(supabase.from).mockImplementationOnce((table: string) => {
            if (table === 'notification_history') {
                return {
                    insert: vi.fn().mockReturnValue({
                        error: new Error('Database error'),
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                not: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                data: [
                    { push_token: 'ExponentPushToken[valid-token-1]' },
                    { push_token: 'ExponentPushToken[valid-token-2]' },
                ],
            };
        });

        const request = createMockRequest(createMockNotification());

        const response = await POST(request);
        await response.json();

        // Ошибка должна быть залогирована
        expect(console.error).toHaveBeenCalledWith(
            'Error saving notification history:',
            expect.any(Error)
        );
    });

    it('should handle error when updating invalid token', async () => {
        // Имитируем ошибку при обновлении токена
        // @ts-expect-error - игнорируем типы для теста
        vi.mocked(supabase.from).mockImplementationOnce((table: string) => {
            if (table === 'app_user_settings') {
                return {
                    select: vi.fn().mockReturnThis(),
                    not: vi.fn().mockReturnThis(),
                    in: vi.fn().mockReturnThis(),
                    data: [
                        { push_token: 'ExponentPushToken[valid-token-1]' },
                    ],
                    update: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnValue({
                        error: new Error('Database error'),
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                data: [],
            };
        });

        // Подготавливаем экземпляр Expo для ошибки DeviceNotRegistered
        const expoMock = new Expo();
        // Мокируем метод экземпляра Expo с ответом о незарегистрированном устройстве
        vi.spyOn(expoMock, 'sendPushNotificationsAsync').mockResolvedValueOnce([
            {
                status: 'error',
                message: 'DeviceNotRegistered',
                details: { error: 'DeviceNotRegistered' },
            },
        ]);

        const request = createMockRequest(createMockNotification());

        const response = await POST(request);
        await response.json();

        // Ошибка должна быть залогирована
        expect(console.error).toHaveBeenCalledWith(
            'Error updating invalid token:',
            expect.any(Error)
        );
    });
}); 