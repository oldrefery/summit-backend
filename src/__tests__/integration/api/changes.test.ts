import { describe, test, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { EntityChanges } from '@/types/versions';

class ChangesApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Changes API Tests', () => {
            describe('Publication', () => {
                test('should get changes since last version', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('get_changes_since_last_version');

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data).toHaveProperty('events');
                    expect(data).toHaveProperty('people');
                    expect(data).toHaveProperty('sections');
                    expect(data).toHaveProperty('locations');
                    expect(data).toHaveProperty('resources');
                    expect(data).toHaveProperty('social_posts');
                    expect(data).toHaveProperty('announcements');
                    expect(data).toHaveProperty('markdown_pages');
                });

                test('should publish new version when changes exist', async () => {
                    // Create test data to ensure changes exist
                    await this.createTestPerson();

                    // Get changes before publication
                    const { data: changesBefore } = await this.getAuthenticatedClient()
                        .rpc('get_changes_since_last_version');

                    expect(Object.values(changesBefore as EntityChanges).some(v => v > 0)).toBe(true);

                    // Publish new version
                    const { data: publishData, error: publishError } = await this.getAuthenticatedClient()
                        .rpc('publish_new_version');

                    expect(publishError).toBeNull();
                    expect(publishData).toBeDefined();
                    expect(publishData).toHaveProperty('data');
                    expect(publishData).toHaveProperty('version');

                    // Загрузим файл в storage используя тот же путь и формат данных
                    const { error: uploadError } = await this.getAuthenticatedClient()
                        .storage
                        .from('app-data')
                        .upload('app-data.json', new Blob([JSON.stringify(publishData.data)], {
                            type: 'application/json'
                        }), {
                            upsert: true,
                            contentType: 'application/json'
                        });

                    expect(uploadError).toBeNull();

                    // Теперь проверим что файл доступен
                    const { data: fileData, error: fileError } = await this.getAuthenticatedClient()
                        .storage
                        .from('app-data')
                        .download('app-data.json');

                    expect(fileError).toBeNull();
                    expect(fileData).not.toBeNull();

                    // Convert Blob to JSON
                    const jsonContent = JSON.parse(await fileData!.text());
                    expect(jsonContent.data).toBeDefined();
                    expect(jsonContent.data.people).toBeDefined();
                });

                test('should allow anonymous users to get changes due to SECURITY DEFINER', async () => {
                    const { data, error } = await this.getAnonymousClient()
                        .rpc('get_changes_since_last_version');

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data).toHaveProperty('events');
                    expect(data).toHaveProperty('people');
                    expect(data).toHaveProperty('sections');
                    expect(data).toHaveProperty('locations');
                    expect(data).toHaveProperty('resources');
                    expect(data).toHaveProperty('social_posts');
                    expect(data).toHaveProperty('announcements');
                    expect(data).toHaveProperty('markdown_pages');
                });

                test('should not allow anonymous users to publish version', async () => {
                    const { data, error } = await this.getAnonymousClient()
                        .rpc('publish_new_version');

                    expect(data).toBeNull();
                    expect(error).toBeDefined();
                    expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
                });

                test('should handle concurrent version publications', async () => {
                    // Create test data first
                    await this.createTestPerson();

                    // Attempt two concurrent publications
                    const [pub1, pub2] = await Promise.allSettled([
                        this.getAuthenticatedClient().rpc('publish_new_version'),
                        this.getAuthenticatedClient().rpc('publish_new_version')
                    ]);

                    // At least one publication should succeed
                    expect(
                        pub1.status === 'fulfilled' || pub2.status === 'fulfilled'
                    ).toBe(true);
                });
            });
        });
    }
}

// Run the tests
ChangesApiTest.runTests(); 