import { describe, test, expect } from 'vitest';
import { BaseIntegrationTest } from '../base-test';
import type { Resource } from '@/types';
import { delay } from '../../../utils/test-utils';

class ResourcesTest extends BaseIntegrationTest {
    static async createResource(name: string) {
        return this.initializeTestData<Resource>('resources', {
            name,
            link: `https://example.com/${name}`,
            description: `Description for ${name}`,
            is_route: false
        });
    }
}

describe('Resources Table RLS Policies', () => {
    let createdResourceId: number;
    const uniqueId = Date.now();

    const testResource: Omit<Resource, 'id' | 'created_at'> = {
        name: `Test Resource ${uniqueId}`,
        link: `https://example.com/test-${uniqueId}`,
        description: 'Test Description',
        is_route: false
    };

    describe('Anonymous Access', () => {
        test('cannot create records', async () => {
            const { data, error } = await ResourcesTest.getAnonymousClient()
                .from('resources')
                .insert([testResource])
                .select()
                .single();

            expect(error).not.toBeNull();
            expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
            expect(data).toBeNull();

            await delay(1000);
        });

        test('cannot read records', async () => {
            const { data, error } = await ResourcesTest.getAnonymousClient()
                .from('resources')
                .select('*');

            expect(data).toEqual([]);
            expect(error).toBeNull();

            await delay(1000);
        });
    });

    describe('Authenticated Access', () => {
        test('can create and read records', async () => {
            const resource = await ResourcesTest.createResource(`Test Resource Create ${uniqueId}`);
            createdResourceId = resource.id;

            expect(resource).not.toBeNull();
            expect(resource.name).toContain('Test Resource Create');

            // Read all resources
            const { data: readData, error: readError } = await ResourcesTest.getAuthenticatedClient()
                .from('resources')
                .select('*');

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            expect(Array.isArray(readData)).toBe(true);
            expect(readData?.length).toBeGreaterThan(0);
            expect(readData?.find(r => r.id === createdResourceId)).toBeTruthy();

            await delay(1000);
        });

        test('can update own records', async () => {
            const updates = {
                name: `Updated Resource ${uniqueId}`,
                description: 'Updated Description'
            };

            const { data, error } = await ResourcesTest.getAuthenticatedClient()
                .from('resources')
                .update(updates)
                .eq('id', createdResourceId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.name).toBe(updates.name);
            expect(data?.description).toBe(updates.description);

            await delay(1000);
        });

        test('can delete own records', async () => {
            await ResourcesTest.cleanupTestData('resources', createdResourceId);

            // Verify deletion
            const { data, error: readError } = await ResourcesTest.getAuthenticatedClient()
                .from('resources')
                .select('*')
                .eq('id', createdResourceId)
                .single();

            expect(data).toBeNull();
            expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

            createdResourceId = 0;

            await delay(1000);
        });

        test('has access to all fields of own records', async () => {
            const resource = await ResourcesTest.createResource(`Test Resource Fields ${uniqueId}`);
            createdResourceId = resource.id;

            // Try to read all fields
            const { data: readData, error: readError } = await ResourcesTest.getAuthenticatedClient()
                .from('resources')
                .select('id, name, link, description, is_route')
                .eq('id', createdResourceId)
                .single();

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            // All fields should be visible
            expect(readData?.name).toContain('Test Resource Fields');
            expect(readData?.link).toContain('example.com');
            expect(readData?.description).toContain('Description for');
            expect(readData?.is_route).toBe(false);

            await delay(1000);
        });
    });
}); 