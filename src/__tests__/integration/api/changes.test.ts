/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, test, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { EntityChanges } from '@/types/versions';
import type { Person, Location, Resource, MarkdownPage } from '@/types/supabase';
/* eslint-enable @typescript-eslint/no-unused-vars */

class ChangesApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Changes API Tests', () => {
            describe('Publication', () => {
                it('should get changes since last version', async () => {
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

                it.skip('should publish new version when changes exist', async () => {
                    // Создаем тестовые данные в правильном порядке
                    const testPerson = await this.createTestPerson();
                    const testLocation = await this.createTestLocation();
                    const testResource = await this.createTestResource();
                    const testMarkdownPage = await this.createTestMarkdownPage();

                    // Публикуем новую версию
                    const { data: publishData, error: publishError } = await this.getAuthenticatedClient()
                        .rpc('publish_new_version');

                    console.log('Published data:', JSON.stringify(publishData, null, 2));

                    expect(publishError).toBeNull();
                    expect(publishData).toBeDefined();
                    expect(publishData.data).toBeDefined();
                    expect(publishData.data.data).toBeDefined();
                    expect(publishData.data.data.people).toBeDefined();
                    expect(Array.isArray(publishData.data.data.people)).toBe(true);
                    expect(Array.isArray(publishData.data.data.locations)).toBe(true);
                    expect(Array.isArray(publishData.data.data.resources)).toBe(true);
                    expect(Array.isArray(publishData.data.data.markdown_pages)).toBe(true);

                    const testPersonInData = publishData.data.data.people.find((p: Person) => p.name === testPerson.name);
                    const testLocationInData = publishData.data.data.locations.find((l: Location) => l.name === testLocation.name);
                    const testResourceInData = publishData.data.data.resources.find((r: Resource) => r.id === testResource.id);
                    const testMarkdownPageInData = publishData.data.data.markdown_pages.find((m: MarkdownPage) => m.slug === testMarkdownPage.slug);

                    expect(testPersonInData).toBeDefined();
                    expect(testLocationInData).toBeDefined();
                    expect(testResourceInData).toBeDefined();
                    expect(testMarkdownPageInData).toBeDefined();
                });

                it('should allow anonymous users to get changes due to SECURITY DEFINER', async () => {
                    const { data, error } = await this.getAnonymousClient()
                        .rpc('get_changes_since_last_version');

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                });

                it('should not allow anonymous users to publish version', async () => {
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .rpc('publish_new_version')
                    );
                });
            });
        });
    }
}

// Run the tests
ChangesApiTest.runTests(); 