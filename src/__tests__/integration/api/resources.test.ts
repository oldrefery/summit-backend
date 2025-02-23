import { describe, it, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { Resource } from '@/types';

class ResourcesApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Resources API Tests', () => {
            describe('CRUD Operations', () => {
                let testResource: Resource;

                it('should get all resources', async () => {
                    // Create two test resources
                    const resource1Data = this.generateResourceData();
                    const resource2Data = this.generateResourceData();

                    const { data: r1, error: error1 } = await this.getAuthenticatedClient()
                        .from('resources')
                        .insert([resource1Data])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(r1).toBeDefined();
                    if (r1) this.trackTestRecord('resources', r1.id);

                    const { data: r2, error: error2 } = await this.getAuthenticatedClient()
                        .from('resources')
                        .insert([resource2Data])
                        .select()
                        .single();

                    expect(error2).toBeNull();
                    expect(r2).toBeDefined();
                    if (r2) this.trackTestRecord('resources', r2.id);

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .select('*')
                        .order('name');

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(Array.isArray(data)).toBe(true);
                    expect(data!.length).toBeGreaterThanOrEqual(2);
                    expect(data!.some(r => r.id === r1!.id)).toBe(true);
                    expect(data!.some(r => r.id === r2!.id)).toBe(true);
                });

                it('should create a resource with all fields', async () => {
                    const resourceData = this.generateResourceData();
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .insert([resourceData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testResource = data;
                    if (data) this.trackTestRecord('resources', data.id);

                    // Validate all fields
                    expect(data.name).toBe(resourceData.name);
                    expect(data.link).toBe(resourceData.link);
                    expect(data.description).toBe(resourceData.description);
                    expect(data.is_route).toBe(resourceData.is_route);

                    // Validate timestamps and id
                    this.validateTimestamps(data);
                    this.validateIds(data);
                });

                it('should read a resource by id', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .select()
                        .eq('id', testResource.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.id).toBe(testResource.id);
                });

                it('should update a resource', async () => {
                    const updateData = {
                        name: 'Updated Resource Name',
                        link: 'https://test.com/updated',
                        description: 'Updated Description',
                        is_route: true
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .update(updateData)
                        .eq('id', testResource.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.name).toBe(updateData.name);
                    expect(data.link).toBe(updateData.link);
                    expect(data.description).toBe(updateData.description);
                    expect(data.is_route).toBe(updateData.is_route);
                    expect(data.id).toBe(testResource.id);
                });

                it('should delete a resource', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .delete()
                        .eq('id', testResource.id);

                    expect(error).toBeNull();

                    // Verify deletion
                    const { data, error: readError } = await this.getAuthenticatedClient()
                        .from('resources')
                        .select()
                        .eq('id', testResource.id)
                        .single();

                    expect(data).toBeNull();
                    expect(readError).toBeDefined();
                });
            });

            describe('Validation', () => {
                it('should require name field', async () => {
                    const resourceData = this.generateResourceData();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { name: _name, ...dataWithoutName } = resourceData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('resources')
                            .insert([dataWithoutName])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should not create resources with duplicate name', async () => {
                    const resourceData = this.generateResourceData();

                    // Создаем первый ресурс
                    const { data: resource1, error: error1 } = await this.getAuthenticatedClient()
                        .from('resources')
                        .insert([resourceData])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(resource1).toBeDefined();
                    if (resource1) this.trackTestRecord('resources', resource1.id);

                    // Пытаемся создать второй ресурс с тем же именем
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('resources')
                            .insert([resourceData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate URL format', async () => {
                    const resourceData = this.generateResourceData();
                    const invalidData = {
                        ...resourceData,
                        link: 'invalid-url'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('resources')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should require boolean is_route field', async () => {
                    const resourceData = this.generateResourceData();
                    const invalidData = {
                        ...resourceData,
                        is_route: 'not-a-boolean'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('resources')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });
            });

            describe('Anonymous Access', () => {
                it('should not allow anonymous read', async () => {
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('resources')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const resourceData = this.generateResourceData();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('resources')
                            .insert([resourceData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const resource = await this.createTestResource();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('resources')
                            .update({ name: 'Updated Name' })
                            .eq('id', resource.id),
                        401
                    );
                });

                it('should not allow anonymous delete', async () => {
                    const resource = await this.createTestResource();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('resources')
                            .delete()
                            .eq('id', resource.id),
                        401
                    );
                });
            });

            describe('Edge Cases', () => {
                it('should handle very long text fields', async () => {
                    const longText = 'a'.repeat(1000);
                    const resource = await this.createTestResource();

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .update({
                            description: longText,
                        })
                        .eq('id', resource.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.description).toBe(longText);
                });

                it('should handle special characters in text fields', async () => {
                    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
                    const resourceData = this.generateResourceData();
                    resourceData.name += specialChars;
                    resourceData.description += specialChars;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .insert([resourceData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.name).toBe(resourceData.name);
                    expect(data.description).toBe(resourceData.description);

                    if (data) this.trackTestRecord('resources', data.id);
                });

                it('should handle empty optional fields', async () => {
                    const resourceData = {
                        name: `Test Resource ${Date.now()}`,
                        is_route: false,
                        link: `https://test.com/resource/${Date.now()}`, // link is required
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .insert([resourceData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.description).toBe(''); // empty string instead of null

                    if (data) this.trackTestRecord('resources', data.id);
                });

                it('should handle route resources correctly', async () => {
                    const routeResource = {
                        ...this.generateResourceData(),
                        is_route: true
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('resources')
                        .insert([routeResource])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.is_route).toBe(true);

                    if (data) this.trackTestRecord('resources', data.id);
                });
            });
        });
    }
}

// Run the tests
ResourcesApiTest.runTests(); 