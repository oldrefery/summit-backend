import { BaseApiTest } from './base-api-test';

class PushNotificationsApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Push Notifications API Tests', () => {
            beforeAll(async () => {
                await BaseApiTest.setupTestClient();
            });

            describe('Sending Notifications', () => {
                it('should send notification to specific device', async () => {
                    await this.createTestAppUserSettings();

                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('send_push_notification', {
                            p_title: 'Test Notification',
                            p_body: 'Test notification body',
                            p_target_type: 'specific_users',
                            p_target_users: [this.getTestUserId()],
                            p_data: { test: 'data' }
                        });

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(typeof data).toBe('number');
                    expect(data).toBeGreaterThan(0);

                    // Проверяем запись в истории
                    const { data: historyData } = await this.getAuthenticatedClient()
                        .from('notification_history')
                        .select('*')
                        .eq('id', data)
                        .single();

                    expect(historyData).toBeDefined();
                    expect(historyData?.title).toBe('Test Notification');
                    expect(historyData?.target_type).toBe('specific_users');
                });

                it('should send notification to multiple devices', async () => {
                    await this.createTestAppUserSettings();
                    await this.createTestAppUserSettings();

                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('send_push_notification', {
                            p_title: 'Test Notification',
                            p_body: 'Test notification body',
                            p_target_type: 'specific_users',
                            p_target_users: [this.getTestUserId()],
                            p_data: { test: 'data' }
                        });

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(typeof data).toBe('number');
                    expect(data).toBeGreaterThan(0);

                    // Проверяем запись в истории
                    const { data: historyData } = await this.getAuthenticatedClient()
                        .from('notification_history')
                        .select('*')
                        .eq('id', data)
                        .single();

                    expect(historyData).toBeDefined();
                    expect(historyData?.target_type).toBe('specific_users');
                });

                it('should send notification to all devices', async () => {
                    await this.createTestAppUserSettings();

                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('send_push_notification', {
                            p_title: 'Test Notification',
                            p_body: 'Test notification body',
                            p_target_type: 'all',
                            p_target_users: [],
                            p_data: { test: 'data' }
                        });

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(typeof data).toBe('number');
                    expect(data).toBeGreaterThan(0);

                    // Проверяем запись в истории
                    const { data: historyData } = await this.getAuthenticatedClient()
                        .from('notification_history')
                        .select('*')
                        .eq('id', data)
                        .single();

                    expect(historyData).toBeDefined();
                    expect(historyData?.target_type).toBe('all');
                });
            });

            describe('Notification History', () => {
                it('should record notification in history', async () => {
                    const device = await this.createTestAppUserSettings();

                    // Отправляем уведомление
                    await this.getAuthenticatedClient().rpc(
                        'send_push_notification',
                        {
                            p_title: 'Test Notification',
                            p_body: 'Test message',
                            p_data: { type: 'test' },
                            p_target_type: 'specific_users',
                            p_target_users: [device.device_id]
                        }
                    );

                    // Проверяем запись в истории
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('notification_history')
                        .select('*')
                        .order('sent_at', { ascending: false })
                        .limit(1)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.title).toBe('Test Notification');
                    expect(data.body).toBe('Test message');
                    expect(data.target_type).toBe('specific_users');
                    expect(data.target_users).toContain(device.device_id);
                });
            });

            describe('Statistics', () => {
                it('should get push notification statistics', async () => {
                    const { data, error } = await this.getAuthenticatedClient().rpc(
                        'get_push_statistics'
                    );

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data[0]).toHaveProperty('total_users');
                    expect(data[0]).toHaveProperty('active_users');
                    expect(data[0]).toHaveProperty('total_tokens');
                    expect(data[0]).toHaveProperty('active_tokens');

                    // Проверяем типы данных
                    expect(typeof data[0].total_users).toBe('number');
                    expect(typeof data[0].active_users).toBe('number');
                    expect(typeof data[0].total_tokens).toBe('number');
                    expect(typeof data[0].active_tokens).toBe('number');
                });
            });

            describe('Validation', () => {
                it('should validate notification title and body', async () => {
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient().rpc(
                            'send_push_notification',
                            {
                                p_title: '', // пустой заголовок
                                p_body: 'Test message',
                                p_data: {},
                                p_target_type: 'all',
                                p_target_users: []
                            }
                        )
                    );

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient().rpc(
                            'send_push_notification',
                            {
                                p_title: 'Test',
                                p_body: '', // пустое сообщение
                                p_data: {},
                                p_target_type: 'all',
                                p_target_users: []
                            }
                        )
                    );
                });

                it('should validate target type', async () => {
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient().rpc(
                            'send_push_notification',
                            {
                                p_title: 'Test',
                                p_body: 'Test message',
                                p_data: {},
                                p_target_type: 'invalid', // неверный тип
                                p_target_users: []
                            }
                        )
                    );
                });

                it('should validate target devices for specific devices', async () => {
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient().rpc(
                            'send_push_notification',
                            {
                                p_title: 'Test',
                                p_body: 'Test message',
                                p_data: {},
                                p_target_type: 'specific_users',
                                p_target_devices: [] // пустой список устройств
                            }
                        )
                    );
                });
            });

            describe('Anonymous Access', () => {
                it('should not allow anonymous to send notifications', async () => {
                    await this.expectSupabaseError(
                        this.getAnonymousClient().rpc(
                            'send_push_notification',
                            {
                                p_title: 'Test',
                                p_body: 'Test message',
                                p_data: {},
                                p_target_type: 'all',
                                p_target_devices: []
                            }
                        ),
                        401
                    );
                });

                it('should not allow anonymous to view notification history', async () => {
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('notification_history')
                            .select('*'),
                        401
                    );
                });

                it('should not allow anonymous to view statistics', async () => {
                    await this.expectSupabaseError(
                        this.getAnonymousClient().rpc('get_push_statistics'),
                        401
                    );
                });
            });
        });
    }
}

// Run the tests
PushNotificationsApiTest.runTests(); 