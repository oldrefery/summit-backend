import { describe, it, expect, afterAll } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { Person, PersonRole } from '@/types';
import { PostgrestBuilder } from '@supabase/postgrest-js';

interface TestData {
    name: string;
    role: PersonRole;
    title?: string;
    company?: string;
    bio?: string;
    country?: string;
    email?: string;
    mobile?: string;
}

class PeopleApiTest extends BaseApiTest {
    private static async expectSupabaseError<T>(
        promise: PostgrestBuilder<T>,
        expectedStatus?: number
    ): Promise<void> {
        try {
            await promise;
            throw new Error('Expected error but got success');
        } catch (error) {
            if (expectedStatus && PeopleApiTest.isPostgrestError(error)) {
                expect(error.status).toBe(expectedStatus);
            }
        }
    }

    private static isPostgrestError(error: unknown): error is { status: number } {
        return (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            typeof (error as { status: number }).status === 'number'
        );
    }

    public static async runTests() {
        describe('People API Tests', () => {
            describe('CRUD Operations', () => {
                let testPerson: Person;

                afterAll(async () => {
                    if (testPerson?.id) {
                        await this.cleanupTestData('people', testPerson.id);
                    }
                });

                it('should get all people', async () => {
                    // Create two test persons
                    const person1Data = this.generatePersonData('speaker');
                    const person2Data = this.generatePersonData('attendee');

                    const { data: p1 } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([person1Data])
                        .select()
                        .single();

                    const { data: p2 } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([person2Data])
                        .select()
                        .single();

                    try {
                        const { data, error } = await this.getAuthenticatedClient()
                            .from('people')
                            .select('*')
                            .order('name');

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(Array.isArray(data)).toBe(true);
                        expect(data!.length).toBeGreaterThanOrEqual(2);
                        expect(data!.some(p => p.id === p1.id)).toBe(true);
                        expect(data!.some(p => p.id === p2.id)).toBe(true);
                    } finally {
                        // Cleanup
                        await this.cleanupTestData('people', p1.id);
                        await this.cleanupTestData('people', p2.id);
                    }
                });

                it('should not delete person with related event_people records', async () => {
                    // Create test person and event
                    const person = await this.createTestPerson('speaker');
                    const event = await this.createTestEvent();

                    // Assign person to event
                    await this.assignSpeakerToEvent(event.id, person.id);

                    try {
                        // Try to delete person
                        const { error } = await this.getAuthenticatedClient()
                            .from('people')
                            .delete()
                            .eq('id', person.id);

                        expect(error).toBeDefined();
                        expect(error!.message).toContain('violates foreign key constraint "event_people_person_id_fkey"');
                    } finally {
                        // Cleanup
                        await this.getAuthenticatedClient()
                            .from('event_people')
                            .delete()
                            .match({ event_id: event.id, person_id: person.id });
                        await this.cleanupTestData('events', event.id);
                        await this.cleanupTestData('people', person.id);
                    }
                });

                it('should not delete person with related announcements', async () => {
                    // Create test person and announcement
                    const person = await this.createTestPerson('speaker');
                    const announcementData = {
                        person_id: person.id,
                        content: `Test Announcement ${Date.now()}`,
                        published_at: new Date().toISOString()
                    };

                    const { data: announcement } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([announcementData])
                        .select()
                        .single();

                    try {
                        // Try to delete person
                        const { error } = await this.getAuthenticatedClient()
                            .from('people')
                            .delete()
                            .eq('id', person.id);

                        expect(error).toBeDefined();
                        expect(error!.message).toContain('violates foreign key constraint "announcements_person_id_fkey"');
                    } finally {
                        // Cleanup
                        await this.cleanupTestData('announcements', announcement.id);
                        await this.cleanupTestData('people', person.id);
                    }
                });

                it('should create a person with all fields', async () => {
                    const personData = this.generatePersonData('speaker');
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testPerson = data;

                    // Validate all fields
                    expect(data.name).toBe(personData.name);
                    expect(data.role).toBe(personData.role);
                    expect(data.title).toBe(personData.title);
                    expect(data.company).toBe(personData.company);
                    expect(data.bio).toBe(personData.bio);
                    expect(data.country).toBe(personData.country);
                    expect(data.email).toBe(personData.email);
                    expect(data.mobile).toBe(personData.mobile);

                    // Validate timestamps and id
                    this.validateTimestamps(data);
                    this.validateIds(data);
                });

                it('should read a person by id', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .select()
                        .eq('id', testPerson.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.id).toBe(testPerson.id);
                });

                it('should update a person', async () => {
                    // Create a test person first
                    const personData = this.generatePersonData('speaker');
                    const { data: createdPerson } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(createdPerson).toBeDefined();

                    const updateData = {
                        title: 'Updated Title',
                        company: 'Updated Company',
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .update(updateData)
                        .eq('id', createdPerson.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.title).toBe(updateData.title);
                    expect(data.company).toBe(updateData.company);
                    expect(data.id).toBe(createdPerson.id);

                    // Cleanup
                    await this.cleanupTestData('people', createdPerson.id);
                });

                it('should delete a person', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('people')
                        .delete()
                        .eq('id', testPerson.id);

                    expect(error).toBeNull();

                    // Verify deletion
                    const { data, error: readError } = await this.getAuthenticatedClient()
                        .from('people')
                        .select()
                        .eq('id', testPerson.id)
                        .single();

                    expect(data).toBeNull();
                    expect(readError).toBeDefined();
                });
            });

            describe('Role-based Operations', () => {
                it('should create a speaker', async () => {
                    const person = await this.createTestPerson('speaker');
                    expect(person.role).toBe('speaker');
                    await this.cleanupTestData('people', person.id);
                });

                it('should create an attendee', async () => {
                    const person = await this.createTestPerson('attendee');
                    expect(person.role).toBe('attendee');
                    await this.cleanupTestData('people', person.id);
                });
            });

            describe('Validation', () => {
                it('should require name field', async () => {
                    const personData = this.generatePersonData();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { name: _name, ...dataWithoutName } = personData;

                    await this.expectSupabaseError<TestData>(
                        this.getAuthenticatedClient()
                            .from('people')
                            .insert([dataWithoutName])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should require valid role', async () => {
                    const personData = this.generatePersonData();
                    const invalidData = {
                        ...personData,
                        role: 'invalid_role' as PersonRole
                    };

                    await this.expectSupabaseError<TestData>(
                        this.getAuthenticatedClient()
                            .from('people')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate email format', async () => {
                    const personData = this.generatePersonData();
                    personData.email = 'invalid_email';

                    await this.expectSupabaseError<TestData>(
                        this.getAuthenticatedClient()
                            .from('people')
                            .insert([personData])
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
                            .from('people')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const personData = this.generatePersonData();
                    await this.expectSupabaseError<TestData>(
                        this.getAnonymousClient()
                            .from('people')
                            .insert([personData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const person = await this.createTestPerson();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('people')
                            .update({ title: 'Updated Title' })
                            .eq('id', person.id),
                        401
                    );
                    await this.cleanupTestData('people', person.id);
                });

                it('should not allow anonymous delete', async () => {
                    const person = await this.createTestPerson();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('people')
                            .delete()
                            .eq('id', person.id),
                        401
                    );
                    await this.cleanupTestData('people', person.id);
                });
            });

            describe('Edge Cases', () => {
                it('should handle very long text fields', async () => {
                    const longText = 'a'.repeat(1000);
                    const person = await this.createTestPerson();

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .update({
                            bio: longText,
                            title: longText,
                        })
                        .eq('id', person.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.bio).toBe(longText);
                    expect(data.title).toBe(longText);

                    await this.cleanupTestData('people', person.id);
                });

                it('should handle special characters in text fields', async () => {
                    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
                    const personData = this.generatePersonData();
                    personData.name += specialChars;
                    personData.title += specialChars;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.name).toBe(personData.name);
                    expect(data.title).toBe(personData.title);

                    await this.cleanupTestData('people', data.id);
                });

                it('should handle empty optional fields', async () => {
                    const personData = {
                        name: `Test Person ${Date.now()}`,
                        role: 'speaker' as const,
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.title).toBeNull();
                    expect(data.company).toBeNull();
                    expect(data.bio).toBeNull();
                    expect(data.country).toBeNull();
                    expect(data.email).toBeNull();
                    expect(data.mobile).toBeNull();

                    await this.cleanupTestData('people', data.id);
                });
            });
        });
    }
}

// Run the tests
PeopleApiTest.runTests(); 