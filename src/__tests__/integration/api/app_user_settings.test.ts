import { describe, it, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { AppUserSettings } from '@/types';

class AppUserSettingsApiTest extends BaseApiTest {
    public static async runTests() {
        describe('App User Settings API Tests', () => {
            describe('CRUD Operations', () => {
                let testSettings: AppUserSettings;

                it('should create settings with all fields', async () => {
                    const settingsData = this.generateAppUserSettingsData();
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([settingsData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testSettings = data;
                    if (data) this.trackTestRecord('app_user_settings', data.id);

                    // Validate all fields
                    expect(data.device_id).toBe(settingsData.device_id);
                    expect(data.device_info).toEqual(settingsData.device_info);
                    expect(data.push_token).toBe(settingsData.push_token);
                    expect(data.settings).toEqual(settingsData.settings);

                    // Validate timestamps and id
                    this.validateTimestamps(data);
                    this.validateIds(data);
                });

                it('should read settings by id', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .select()
                        .eq('id', testSettings.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.id).toBe(testSettings.id);
                });

                it('should update settings', async () => {
                    const updateData = {
                        push_token: `updated-token-${Date.now()}`,
                        settings: {
                            social_feed: false,
                            announcements: false
                        }
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .update(updateData)
                        .eq('id', testSettings.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.push_token).toBe(updateData.push_token);
                    expect(data.settings).toEqual(updateData.settings);
                    expect(data.id).toBe(testSettings.id);
                });

                it('should delete settings', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .delete()
                        .eq('id', testSettings.id);

                    expect(error).toBeNull();

                    // Verify deletion
                    const { data, error: readError } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .select()
                        .eq('id', testSettings.id)
                        .single();

                    expect(data).toBeNull();
                    expect(readError).toBeDefined();
                });
            });

            describe('Validation', () => {
                it('should require device_id field', async () => {
                    const settingsData = this.generateAppUserSettingsData();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { device_id: _deviceId, ...dataWithoutDeviceId } = settingsData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('app_user_settings')
                            .insert([dataWithoutDeviceId])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should not create settings with duplicate device_id', async () => {
                    const settingsData = this.generateAppUserSettingsData();
                    const deviceId = `test-device-${Date.now()}`;
                    settingsData.device_id = deviceId;

                    // Создаем первые настройки
                    const { data: settings1, error: error1 } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([settingsData])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(settings1).toBeDefined();
                    if (settings1) this.trackTestRecord('app_user_settings', settings1.id);

                    // Пытаемся создать вторые настройки с тем же device_id
                    const settings2Data = this.generateAppUserSettingsData();
                    settings2Data.device_id = deviceId;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('app_user_settings')
                            .insert([settings2Data])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should not allow updating settings to use existing device_id', async () => {
                    // Создаем две записи с разными device_id
                    const timestamp1 = Date.now();
                    const timestamp2 = timestamp1 + 1;

                    const settings1Data = {
                        ...this.generateAppUserSettingsData(),
                        device_id: `test-device-${timestamp1}`
                    };
                    const settings2Data = {
                        ...this.generateAppUserSettingsData(),
                        device_id: `test-device-${timestamp2}`
                    };

                    // Создаем первые настройки
                    const { data: settings1 } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([settings1Data])
                        .select()
                        .single();

                    expect(settings1).toBeDefined();
                    if (settings1) this.trackTestRecord('app_user_settings', settings1.id);

                    // Создаем вторые настройки
                    const { data: settings2 } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([settings2Data])
                        .select()
                        .single();

                    expect(settings2).toBeDefined();
                    if (settings2) this.trackTestRecord('app_user_settings', settings2.id);

                    // Пытаемся обновить вторые настройки, установив device_id первых настроек
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('app_user_settings')
                            .update({ device_id: settings1Data.device_id })
                            .eq('id', settings2.id)
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate device_info format', async () => {
                    const settingsData = this.generateAppUserSettingsData();
                    const invalidData = {
                        ...settingsData,
                        device_info: 'invalid-json' // должен быть объектом
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('app_user_settings')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate settings format', async () => {
                    const settingsData = this.generateAppUserSettingsData();
                    const invalidData = {
                        ...settingsData,
                        settings: 'invalid-json' // должен быть объектом
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('app_user_settings')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should enforce unique device_id constraint', async () => {
                    // Создаем первые настройки
                    const settingsData = this.generateAppUserSettingsData();
                    const { data: firstSettings, error: firstError } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([settingsData])
                        .select()
                        .single();

                    expect(firstError).toBeNull();
                    expect(firstSettings).toBeDefined();
                    if (firstSettings) this.trackTestRecord('app_user_settings', firstSettings.id);

                    // Пытаемся создать настройки с тем же device_id
                    const duplicateData = this.generateAppUserSettingsData();
                    duplicateData.device_id = settingsData.device_id;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('app_user_settings')
                            .insert([duplicateData])
                    );
                });
            });

            describe('Anonymous Access', () => {
                it('should allow anonymous read', async () => {
                    const { error } = await this.getAnonymousClient()
                        .from('app_user_settings')
                        .select();

                    expect(error).toBeNull();
                });

                it('should allow anonymous create', async () => {
                    const settingsData = this.generateAppUserSettingsData();
                    const { data, error } = await this.getAnonymousClient()
                        .from('app_user_settings')
                        .insert([settingsData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    if (data) this.trackTestRecord('app_user_settings', data.id);
                });

                it('should allow anonymous update', async () => {
                    const settings = await this.createTestAppUserSettings();
                    const { error } = await this.getAnonymousClient()
                        .from('app_user_settings')
                        .update({ push_token: `updated-token-${Date.now()}` })
                        .eq('id', settings.id);

                    expect(error).toBeNull();
                });

                it('should allow anonymous delete', async () => {
                    const settings = await this.createTestAppUserSettings();
                    const { error } = await this.getAnonymousClient()
                        .from('app_user_settings')
                        .delete()
                        .eq('id', settings.id);

                    expect(error).toBeNull();
                });
            });

            describe('Edge Cases', () => {
                it('should handle very long device_id', async () => {
                    // Очищаем все предыдущие тестовые данные
                    await this.cleanup();

                    const timestamp = Date.now();
                    const longDeviceId = `test-device-${timestamp}-${'a'.repeat(200)}`;
                    const settingsData = this.generateAppUserSettingsData();
                    settingsData.device_id = longDeviceId;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([settingsData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.device_id).toBe(longDeviceId);
                    if (data) this.trackTestRecord('app_user_settings', data.id);
                });

                it('should handle complex JSON in device_info and settings', async () => {
                    const complexData = this.generateAppUserSettingsData();
                    complexData.device_info = {
                        deviceName: 'iPhone 14 Pro Max',
                        osName: 'iOS',
                        osVersion: '16.0',
                        deviceModel: 'iPhone14,3',
                        appVersion: '1.0.0',
                        buildNumber: '2023.1'
                    };
                    complexData.settings = {
                        social_feed: true,
                        announcements: true
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([complexData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.device_info).toEqual(complexData.device_info);
                    expect(data.settings).toEqual(complexData.settings);
                    if (data) this.trackTestRecord('app_user_settings', data.id);
                });

                it('should handle minimal required fields', async () => {
                    const minimalData = this.generateAppUserSettingsData();
                    delete minimalData.push_token;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([minimalData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.push_token).toBeNull();
                    if (data) this.trackTestRecord('app_user_settings', data.id);
                });
            });

            describe('Push Token Management', () => {
                it('should allow updating push token for existing device', async () => {
                    // Создаем настройки
                    const settings = await this.createTestAppUserSettings();
                    const newPushToken = `new-push-token-${Date.now()}`;

                    // Обновляем push token
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .update({ push_token: newPushToken })
                        .eq('id', settings.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.push_token).toBe(newPushToken);
                });

                it('should allow removing push token', async () => {
                    const settings = await this.createTestAppUserSettings();

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .update({ push_token: null })
                        .eq('id', settings.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.push_token).toBeNull();
                });

                it('should validate push token format', async () => {
                    const settingsData = this.generateAppUserSettingsData();
                    settingsData.push_token = 'invalid-token-format'; // Обычно push token имеет определенный формат

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('app_user_settings')
                            .insert([settingsData])
                    );
                });

                it('should handle multiple devices for same user', async () => {
                    // Создаем настройки для первого устройства
                    const device1Data = this.generateAppUserSettingsData();
                    const { data: device1, error: error1 } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([device1Data])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(device1).toBeDefined();
                    if (device1) this.trackTestRecord('app_user_settings', device1.id);

                    // Создаем настройки для второго устройства
                    const device2Data = this.generateAppUserSettingsData();
                    const { data: device2, error: error2 } = await this.getAuthenticatedClient()
                        .from('app_user_settings')
                        .insert([device2Data])
                        .select()
                        .single();

                    expect(error2).toBeNull();
                    expect(device2).toBeDefined();
                    if (device2) this.trackTestRecord('app_user_settings', device2.id);

                    // Проверяем что оба устройства имеют разные device_id
                    expect(device1.device_id).not.toBe(device2.device_id);
                });
            });
        });
    }
}

// Run the tests
AppUserSettingsApiTest.runTests(); 