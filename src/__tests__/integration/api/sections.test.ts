import { BaseApiTest } from './base-api-test';
import type { Section, Event } from '@/types';
import { format, addDays } from 'date-fns';

class SectionsApiTest extends BaseApiTest {
    private static generateInvalidSectionData(): Partial<Section> {
        return {
            name: '', // Invalid empty name
            date: 'invalid-date', // Invalid date format
        };
    }

    public static async runTests() {
        describe('Sections API Tests', () => {
            describe('CRUD Operations', () => {
                let testSection: Section;

                it('should get all sections', async () => {
                    // Create two test sections
                    const section1Data = this.generateSectionData();
                    const section2Data = {
                        ...this.generateSectionData(),
                        date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
                    };

                    const { data: s1, error: error1 } = await this.getAuthenticatedClient()
                        .from('sections')
                        .insert([section1Data])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(s1).toBeDefined();
                    if (s1) this.trackTestRecord('sections', s1.id);

                    const { data: s2, error: error2 } = await this.getAuthenticatedClient()
                        .from('sections')
                        .insert([section2Data])
                        .select()
                        .single();

                    expect(error2).toBeNull();
                    expect(s2).toBeDefined();
                    if (s2) this.trackTestRecord('sections', s2.id);

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('sections')
                        .select('*')
                        .order('date');

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(Array.isArray(data)).toBe(true);
                    expect(data!.length).toBeGreaterThanOrEqual(2);
                    expect(data!.some(s => s.id === s1.id)).toBe(true);
                    expect(data!.some(s => s.id === s2.id)).toBe(true);
                });

                it('should create a section with all fields', async () => {
                    const sectionData = this.generateSectionData();
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('sections')
                        .insert([sectionData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testSection = data;
                    if (data) this.trackTestRecord('sections', data.id);

                    // Validate all fields
                    expect(data.name).toBe(sectionData.name);
                    expect(data.date).toBe(sectionData.date);

                    // Validate timestamps and id
                    this.validateTimestamps(data);
                    this.validateIds(data);
                });

                it('should read a section by id', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('sections')
                        .select()
                        .eq('id', testSection.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.id).toBe(testSection.id);
                });

                it('should update a section', async () => {
                    const updateData = {
                        name: 'Updated Section Name',
                        date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('sections')
                        .update(updateData)
                        .eq('id', testSection.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.name).toBe(updateData.name);
                    expect(data.date).toBe(updateData.date);
                    expect(data.id).toBe(testSection.id);
                });

                it('should delete a section', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('sections')
                        .delete()
                        .eq('id', testSection.id);

                    expect(error).toBeNull();

                    // Verify deletion
                    const { data, error: readError } = await this.getAuthenticatedClient()
                        .from('sections')
                        .select()
                        .eq('id', testSection.id)
                        .single();

                    expect(data).toBeNull();
                    expect(readError).toBeDefined();
                });
            });

            describe('Date Validation', () => {
                it('should not create a section with invalid date format', async () => {
                    const invalidData = this.generateInvalidSectionData();
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('sections')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should create sections with different dates', async () => {
                    const today = new Date();
                    const sections = await Promise.all([
                        this.createTestSection(today),
                        this.createTestSection(addDays(today, 1)),
                        this.createTestSection(addDays(today, 2))
                    ]);

                    // Verify all sections are created with different dates
                    const dates = sections.map(s => s.date);
                    const uniqueDates = new Set(dates);
                    expect(uniqueDates.size).toBe(sections.length);

                    // Verify dates are valid
                    dates.forEach(date => {
                        expect(() => new Date(date)).not.toThrow();
                    });
                });

                it('should not create sections with duplicate name and date', async () => {
                    const sectionData = this.generateSectionData();

                    // Создаем первую секцию
                    const { data: section1, error: error1 } = await this.getAuthenticatedClient()
                        .from('sections')
                        .insert([sectionData])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(section1).toBeDefined();
                    if (section1) this.trackTestRecord('sections', section1.id);

                    // Пытаемся создать вторую секцию с теми же данными
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('sections')
                            .insert([sectionData])
                            .select()
                            .single(),
                        400
                    );
                });
            });

            describe('Event Relationships', () => {
                let section: Section;
                let events: Event[];

                it('should get section with related events', async () => {
                    section = await this.createTestSection();
                    events = await Promise.all([
                        this.createTestEvent(section.id),
                        this.createTestEvent(section.id),
                    ]);

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('sections')
                        .select('*, events(*)')
                        .eq('id', section.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.events).toBeDefined();
                    expect(Array.isArray(data.events)).toBe(true);
                    expect(data.events.length).toBe(events.length);
                    expect(data.events.map((e: Event) => e.id)).toEqual(
                        expect.arrayContaining(events.map((e: Event) => e.id))
                    );
                });

                it('should not delete section with related events', async () => {
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('sections')
                            .delete()
                            .eq('id', section.id),
                        400
                    );
                });
            });

            describe('Error Handling', () => {
                it('should not create a section without required fields', async () => {
                    const invalidData = {};
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('sections')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should not create a section with empty name', async () => {
                    const invalidData = {
                        ...this.generateSectionData(),
                        name: '',
                    };
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('sections')
                            .insert([invalidData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should handle concurrent updates gracefully', async () => {
                    const section = await this.createTestSection();

                    // Attempt two concurrent updates
                    const updates = await Promise.allSettled([
                        this.getAuthenticatedClient()
                            .from('sections')
                            .update({ name: 'Update 1' })
                            .eq('id', section.id)
                            .select()
                            .single(),
                        this.getAuthenticatedClient()
                            .from('sections')
                            .update({ name: 'Update 2' })
                            .eq('id', section.id)
                            .select()
                            .single(),
                    ]);

                    // At least one update should succeed
                    expect(updates.some(r => r.status === 'fulfilled')).toBe(true);
                });
            });

            describe('Anonymous Access', () => {
                it('should not allow anonymous read', async () => {
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('sections')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const sectionData = this.generateSectionData();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('sections')
                            .insert([sectionData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const section = await this.createTestSection();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('sections')
                            .update({ name: 'Updated Name' })
                            .eq('id', section.id),
                        401
                    );
                });

                it('should not allow anonymous delete', async () => {
                    const section = await this.createTestSection();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('sections')
                            .delete()
                            .eq('id', section.id),
                        401
                    );
                });
            });
        });
    }
}

// Run the tests
SectionsApiTest.runTests(); 