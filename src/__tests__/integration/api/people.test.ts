import { describe, it, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { Person, PersonRole } from '@/types';

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
    public static async runTests() {
        describe('People API Tests', () => {
            describe('CRUD Operations', () => {
                let testPerson: Person;

                it('should get all people', async () => {
                    // Create two test people with unique data
                    const person1Data = this.generatePersonData('speaker');
                    const person2Data = this.generatePersonData('attendee');

                    const { data: p1, error: error1 } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([person1Data])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(p1).toBeDefined();
                    if (!p1) throw new Error('Failed to create first test person');
                    this.trackTestRecord('people', p1.id);

                    const { data: p2, error: error2 } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([person2Data])
                        .select()
                        .single();

                    expect(error2).toBeNull();
                    expect(p2).toBeDefined();
                    if (!p2) throw new Error('Failed to create second test person');
                    this.trackTestRecord('people', p2.id);

                    // Get all people
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .select('*')
                        .order('created_at', { ascending: false });

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(Array.isArray(data)).toBe(true);
                    expect(data!.length).toBeGreaterThanOrEqual(2);

                    // Verify both test records are present
                    const foundPerson1 = data!.find(p => p.id === p1.id);
                    const foundPerson2 = data!.find(p => p.id === p2.id);

                    expect(foundPerson1).toBeDefined();
                    expect(foundPerson2).toBeDefined();

                    // Verify data matches
                    expect(foundPerson1!.name).toBe(person1Data.name);
                    expect(foundPerson1!.role).toBe(person1Data.role);
                    expect(foundPerson2!.name).toBe(person2Data.name);
                    expect(foundPerson2!.role).toBe(person2Data.role);
                });

                it('should not delete person with related event_people records', async () => {
                    // Create test person and event
                    const person = await this.createTestPerson('speaker');
                    const event = await this.createTestEvent();

                    // Assign person to event
                    await this.assignSpeakerToEvent(event.id, person.id);

                    // Try to delete person
                    const { error } = await this.getAuthenticatedClient()
                        .from('people')
                        .delete()
                        .eq('id', person.id);

                    expect(error).toBeDefined();
                    expect(error!.message).toContain('violates foreign key constraint "event_people_person_id_fkey"');
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

                    if (announcement) this.trackTestRecord('announcements', announcement.id);

                    // Try to delete person
                    const { error } = await this.getAuthenticatedClient()
                        .from('people')
                        .delete()
                        .eq('id', person.id);

                    expect(error).toBeDefined();
                    expect(error!.message).toContain('violates foreign key constraint "announcements_person_id_fkey"');
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
                    if (data) this.trackTestRecord('people', data.id);

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
                    if (createdPerson) this.trackTestRecord('people', createdPerson.id);

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
                });

                it('should create an attendee', async () => {
                    const person = await this.createTestPerson('attendee');
                    expect(person.role).toBe('attendee');
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

                it('should not create people with duplicate email', async () => {
                    const personData = this.generatePersonData('speaker');
                    const email = `test.${Date.now()}@example.com`;
                    personData.email = email;

                    // Создаем первого человека
                    const { data: person1, error: error1 } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(person1).toBeDefined();
                    if (person1) this.trackTestRecord('people', person1.id);

                    // Пытаемся создать второго человека с тем же email
                    const person2Data = this.generatePersonData('attendee');
                    person2Data.email = email;

                    await this.expectSupabaseError<TestData>(
                        this.getAuthenticatedClient()
                            .from('people')
                            .insert([person2Data])
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
                });
            });

            describe('Edge Cases', () => {
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

                    if (data) this.trackTestRecord('people', data.id);
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

                    if (data) this.trackTestRecord('people', data.id);
                });
            });

            describe('Hidden Field', () => {
                it('should create a person with hidden field set to false by default', async () => {
                    const personData = this.generatePersonData('attendee');
                    delete personData.hidden; // Ensure hidden is not explicitly set

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).not.toBeNull();
                    if (data) this.trackTestRecord('people', data.id);

                    // Check default value is false
                    expect(data?.hidden).toBe(false);
                });

                it('should create a person with hidden field explicitly set', async () => {
                    const personData = this.generatePersonData('speaker');
                    personData.hidden = true;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).not.toBeNull();
                    if (data) this.trackTestRecord('people', data.id);

                    // Check explicit value is preserved
                    expect(data?.hidden).toBe(true);
                });

                it('should update a person\'s hidden field', async () => {
                    // Create a person first
                    const personData = this.generatePersonData('attendee');
                    personData.hidden = false;

                    const { data: createData, error: createError } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(createError).toBeNull();
                    expect(createData).not.toBeNull();
                    if (!createData) throw new Error('Failed to create test person');
                    this.trackTestRecord('people', createData.id);

                    // Update the hidden field
                    const { data: updateData, error: updateError } = await this.getAuthenticatedClient()
                        .from('people')
                        .update({ hidden: true })
                        .eq('id', createData.id)
                        .select()
                        .single();

                    expect(updateError).toBeNull();
                    expect(updateData).not.toBeNull();
                    expect(updateData?.hidden).toBe(true);
                });

                it('should include hidden field in published JSON data', async () => {
                    // Create a person with hidden = true
                    const personData = this.generatePersonData('attendee');
                    personData.hidden = true;

                    const { data: createData, error: createError } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([personData])
                        .select()
                        .single();

                    expect(createError).toBeNull();
                    if (!createData) throw new Error('Failed to create test person');
                    this.trackTestRecord('people', createData.id);

                    // Call publish_new_version to generate JSON
                    const { data: publishData, error: publishError } = await this.getAuthenticatedClient()
                        .rpc('publish_new_version');

                    expect(publishError).toBeNull();
                    expect(publishData).not.toBeNull();

                    // Find the person in the published data
                    const publishedPeople = publishData?.data?.data?.people || [];
                    const publishedPerson = publishedPeople.find((p: { id: string }) => p.id === createData.id);

                    expect(publishedPerson).toBeDefined();
                    expect(publishedPerson?.hidden).toBe(true);
                });
            });
        });
    }
}

// Run the tests
PeopleApiTest.runTests(); 