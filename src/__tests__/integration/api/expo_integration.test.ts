import { BaseApiTest } from './base-api-test';
import { ExpoApiMock } from '../mocks/expo-api-mock';
import { API } from '@/app/constants';
import { delay } from '@/utils/test-utils';
import { vi } from 'vitest';

/**
 * Type definition for notification structure used in tests
 */
interface TestNotification {
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

/**
 * Simplified version of Expo integration tests
 * These tests modify the global constants to use our mock server
 * and verify proper error handling and successful notification delivery
 */
class ExpoIntegrationTest extends BaseApiTest {
    private static expoApiMock: ExpoApiMock;
    private static originalExpoUrl: string;
    private static mockUrl: string;

    // Use direct fetch instead of relying on the library
    private static async sendDirectPushNotification(tokens: string[], notification: TestNotification) {
        const messages = tokens.map(token => ({
            to: token,
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
            sound: 'default',
            priority: 'high',
        }));

        try {
            console.log(`Sending request to ${API.EXPO.PUSH_URL}/--/api/v2/push/send`);

            const response = await fetch(`${API.EXPO.PUSH_URL}/--/api/v2/push/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });

            const result = await response.json();
            console.log('Direct Push Result:', JSON.stringify(result, null, 2));

            return result;
        } catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    }

    public static async runTests() {
        describe('Expo Push API Integration Tests', () => {
            beforeAll(async () => {
                await BaseApiTest.setupTestClient();

                // Setup mock Expo API server
                this.expoApiMock = new ExpoApiMock();
                this.mockUrl = await this.expoApiMock.start();
                console.log('Mock Expo API running at:', this.mockUrl);

                // Save original URL and replace with mock URL
                this.originalExpoUrl = API.EXPO.PUSH_URL;
                // @ts-expect-error: Overriding readonly property for testing
                API.EXPO.PUSH_URL = this.mockUrl;

                // Mock console methods for testing
                const originalConsole = {
                    error: console.error,
                    warn: console.warn,
                    log: console.log
                };

                console.error = vi.fn((...args) => {
                    originalConsole.error(...args);
                });
                console.warn = vi.fn((...args) => {
                    originalConsole.warn(...args);
                });
                console.log = vi.fn((...args) => {
                    originalConsole.log(...args);
                });
            });

            afterAll(async () => {
                // Stop mock server and restore original URL
                await this.expoApiMock.stop();
                // @ts-expect-error: Restoring readonly property
                API.EXPO.PUSH_URL = this.originalExpoUrl;

                await this.cleanup();
            });

            afterEach(() => {
                // Clear console mocks between tests
                vi.clearAllMocks();
            });

            describe('Direct API Communication', () => {
                it('should communicate with mock Expo API server', async () => {
                    // Set success mode
                    this.expoApiMock.setResponseMode('success');

                    // Send a direct request
                    const result = await this.sendDirectPushNotification(
                        ['ExponentPushToken[test-token]'],
                        {
                            title: 'Test',
                            body: 'Direct test message'
                        }
                    );

                    // Verify the response format
                    expect(result).toBeDefined();
                    expect(result.data).toBeDefined();
                    expect(Array.isArray(result.data)).toBe(true);
                    expect(result.data.length).toBeGreaterThan(0);

                    const ticket = result.data[0];
                    expect(ticket.status).toBe('ok');
                    expect(ticket.id).toBeDefined();
                });

                it('should handle device not registered error', async () => {
                    // Set device not registered mode
                    this.expoApiMock.setResponseMode('deviceNotRegistered');

                    // Send a direct request
                    const result = await this.sendDirectPushNotification(
                        ['ExponentPushToken[test-token]'],
                        {
                            title: 'Test',
                            body: 'Test message for unregistered device'
                        }
                    );

                    // Verify the response format
                    expect(result).toBeDefined();
                    expect(result.data).toBeDefined();
                    expect(result.data.length).toBeGreaterThan(0);

                    const ticket = result.data[0];
                    expect(ticket.status).toBe('error');
                    expect(ticket.details).toBeDefined();
                    expect(ticket.details.error).toBe('DeviceNotRegistered');
                });

                it('should handle mixed response types', async () => {
                    // Set mixed mode
                    this.expoApiMock.setResponseMode('mixed');

                    // Send a direct request with multiple tokens
                    const result = await this.sendDirectPushNotification(
                        [
                            'ExponentPushToken[test-token-1]',
                            'ExponentPushToken[test-token-2]',
                        ],
                        {
                            title: 'Test Mixed',
                            body: 'Test message for mixed response'
                        }
                    );

                    // Verify the response format
                    expect(result).toBeDefined();
                    expect(result.data).toBeDefined();
                    expect(result.data.length).toBe(2);

                    // First should be success, second should be error
                    expect(result.data[0].status).toBe('ok');
                    expect(result.data[1].status).toBe('error');
                });
            });

            describe('RPC Integration', () => {
                it('should send notification through RPC and record history', async () => {
                    // Set success mode
                    this.expoApiMock.setResponseMode('success');

                    // Create a test notification using RPC
                    const { data: historyId, error } = await this.getAuthenticatedClient().rpc(
                        'send_push_notification',
                        {
                            p_title: 'Test RPC Notification',
                            p_body: 'This is a test notification sent via RPC',
                            p_target_type: 'all',
                            p_target_users: [],
                            p_data: { type: 'test', action: 'open' }
                        }
                    );

                    // Verify RPC call succeeded
                    expect(error).toBeNull();
                    expect(historyId).toBeDefined();

                    // Wait for async processes
                    await delay(1000);

                    // Check notification history
                    const { data: historyRecord } = await this.getAuthenticatedClient()
                        .from('notification_history')
                        .select('*')
                        .eq('id', historyId)
                        .single();

                    expect(historyRecord).toBeDefined();
                    expect(historyRecord?.title).toBe('Test RPC Notification');
                });
            });
        });
    }
}

// Run the tests
ExpoIntegrationTest.runTests(); 