import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/database';
import type { Person } from '../../../types/supabase';
import { cleanupTestData, generateTestName, setupTestClient } from '../config/test-utils';

describe('People CRUD Operations', () => {
    let authClient: ReturnType<typeof createClient<Database>>;
    let testPersonId: number;

    beforeAll(async () => {
        const clients = await setupTestClient();
        authClient = clients.authClient;
    });

    afterAll(async () => {
        if (testPersonId) {
            await authClient.from('people').delete().eq('id', testPersonId);
        }
        await cleanupTestData(authClient);
    });

    describe('Create Operations', () => {
        describe('Validation', () => {
            it('should require name field', async () => {
                // Пытаемся создать запись без имени
                const { data: emptyData, error: emptyError } = await authClient
                    .from('people')
                    .insert({})
                    .select()
                    .single();

                expect(emptyError).not.toBeNull();
                expect(emptyError?.message).toContain('null value in column "name"');
                expect(emptyData).toBeNull();

                // Пытаемся создать запись только с role
                const { data: roleOnlyData, error: roleOnlyError } = await authClient
                    .from('people')
                    .insert({ role: 'speaker' })
                    .select()
                    .single();

                expect(roleOnlyError).not.toBeNull();
                expect(roleOnlyError?.message).toContain('null value in column "name"');
                expect(roleOnlyData).toBeNull();
            });

            it('should create record with valid role', async () => {
                // Проверяем валидные значения role
                const validRoles = ['speaker', 'attendee'] as const;
                for (const role of validRoles) {
                    const { data, error } = await authClient
                        .from('people')
                        .insert({
                            name: generateTestName('test_person'),
                            role
                        })
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).not.toBeNull();
                    expect(data?.role).toBe(role);

                    if (data?.id) {
                        await authClient.from('people').delete().eq('id', data.id);
                    }
                }
            });

            it('should create record with all fields', async () => {
                const testData: Omit<Person, 'id' | 'created_at'> = {
                    name: generateTestName('test_person'),
                    role: 'speaker',
                    title: 'Test Title',
                    company: 'Test Company',
                    bio: 'Test Bio',
                    photo_url: 'https://example.com/photo.jpg',
                    country: 'Test Country',
                    email: 'test@example.com',
                    mobile: '+1234567890'
                };

                const { data, error } = await authClient
                    .from('people')
                    .insert(testData)
                    .select()
                    .single();

                expect(error).toBeNull();
                expect(data).not.toBeNull();
                expect(data?.name).toBe(testData.name);
                expect(data?.role).toBe(testData.role);
                expect(data?.title).toBe(testData.title);
                expect(data?.company).toBe(testData.company);
                expect(data?.bio).toBe(testData.bio);
                expect(data?.photo_url).toBe(testData.photo_url);
                expect(data?.country).toBe(testData.country);
                expect(data?.email).toBe(testData.email);
                expect(data?.mobile).toBe(testData.mobile);
                expect(data?.created_at).not.toBeNull();
                expect(data?.user_id).not.toBeNull();

                if (data?.id) {
                    testPersonId = data.id;
                }
            });

            it('should create record with duplicate email', async () => {
                // Email не является уникальным полем, поэтому должно быть возможно создать запись с тем же email
                const { data, error } = await authClient
                    .from('people')
                    .insert({
                        name: generateTestName('test_person'),
                        role: 'speaker',
                        email: 'test@example.com'
                    })
                    .select()
                    .single();

                expect(error).toBeNull();
                expect(data).not.toBeNull();
                expect(data?.email).toBe('test@example.com');

                if (data?.id) {
                    await authClient.from('people').delete().eq('id', data.id);
                }
            });
        });

        describe('Automatic Fields', () => {
            it('should automatically set created_at', async () => {
                const { data, error } = await authClient
                    .from('people')
                    .insert({
                        name: 'Test Person',
                        role: 'speaker'
                    })
                    .select()
                    .single();

                expect(error).toBeNull();
                expect(data).not.toBeNull();
                const createdAt = data?.created_at;
                expect(createdAt).not.toBeNull();
                expect(new Date(createdAt!).getTime()).toBeGreaterThan(0);

                if (data?.id) {
                    await authClient.from('people').delete().eq('id', data.id);
                }
            });

            it('should automatically set user_id', async () => {
                const { data, error } = await authClient
                    .from('people')
                    .insert({
                        name: generateTestName('test_person'),
                        role: 'speaker'
                    })
                    .select()
                    .single();

                expect(error).toBeNull();
                expect(data).not.toBeNull();
                expect(data?.user_id).not.toBeNull();

                if (data?.id) {
                    await authClient.from('people').delete().eq('id', data.id);
                }
            });
        });
    });
}); 