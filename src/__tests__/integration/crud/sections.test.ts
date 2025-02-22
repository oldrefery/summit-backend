import { describe, test, expect } from 'vitest';
import { BaseIntegrationTest } from '../base-test';
import type { Section } from '@/types/supabase';
import { delay } from '../../../utils/test-utils';

class SectionsTest extends BaseIntegrationTest {
    static async createSection(name: string, date: string) {
        return this.initializeTestData<Section>('sections', {
            name,
            date
        });
    }
}

describe('Sections CRUD Operations', () => {
    let createdSectionId: number;
    const uniqueId = Date.now();

    const testSection: Omit<Section, 'id' | 'created_at'> = {
        name: `Test Section ${uniqueId}`,
        date: '2024-02-21'
    };

    describe('Anonymous Access', () => {
        test('cannot create records', async () => {
            const { data, error } = await SectionsTest.getAnonymousClient()
                .from('sections')
                .insert([testSection])
                .select()
                .single();

            expect(error).not.toBeNull();
            expect(error?.message).toMatch(/(permission denied|violates row-level security)/);
            expect(data).toBeNull();

            await delay(1000);
        });

        test('cannot read records', async () => {
            const { data, error } = await SectionsTest.getAnonymousClient()
                .from('sections')
                .select('*');

            expect(data).toEqual([]);
            expect(error).toBeNull();

            await delay(1000);
        });

        test('cannot update records', async () => {
            // First create a record as authenticated user
            const section = await SectionsTest.createSection(
                `Test Section Update ${uniqueId}`,
                '2024-02-21'
            );
            const sectionId = section.id;

            await delay(1000);

            // Try to update as anonymous user
            await SectionsTest.getAnonymousClient()
                .from('sections')
                .update({ name: 'Updated Section' })
                .eq('id', sectionId);

            // Verify that the record was not updated
            const { data: checkData } = await SectionsTest.getAuthenticatedClient()
                .from('sections')
                .select()
                .eq('id', sectionId)
                .single();

            expect(checkData?.name).toBe(section.name);

            // Clean up
            await SectionsTest.cleanupTestData('sections', sectionId);

            await delay(1000);
        });

        test('cannot delete records', async () => {
            // First create a record as authenticated user
            const section = await SectionsTest.createSection(
                `Test Section Delete ${uniqueId}`,
                '2024-02-21'
            );
            const sectionId = section.id;

            await delay(1000);

            // Try to delete as anonymous user
            await SectionsTest.getAnonymousClient()
                .from('sections')
                .delete()
                .eq('id', sectionId);

            // Verify that the record still exists
            const { data: checkData } = await SectionsTest.getAuthenticatedClient()
                .from('sections')
                .select()
                .eq('id', sectionId)
                .single();

            expect(checkData).not.toBeNull();
            expect(checkData?.id).toBe(sectionId);

            // Clean up
            await SectionsTest.cleanupTestData('sections', sectionId);

            await delay(1000);
        });
    });

    describe('Authenticated Access', () => {
        test('can create and read records', async () => {
            // Create section using the helper method
            const section = await SectionsTest.createSection(
                `Test Section Create ${uniqueId}`,
                '2024-02-21'
            );

            expect(section).not.toBeNull();
            expect(section.date).toBe('2024-02-21');
            createdSectionId = section.id;

            // Read all sections
            const { data: readData, error: readError } = await SectionsTest.getAuthenticatedClient()
                .from('sections')
                .select('*');

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            expect(Array.isArray(readData)).toBe(true);
            expect(readData?.length).toBeGreaterThan(0);
            expect(readData?.find(s => s.id === createdSectionId)).toBeTruthy();

            await delay(1000);
        });

        test('can update own records', async () => {
            const updates = {
                name: `Updated Section ${uniqueId}`,
                date: '2024-02-22'
            };

            const { data, error } = await SectionsTest.getAuthenticatedClient()
                .from('sections')
                .update(updates)
                .eq('id', createdSectionId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.name).toBe(updates.name);
            expect(data?.date).toBe(updates.date);

            await delay(1000);
        });

        test('can delete own records', async () => {
            // Delete using cleanupTestData
            await SectionsTest.cleanupTestData('sections', createdSectionId);

            // Verify deletion
            const { data, error: readError } = await SectionsTest.getAuthenticatedClient()
                .from('sections')
                .select('*')
                .eq('id', createdSectionId)
                .single();

            expect(data).toBeNull();
            expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

            createdSectionId = 0;

            await delay(1000);
        });
    });
}); 