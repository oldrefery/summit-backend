import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Person, PersonRole } from '@/types/supabase';
import { generateTestName, setupTestClient } from '../config/test-utils';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/database';

describe('People API Integration Tests', () => {
    let testPersonId: number;
    let authClient: ReturnType<typeof createClient<Database>>;
    const uniqueId = Date.now();

    const validPerson: Omit<Person, 'id' | 'created_at'> = {
        name: generateTestName('Test Person'),
        role: 'speaker' as PersonRole,
        title: 'Test Title',
        company: 'Test Company',
        bio: 'Test Bio',
        photo_url: 'https://example.com/photo.jpg',
        country: 'Test Country',
        email: `test${uniqueId}@example.com`,
        mobile: '+1234567890'
    };

    // Setup: Authenticate before tests
    beforeAll(async () => {
        const clients = await setupTestClient();
        authClient = clients.authClient;
    });

    describe('Create Operations', () => {
        test('should create person with all valid fields', async () => {
            const { data: person, error } = await authClient
                .from('people')
                .insert([validPerson])
                .select()
                .single();

            expect(error).toBeNull();
            expect(person).toBeDefined();
            expect(person.id).toBeDefined();
            expect(person.name).toBe(validPerson.name);
            expect(person.role).toBe(validPerson.role);
            expect(person.title).toBe(validPerson.title);
            expect(person.company).toBe(validPerson.company);
            expect(person.bio).toBe(validPerson.bio);
            expect(person.photo_url).toBe(validPerson.photo_url);
            expect(person.country).toBe(validPerson.country);
            expect(person.email).toBe(validPerson.email);
            expect(person.mobile).toBe(validPerson.mobile);
            expect(person.created_at).toBeDefined();

            testPersonId = person.id;
        });

        test('should fail to create person without required fields', async () => {
            const invalidPerson = {
                title: 'Test Title'
            };

            const { error } = await authClient
                .from('people')
                .insert([invalidPerson])
                .select()
                .single();

            expect(error).not.toBeNull();
            expect(error?.message).toContain('null value in column "name"');
        });

        test('should create person with minimum required fields', async () => {
            const minimalPerson = {
                name: generateTestName('Minimal Person'),
                role: 'attendee' as PersonRole
            };

            const { data: person, error } = await authClient
                .from('people')
                .insert([minimalPerson])
                .select()
                .single();

            expect(error).toBeNull();
            expect(person).toBeDefined();
            expect(person.id).toBeDefined();
            expect(person.name).toBe(minimalPerson.name);
            expect(person.role).toBe(minimalPerson.role);

            // Cleanup
            await authClient.from('people').delete().eq('id', person.id);
        });

        test('should create person with valid photo_url', async () => {
            const personWithPhoto = {
                ...validPerson,
                name: generateTestName('Photo Person'),
                photo_url: 'https://example.com/valid-photo.jpg'
            };

            const { data: person, error } = await authClient
                .from('people')
                .insert([personWithPhoto])
                .select()
                .single();

            expect(error).toBeNull();
            expect(person).toBeDefined();
            expect(person.photo_url).toBe(personWithPhoto.photo_url);

            // Cleanup
            await authClient.from('people').delete().eq('id', person.id);
        });

        test('should create person with valid email format', async () => {
            const personWithEmail = {
                ...validPerson,
                name: generateTestName('Email Person'),
                email: `test.valid${uniqueId}@example.com`
            };

            const { data: person, error } = await authClient
                .from('people')
                .insert([personWithEmail])
                .select()
                .single();

            expect(error).toBeNull();
            expect(person).toBeDefined();
            expect(person.email).toBe(personWithEmail.email);

            // Cleanup
            await authClient.from('people').delete().eq('id', person.id);
        });
    });

    describe('Read Operations', () => {
        test('should get all people', async () => {
            const { data: people, error } = await authClient
                .from('people')
                .select('*');

            expect(error).toBeNull();
            expect(people).not.toBeNull();
            if (people) {
                expect(Array.isArray(people)).toBe(true);
                expect(people.length).toBeGreaterThan(0);
                const testPerson = people.find(p => p.id === testPersonId);
                expect(testPerson).toBeDefined();
            }
        });

        test('should get person with all fields', async () => {
            const { data: person, error } = await authClient
                .from('people')
                .select('*')
                .eq('id', testPersonId)
                .single();

            expect(error).toBeNull();
            expect(person).toBeDefined();
            expect(person?.name).toBe(validPerson.name);
            expect(person?.role).toBe(validPerson.role);
            expect(person?.title).toBe(validPerson.title);
            expect(person?.company).toBe(validPerson.company);
            expect(person?.bio).toBe(validPerson.bio);
            expect(person?.photo_url).toBe(validPerson.photo_url);
            expect(person?.country).toBe(validPerson.country);
            expect(person?.email).toBe(validPerson.email);
            expect(person?.mobile).toBe(validPerson.mobile);
        });
    });

    describe('Update Operations', () => {
        test('should update all fields', async () => {
            const updates: Partial<Omit<Person, 'id' | 'created_at'>> = {
                name: generateTestName('Updated Person'),
                title: 'Updated Title',
                company: 'Updated Company',
                bio: 'Updated Bio',
                country: 'Updated Country',
                email: `updated${uniqueId}@example.com`,
                mobile: '+9876543210'
            };

            const { data: updatedPerson, error } = await authClient
                .from('people')
                .update(updates)
                .eq('id', testPersonId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(updatedPerson).toBeDefined();
            expect(updatedPerson.name).toBe(updates.name);
            expect(updatedPerson.title).toBe(updates.title);
            expect(updatedPerson.company).toBe(updates.company);
            expect(updatedPerson.bio).toBe(updates.bio);
            expect(updatedPerson.country).toBe(updates.country);
            expect(updatedPerson.email).toBe(updates.email);
            expect(updatedPerson.mobile).toBe(updates.mobile);
        });

        test('should partially update person', async () => {
            const partialUpdate = {
                title: 'Partial Update Title'
            };

            const { data: updatedPerson, error } = await authClient
                .from('people')
                .update(partialUpdate)
                .eq('id', testPersonId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(updatedPerson).toBeDefined();
            expect(updatedPerson.title).toBe(partialUpdate.title);
        });

        test('should fail to update non-existent person', async () => {
            const nonExistentId = 999999;
            const { data, error } = await authClient
                .from('people')
                .update({ title: 'Test' })
                .eq('id', nonExistentId)
                .select()
                .single();

            expect(data).toBeNull();
            expect(error).not.toBeNull();
            expect(error?.message).toContain('JSON object requested, multiple (or no) rows returned');
        });
    });

    describe('Delete Operations', () => {
        /* Temporarily disabled - needs to be fixed
        test('should fail to delete person with event assignments', async () => {
            // Create event and event_person records
            const { data: sectionData } = await authClient
                .from('sections')
                .insert([{
                    name: generateTestName('Test Section'),
                    date: new Date().toISOString().split('T')[0]
                }])
                .select()
                .single();

            const { data: eventData } = await authClient
                .from('events')
                .insert([{
                    section_id: sectionData!.id,
                    title: generateTestName('Test Event'),
                    date: new Date().toISOString().split('T')[0],
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 3600000).toISOString()
                }])
                .select()
                .single();

            await authClient
                .from('event_people')
                .insert([{
                    event_id: eventData!.id,
                    person_id: testPersonId,
                    role: 'speaker'
                }]);

            // Try to delete person with assignments
            const { error } = await authClient
                .from('people')
                .delete()
                .eq('id', testPersonId);

            expect(error).not.toBeNull();
            expect(error?.message).toContain('violates foreign key constraint');

            // Cleanup
            await authClient.from('event_people').delete().eq('event_id', eventData!.id);
            await authClient.from('events').delete().eq('id', eventData!.id);
            await authClient.from('sections').delete().eq('id', sectionData!.id);
        });
        */

        test('should successfully delete person without assignments', async () => {
            // Create a new person without any assignments
            const { data: personToDelete } = await authClient
                .from('people')
                .insert([{
                    name: generateTestName('Person To Delete'),
                    role: 'attendee' as PersonRole
                }])
                .select()
                .single();

            // Should successfully delete
            const { error: deleteError } = await authClient
                .from('people')
                .delete()
                .eq('id', personToDelete!.id);

            expect(deleteError).toBeNull();

            // Verify person is deleted
            const { data: verifyData } = await authClient
                .from('people')
                .select('*')
                .eq('id', personToDelete!.id)
                .single();

            expect(verifyData).toBeNull();
        });

        test('should fail to delete non-existent person', async () => {
            const nonExistentId = 999999;
            const { data, error } = await authClient
                .from('people')
                .delete()
                .eq('id', nonExistentId)
                .select();

            expect(data).toEqual([]);
            expect(error).toBeNull();
        });
    });

    // Cleanup after all tests
    afterAll(async () => {
        if (testPersonId) {
            try {
                await authClient.from('people').delete().eq('id', testPersonId);
            } catch (error) {
                console.log('Cleanup error (expected if delete tests failed):', error);
            }
        }
    });
}); 