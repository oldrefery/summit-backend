import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { AppUserSettings, DeviceInfo, UserSettings } from '@/types/push';


// Create Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('App User Settings Integration Tests', () => {
    const uniqueId = Date.now();
    let testDeviceId: string;
    let testUserId: string;

    const testDeviceInfo: DeviceInfo = {
        deviceName: 'Test Device',
        osName: 'iOS',
        osVersion: '16.0',
        deviceModel: 'iPhone 13',
        appVersion: '1.0.0',
        buildNumber: '1'
    };

    const defaultSettings: UserSettings = {
        social_feed: true,
        announcements: true
    };

    beforeAll(async () => {
        testDeviceId = `test-device-${uniqueId}`;

        // Создаем тестовую запись
        const { data, error } = await supabase
            .from('app_user_settings')
            .insert({
                device_id: testDeviceId,
                device_info: testDeviceInfo,
                settings: defaultSettings
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        testUserId = data.id;
    });

    afterAll(async () => {
        if (testUserId) {
            await supabase
                .from('app_user_settings')
                .delete()
                .eq('id', testUserId);
        }
    });

    test('should create and read settings with device_id', async () => {
        const deviceId = `test-device-${uniqueId}-2`;

        const newSettings: UserSettings = {
            social_feed: true,
            announcements: false
        };

        // Create settings
        const { data: createData, error: createError } = await supabase
            .from('app_user_settings')
            .insert({
                device_id: deviceId,
                device_info: testDeviceInfo,
                settings: newSettings
            })
            .select()
            .single();

        expect(createError).toBeNull();
        expect(createData).not.toBeNull();
        expect((createData as AppUserSettings).device_id).toBe(deviceId);
        expect((createData as AppUserSettings).settings.announcements).toBe(false);

        // Read settings
        const { data: readData, error: readError } = await supabase
            .from('app_user_settings')
            .select()
            .eq('device_id', deviceId)
            .single();

        expect(readError).toBeNull();
        expect(readData).not.toBeNull();
        expect((readData as AppUserSettings).device_id).toBe(deviceId);
        expect((readData as AppUserSettings).settings.announcements).toBe(false);

        // Cleanup
        await supabase
            .from('app_user_settings')
            .delete()
            .eq('device_id', deviceId);
    });

    test('should update settings', async () => {
        const updatedSettings: UserSettings = {
            social_feed: false,
            announcements: true
        };

        // Update settings
        const { data: updateData, error: updateError } = await supabase
            .from('app_user_settings')
            .update({
                settings: updatedSettings
            })
            .eq('device_id', testDeviceId)
            .select()
            .single();

        expect(updateError).toBeNull();
        expect(updateData).not.toBeNull();
        expect((updateData as AppUserSettings).settings.social_feed).toBe(false);
    });

    test('should update push token', async () => {
        const testPushToken = `test-push-token-${uniqueId}`;

        // Update push token
        const { data: updateData, error: updateError } = await supabase
            .from('app_user_settings')
            .update({
                push_token: testPushToken
            })
            .eq('device_id', testDeviceId)
            .select()
            .single();

        expect(updateError).toBeNull();
        expect(updateData).not.toBeNull();
        expect((updateData as AppUserSettings).push_token).toBe(testPushToken);
    });

    test('should not access settings with wrong device_id', async () => {
        const wrongDeviceId = 'wrong-device-id';

        // Try to read settings
        const { data: readData, error: readError } = await supabase
            .from('app_user_settings')
            .select()
            .eq('device_id', wrongDeviceId)
            .single();

        expect(readError).not.toBeNull();
        expect(readData).toBeNull();

        // Try to update settings
        const { data: updateData, error: updateError } = await supabase
            .from('app_user_settings')
            .update({
                settings: {
                    social_feed: false,
                    announcements: false
                }
            })
            .eq('device_id', wrongDeviceId)
            .select()
            .single();

        expect(updateError).not.toBeNull();
        expect(updateData).toBeNull();
    });
}); 