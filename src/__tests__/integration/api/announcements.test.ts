import { describe, it, expect, beforeAll } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { Announcement, Person } from '@/types';

class AnnouncementsApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Announcements API Tests', () => {
            describe('CRUD Operations', () => {
                let testAnnouncement: Announcement;
                let testPerson: Person;

                beforeAll(async () => {
                    testPerson = await this.createTestPerson();
                });

                it('should get all announcements', async () => {
                    // Create two test announcements
                    const announcement1Data = this.generateAnnouncementData(testPerson.id);
                    const announcement2Data = this.generateAnnouncementData(testPerson.id);

                    const { data: a1, error: error1 } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([announcement1Data])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(a1).toBeDefined();
                    if (a1) this.trackTestRecord('announcements', a1.id);

                    const { data: a2, error: error2 } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([announcement2Data])
                        .select()
                        .single();

                    expect(error2).toBeNull();
                    expect(a2).toBeDefined();
                    if (a2) this.trackTestRecord('announcements', a2.id);

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .select('*')
                        .order('published_at');

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(Array.isArray(data)).toBe(true);
                    expect(data!.length).toBeGreaterThanOrEqual(2);
                    expect(data!.some(a => a.id === a1!.id)).toBe(true);
                    expect(data!.some(a => a.id === a2!.id)).toBe(true);
                });

                it('should create an announcement with all fields', async () => {
                    const announcementData = this.generateAnnouncementData(testPerson.id);
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([announcementData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testAnnouncement = data;
                    if (data) this.trackTestRecord('announcements', data.id);

                    // Validate all fields
                    expect(data.person_id).toBe(announcementData.person_id);
                    expect(data.content).toBe(announcementData.content);
                    expect(data.published_at).toBeDefined();
                    expect(announcementData.published_at).toBeDefined();
                    expect(Date.parse(data.published_at!)).toBe(Date.parse(announcementData.published_at!));

                    // Validate timestamps and id
                    this.validateTimestamps(data);
                    this.validateIds(data);
                });

                it('should read an announcement by id', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .select()
                        .eq('id', testAnnouncement.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.id).toBe(testAnnouncement.id);
                });

                it('should update an announcement', async () => {
                    const updateData = {
                        content: `Updated Content ${Date.now()}`,
                        published_at: new Date().toISOString()
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .update(updateData)
                        .eq('id', testAnnouncement.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.content).toBe(updateData.content);
                    expect(data.published_at).toBeDefined();
                    expect(updateData.published_at).toBeDefined();
                    expect(Date.parse(data.published_at!)).toBe(Date.parse(updateData.published_at!));
                    expect(data.id).toBe(testAnnouncement.id);
                });

                it('should delete an announcement', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .delete()
                        .eq('id', testAnnouncement.id);

                    expect(error).toBeNull();

                    // Verify deletion
                    const { data, error: readError } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .select()
                        .eq('id', testAnnouncement.id)
                        .single();

                    expect(data).toBeNull();
                    expect(readError).toBeDefined();
                });
            });

            describe('Validation', () => {
                let testPerson: Person;

                beforeAll(async () => {
                    testPerson = await this.createTestPerson();
                });

                it('should require person_id field', async () => {
                    const announcementData = this.generateAnnouncementData();
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('announcements')
                            .insert([announcementData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should require content field', async () => {
                    const announcementData = this.generateAnnouncementData(testPerson.id);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { content: _content, ...dataWithoutContent } = announcementData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('announcements')
                            .insert([dataWithoutContent])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should require published_at field', async () => {
                    const announcementData = this.generateAnnouncementData(testPerson.id);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { published_at: _publishedAt, ...dataWithoutPublishedAt } = announcementData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('announcements')
                            .insert([dataWithoutPublishedAt])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate published_at date format', async () => {
                    const announcementData = this.generateAnnouncementData(testPerson.id);
                    const invalidData = {
                        ...announcementData,
                        published_at: 'invalid-date'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('announcements')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });
            });

            describe('Person Relationships', () => {
                it('should get announcements with person details', async () => {
                    const person = await this.createTestPerson();
                    const announcement = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([this.generateAnnouncementData(person.id)])
                        .select('*, person:people(*)')
                        .single();

                    expect(announcement.error).toBeNull();
                    expect(announcement.data).toBeDefined();
                    expect(announcement.data.person).toBeDefined();
                    expect(announcement.data.person.id).toBe(person.id);
                    expect(announcement.data.person.name).toBe(person.name);

                    if (announcement.data) this.trackTestRecord('announcements', announcement.data.id);
                });

                it('should not create announcement with non-existent person_id', async () => {
                    const nonExistentPersonId = 999999;
                    const announcementData = this.generateAnnouncementData(nonExistentPersonId);

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('announcements')
                            .insert([announcementData])
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
                            .from('announcements')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const person = await this.createTestPerson();
                    const announcementData = this.generateAnnouncementData(person.id);
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('announcements')
                            .insert([announcementData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const person = await this.createTestPerson();
                    const { data: announcement } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([this.generateAnnouncementData(person.id)])
                        .select()
                        .single();

                    if (announcement) this.trackTestRecord('announcements', announcement.id);

                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('announcements')
                            .update({ content: 'Updated Content' })
                            .eq('id', announcement.id),
                        401
                    );
                });

                it('should not allow anonymous delete', async () => {
                    const person = await this.createTestPerson();
                    const { data: announcement } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([this.generateAnnouncementData(person.id)])
                        .select()
                        .single();

                    if (announcement) this.trackTestRecord('announcements', announcement.id);

                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('announcements')
                            .delete()
                            .eq('id', announcement.id),
                        401
                    );
                });
            });

            describe('Edge Cases', () => {
                let testPerson: Person;

                beforeAll(async () => {
                    testPerson = await this.createTestPerson();
                });

                it('should handle very long content', async () => {
                    const longContent = 'a'.repeat(1000);
                    const announcementData = this.generateAnnouncementData(testPerson.id);
                    announcementData.content = longContent;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([announcementData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.content).toBe(longContent);
                    if (data) this.trackTestRecord('announcements', data.id);
                });

                it('should handle special characters in content', async () => {
                    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
                    const announcementData = this.generateAnnouncementData(testPerson.id);
                    announcementData.content += specialChars;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([announcementData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.content).toBe(announcementData.content);
                    if (data) this.trackTestRecord('announcements', data.id);
                });

                it('should handle future dates', async () => {
                    const futureDate = new Date();
                    futureDate.setFullYear(futureDate.getFullYear() + 1);

                    const announcementData = this.generateAnnouncementData(testPerson.id);
                    announcementData.published_at = futureDate.toISOString();

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('announcements')
                        .insert([announcementData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.published_at).toBeDefined();
                    expect(announcementData.published_at).toBeDefined();
                    expect(Date.parse(data.published_at!)).toBe(Date.parse(announcementData.published_at!));
                    if (data) this.trackTestRecord('announcements', data.id);
                });
            });
        });
    }
}

// Run the tests
AnnouncementsApiTest.runTests(); 