import { describe, it, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { Version } from '@/types';

class JsonVersionsApiTest extends BaseApiTest {
    public static async runTests() {
        describe('JSON Versions API Tests', () => {
            describe('CRUD Operations', () => {
                let testVersion: Version;

                it('should get all versions', async () => {
                    // Create two test versions with unique combinations
                    const version1Data = {
                        ...this.generateJsonVersionData(),
                        changes: {
                            events: 1,
                            people: 2,
                            sections: 0,
                            locations: 1,
                            resources: 0,
                            social_posts: 0,
                            announcements: 1,
                            markdown_pages: 0
                        }
                    };

                    const version2Data = {
                        ...this.generateJsonVersionData(),
                        changes: {
                            events: 0,
                            people: 1,
                            sections: 1,
                            locations: 0,
                            resources: 2,
                            social_posts: 1,
                            announcements: 0,
                            markdown_pages: 1
                        }
                    };

                    const { data: v1, error: error1 } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([version1Data])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(v1).toBeDefined();
                    if (v1) this.trackTestRecord('json_versions', v1.id);

                    const { data: v2, error: error2 } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([version2Data])
                        .select()
                        .single();

                    expect(error2).toBeNull();
                    expect(v2).toBeDefined();
                    if (v2) this.trackTestRecord('json_versions', v2.id);

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .select('*')
                        .order('published_at', { ascending: false });

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(Array.isArray(data)).toBe(true);
                    expect(data!.length).toBeGreaterThanOrEqual(2);
                    expect(data!.some(v => v.id === v1!.id)).toBe(true);
                    expect(data!.some(v => v.id === v2!.id)).toBe(true);
                });

                it('should create a version with all fields', async () => {
                    const versionData = this.generateJsonVersionData();

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([versionData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testVersion = data;
                    if (data) this.trackTestRecord('json_versions', data.id);

                    // Validate all fields
                    expect(data.version).toBe(versionData.version);
                    expect(data.file_path).toBe(versionData.file_path);
                    expect(data.changes).toEqual(versionData.changes);
                    expect(data.file_url).toBe(versionData.file_url);
                    expect(data.published_at).toBeDefined();

                    // Validate timestamps and id
                    this.validateTimestamps(data);
                    this.validateIds(data);
                });

                it('should read a version by id', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .select()
                        .eq('id', testVersion.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.id).toBe(testVersion.id);
                });

                it('should update a version', async () => {
                    const updateData = {
                        ...this.generateJsonVersionData(),
                        changes: {
                            events: 2,
                            people: 2,
                            sections: 2,
                            locations: 2,
                            resources: 2,
                            social_posts: 2,
                            announcements: 2,
                            markdown_pages: 2
                        }
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .update(updateData)
                        .eq('id', testVersion.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.file_path).toBe(updateData.file_path);
                    expect(data.changes).toEqual(updateData.changes);
                    expect(data.file_url).toBe(updateData.file_url);
                    expect(data.id).toBe(testVersion.id);
                });

                it('should delete a version', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .delete()
                        .eq('id', testVersion.id);

                    expect(error).toBeNull();

                    // Verify deletion
                    const { data, error: readError } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .select()
                        .eq('id', testVersion.id)
                        .single();

                    expect(data).toBeNull();
                    expect(readError).toBeDefined();
                });
            });

            describe('Validation', () => {
                it('should require version field', async () => {
                    const versionData = this.generateJsonVersionData();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { version: _version, ...dataWithoutVersion } = versionData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('json_versions')
                            .insert([dataWithoutVersion])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should require file_path field', async () => {
                    const versionData = this.generateJsonVersionData();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { file_path: _filePath, ...dataWithoutFilePath } = versionData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('json_versions')
                            .insert([dataWithoutFilePath])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should not create versions with duplicate file_path and version', async () => {
                    const versionData = this.generateJsonVersionData();

                    // Create first version
                    const { data: version1, error: error1 } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([versionData])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(version1).toBeDefined();
                    if (version1) this.trackTestRecord('json_versions', version1.id);

                    // Try to create second version with same file_path and version
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('json_versions')
                            .insert([versionData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate changes format', async () => {
                    const versionData = {
                        ...this.generateJsonVersionData(),
                        changes: 'invalid-json' // should be an object
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('json_versions')
                            .insert([versionData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate file_url format', async () => {
                    const versionData = {
                        ...this.generateJsonVersionData(),
                        file_url: 'invalid-url'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('json_versions')
                            .insert([versionData])
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
                            .from('json_versions')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const versionData = this.generateJsonVersionData();

                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('json_versions')
                            .insert([versionData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const version = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([this.generateJsonVersionData()])
                        .select()
                        .single();

                    expect(version.data).toBeDefined();
                    if (version.data) this.trackTestRecord('json_versions', version.data.id);

                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('json_versions')
                            .update({ changes: { updated: 1 } })
                            .eq('id', version.data.id),
                        401
                    );
                });

                it('should not allow anonymous delete', async () => {
                    const version = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([this.generateJsonVersionData()])
                        .select()
                        .single();

                    expect(version.data).toBeDefined();
                    if (version.data) this.trackTestRecord('json_versions', version.data.id);

                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('json_versions')
                            .delete()
                            .eq('id', version.data.id),
                        401
                    );
                });
            });

            describe('Edge Cases', () => {
                it('should handle complex changes object', async () => {
                    const complexChanges = {
                        events: 100,
                        people: 200,
                        sections: 300,
                        locations: 400,
                        resources: 500,
                        social_posts: 600,
                        announcements: 700,
                        markdown_pages: 800,
                        nested: {
                            level1: {
                                level2: {
                                    value: 1000
                                }
                            }
                        },
                        array: [1, 2, 3, 4, 5]
                    };

                    const versionData = {
                        ...this.generateJsonVersionData(),
                        changes: complexChanges
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([versionData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.changes).toEqual(complexChanges);
                    if (data) this.trackTestRecord('json_versions', data.id);
                });

                it('should handle special characters in paths', async () => {
                    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
                    const versionData = {
                        ...this.generateJsonVersionData(),
                        version: Math.floor(Date.now() / 1000).toString(),
                        file_path: `/test/path/${Date.now()}${specialChars}`
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([versionData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.version).toBe(versionData.version);
                    expect(data.file_path).toBe(versionData.file_path);
                    if (data) this.trackTestRecord('json_versions', data.id);
                });

                it('should handle empty changes object', async () => {
                    const versionData = {
                        ...this.generateJsonVersionData(),
                        changes: {}
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([versionData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.changes).toEqual({});
                    if (data) this.trackTestRecord('json_versions', data.id);
                });

                it('should handle very long version strings', async () => {
                    const longVersion = Math.floor(Date.now() / 1000).toString();
                    const versionData = {
                        ...this.generateJsonVersionData(),
                        version: longVersion
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('json_versions')
                        .insert([versionData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.version).toBe(longVersion);
                    if (data) this.trackTestRecord('json_versions', data.id);
                });
            });
        });
    }
}

// Run the tests
JsonVersionsApiTest.runTests(); 