import { describe, it, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { Event, Section, Location, Person } from '@/types';

class EventsApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Events API Tests', () => {
            describe('CRUD Operations', () => {
                describe('getAll()', () => {
                    it('should return empty list when no events exist', async () => {
                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .select(`
                                *,
                                location:locations(*),
                                section:sections(name),
                                event_people:event_people(
                                    person:people(*)
                                )
                            `);

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(Array.isArray(data)).toBe(true);
                    });

                    it('should return single event with related data', async () => {
                        // Create test data
                        const section = await this.createTestSection();
                        const location = await this.createTestLocation();
                        const speaker = await this.createTestPerson();

                        // Create event
                        const event = await this.createTestEvent(section.id, location.id);
                        await this.assignSpeakerToEvent(event.id, speaker.id);

                        // Get events
                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .select(`
                                *,
                                location:locations(*),
                                section:sections(name),
                                event_people:event_people(
                                    person:people(*)
                                )
                            `);

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(Array.isArray(data)).toBe(true);
                        expect(data!.length).toBeGreaterThan(0);

                        const foundEvent = data!.find(e => e.id === event.id);
                        expect(foundEvent).toBeDefined();
                        expect(foundEvent!.location).toBeDefined();
                        expect(foundEvent!.location!.id).toBe(location.id);
                        expect(foundEvent!.section).toBeDefined();
                        expect(foundEvent!.section!.name).toBe(section.name);
                        expect(foundEvent!.event_people).toBeDefined();
                        expect(foundEvent!.event_people!.length).toBe(1);
                        expect(foundEvent!.event_people![0].person!.id).toBe(speaker.id);
                    });

                    it('should return multiple events with related data', async () => {
                        // Create test data
                        const section = await this.createTestSection();
                        const location = await this.createTestLocation();

                        // Create events
                        const event1 = await this.createTestEvent(section.id, location.id);
                        const event2 = await this.createTestEvent(section.id, location.id);

                        // Get events
                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .select(`
                                *,
                                location:locations(*),
                                section:sections(name),
                                event_people:event_people(
                                    person:people(*)
                                )
                            `);

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(Array.isArray(data)).toBe(true);
                        expect(data!.length).toBeGreaterThanOrEqual(2);

                        const foundEvent1 = data!.find(e => e.id === event1.id);
                        const foundEvent2 = data!.find(e => e.id === event2.id);
                        expect(foundEvent1).toBeDefined();
                        expect(foundEvent2).toBeDefined();
                    });
                });

                describe('getById()', () => {
                    it('should return event with related data by id', async () => {
                        // Create test data
                        const section = await this.createTestSection();
                        const location = await this.createTestLocation();
                        const speaker = await this.createTestPerson();

                        // Create event
                        const event = await this.createTestEvent(section.id, location.id);
                        await this.assignSpeakerToEvent(event.id, speaker.id);

                        // Get event by id
                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .select(`
                                *,
                                location:locations(*),
                                section:sections(name),
                                event_people:event_people(
                                    person:people(*)
                                )
                            `)
                            .eq('id', event.id)
                            .single();

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(data!.id).toBe(event.id);
                        expect(data!.location!.id).toBe(location.id);
                        expect(data!.section!.name).toBe(section.name);
                        expect(data!.event_people!.length).toBe(1);
                        expect(data!.event_people![0].person!.id).toBe(speaker.id);
                    });

                    it('should return error for non-existent event id', async () => {
                        const nonExistentId = 999999;

                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .select()
                            .eq('id', nonExistentId)
                            .single();

                        expect(data).toBeNull();
                        expect(error).toBeDefined();
                    });
                });

                describe('create()', () => {
                    it('should create event with minimal fields', async () => {
                        const section = await this.createTestSection();
                        const eventData = this.generateEventData(section.id);

                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single();

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        if (data) this.trackTestRecord('events', data.id);

                        expect(data!.title).toBe(eventData.title);
                        expect(data!.section_id).toBe(section.id);
                        expect(data!.date).toBe(eventData.date);
                        expect(data!.start_time.replace('Z', '+00:00')).toBe(eventData.start_time);
                        expect(data!.end_time.replace('Z', '+00:00')).toBe(eventData.end_time);
                    });

                    it('should create event with all fields including location', async () => {
                        // Create test data
                        const section = await this.createTestSection();
                        const location = await this.createTestLocation();
                        const eventData = this.generateEventData(section.id, location.id);

                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single();

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        if (data) this.trackTestRecord('events', data.id);

                        expect(data!.location_id).toBe(location.id);
                        expect(data!.description).toBe(eventData.description);
                        expect(data!.duration).toBe(eventData.duration);
                        expect(data!.start_time.replace('Z', '+00:00')).toBe(eventData.start_time);
                        expect(data!.end_time.replace('Z', '+00:00')).toBe(eventData.end_time);
                    });

                    it('should create event with speakers', async () => {
                        const section = await this.createTestSection();
                        const speaker = await this.createTestPerson();

                        const { data: event } = await this.getAuthenticatedClient()
                            .from('events')
                            .insert([{
                                ...this.generateEventData(section.id)
                            }])
                            .select()
                            .single();

                        expect(event).toBeDefined();
                        if (event) this.trackTestRecord('events', event.id);

                        // Add speaker using event_people
                        const { error: speakerError } = await this.getAuthenticatedClient()
                            .from('event_people')
                            .insert({
                                event_id: event!.id,
                                person_id: speaker.id,
                                role: 'speaker'
                            });

                        expect(speakerError).toBeNull();

                        // Verify speaker was added
                        const { data: checkData } = await this.getAuthenticatedClient()
                            .from('events')
                            .select(`
                                *,
                                event_people:event_people(
                                    person:people(*)
                                )
                            `)
                            .eq('id', event!.id)
                            .single();

                        expect(checkData).toBeDefined();
                        expect(checkData!.event_people).toBeDefined();
                        expect(checkData!.event_people!.length).toBe(1);
                        expect(checkData!.event_people![0].person!.id).toBe(speaker.id);
                    });

                    it('should fail to create event with non-existent section', async () => {
                        const nonExistentSectionId = 999999;
                        const eventData = this.generateEventData(nonExistentSectionId);

                        await this.expectSupabaseError(
                            this.getAuthenticatedClient()
                                .from('events')
                                .insert([eventData])
                                .select()
                                .single()
                        );
                    });

                    it('should fail to create event with non-existent location', async () => {
                        const section = await this.createTestSection();
                        const nonExistentLocationId = 999999;
                        const eventData = this.generateEventData(section.id, nonExistentLocationId);

                        await this.expectSupabaseError(
                            this.getAuthenticatedClient()
                                .from('events')
                                .insert([eventData])
                                .select()
                                .single()
                        );
                    });

                    it('should fail to create event with non-existent speakers', async () => {
                        const section = await this.createTestSection();
                        const nonExistentSpeakerId = 999999;
                        const eventData = {
                            ...this.generateEventData(section.id),
                            speaker_ids: [nonExistentSpeakerId]
                        };

                        await this.expectSupabaseError(
                            this.getAuthenticatedClient()
                                .from('events')
                                .insert([eventData])
                                .select()
                                .single()
                        );
                    });
                });

                describe('update()', () => {
                    let testEvent: Event;
                    let testSection: Section;
                    let testLocation: Location;
                    let testSpeaker: Person;

                    beforeEach(async () => {
                        testSection = await this.createTestSection();
                        testLocation = await this.createTestLocation();
                        testSpeaker = await this.createTestPerson();
                        testEvent = await this.createTestEvent(testSection.id, testLocation.id);
                        await this.assignSpeakerToEvent(testEvent.id, testSpeaker.id);
                    });

                    it('should update basic event fields', async () => {
                        const updates = {
                            title: `Updated Event ${Date.now()}`,
                            description: `Updated Description ${Date.now()}`
                        };

                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .update(updates)
                            .eq('id', testEvent.id)
                            .select()
                            .single();

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(data!.title).toBe(updates.title);
                        expect(data!.description).toBe(updates.description);
                    });

                    it('should update event location', async () => {
                        const newLocation = await this.createTestLocation();
                        const updates = { location_id: newLocation.id };

                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .update(updates)
                            .eq('id', testEvent.id)
                            .select()
                            .single();

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(data!.location_id).toBe(newLocation.id);
                    });

                    it('should update event speakers', async () => {
                        const newSpeaker = await this.createTestPerson();

                        // First remove existing speaker
                        const { error: removeError } = await this.getAuthenticatedClient()
                            .from('event_people')
                            .delete()
                            .eq('event_id', testEvent.id);

                        expect(removeError).toBeNull();

                        // Then add new speaker
                        const { error: addError } = await this.getAuthenticatedClient()
                            .from('event_people')
                            .insert({
                                event_id: testEvent.id,
                                person_id: newSpeaker.id,
                                role: 'speaker'
                            });

                        expect(addError).toBeNull();

                        // Verify update
                        const { data, error } = await this.getAuthenticatedClient()
                            .from('events')
                            .select(`
                                *,
                                event_people:event_people(
                                    person:people(*)
                                )
                            `)
                            .eq('id', testEvent.id)
                            .single();

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(data!.event_people!.length).toBe(1);
                        expect(data!.event_people![0].person!.id).toBe(newSpeaker.id);
                    });

                    it('should fail to update non-existent event', async () => {
                        const nonExistentId = 999999;
                        const updates = { title: 'Updated Title' };

                        await this.expectSupabaseError(
                            this.getAuthenticatedClient()
                                .from('events')
                                .update(updates)
                                .eq('id', nonExistentId)
                                .select()
                                .single()
                        );
                    });
                });

                describe('delete()', () => {
                    it('should delete event', async () => {
                        const event = await this.createTestEvent();

                        const { error } = await this.getAuthenticatedClient()
                            .from('events')
                            .delete()
                            .eq('id', event.id);

                        expect(error).toBeNull();

                        // Verify deletion
                        const { data: checkData } = await this.getAuthenticatedClient()
                            .from('events')
                            .select()
                            .eq('id', event.id);

                        expect(checkData).toHaveLength(0);
                    });

                    it('should delete event and cleanup related event_people', async () => {
                        const event = await this.createTestEvent();
                        const speaker = await this.createTestPerson();
                        await this.assignSpeakerToEvent(event.id, speaker.id);

                        const { error } = await this.getAuthenticatedClient()
                            .from('events')
                            .delete()
                            .eq('id', event.id);

                        expect(error).toBeNull();

                        // Verify event_people cleanup
                        const { data: checkData } = await this.getAuthenticatedClient()
                            .from('event_people')
                            .select()
                            .eq('event_id', event.id);

                        expect(checkData).toHaveLength(0);
                    });

                    it('should handle deletion of non-existent event', async () => {
                        const nonExistentId = 999999;

                        const { error } = await this.getAuthenticatedClient()
                            .from('events')
                            .delete()
                            .eq('id', nonExistentId);

                        expect(error).toBeNull(); // Supabase не возвращает ошибку при удалении несуществующей записи
                    });
                });
            });
        });
    }
}

// Run the tests
EventsApiTest.runTests(); 