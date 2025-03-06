import { describe, it, expect } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { Event, Section, Location, Person } from '@/types';
import { format } from 'date-fns';

class EventsApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Events API Tests', () => {
            beforeEach(async () => {
                await this.cleanup();
            });

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
                        this.trackTestRecord('sections', section.id);

                        const location = await this.createTestLocation();
                        this.trackTestRecord('locations', location.id);

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

            describe('Validation', () => {
                it('should require section_id field', async () => {
                    const date = format(new Date(), 'yyyy-MM-dd');
                    const eventData = {
                        title: `Test Event ${Date.now()}`,
                        date,
                        start_time: `${date}T09:00:00+00:00`,
                        end_time: `${date}T10:00:00+00:00`,
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should require title field', async () => {
                    const section = await this.createTestSection();
                    const eventData = this.generateEventData(section.id);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { title: _title, ...dataWithoutTitle } = eventData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([dataWithoutTitle])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate date format', async () => {
                    const section = await this.createTestSection();
                    const eventData = {
                        ...this.generateEventData(section.id),
                        date: 'invalid-date'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate time format', async () => {
                    const section = await this.createTestSection();
                    const eventData = {
                        ...this.generateEventData(section.id),
                        start_time: 'invalid-time',
                        end_time: 'invalid-time'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate end_time is after start_time', async () => {
                    const section = await this.createTestSection();
                    const date = format(new Date(), 'yyyy-MM-dd');
                    const eventData = {
                        ...this.generateEventData(section.id),
                        start_time: `${date}T10:00:00+00:00`,
                        end_time: `${date}T09:00:00+00:00` // Конец раньше начала
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate duration format', async () => {
                    const section = await this.createTestSection();
                    const eventData = {
                        ...this.generateEventData(section.id),
                        duration: 'invalid-duration'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should not allow events with overlapping times in same location', async () => {
                    const section = await this.createTestSection();
                    const location = await this.createTestLocation();
                    const date = format(new Date(), 'yyyy-MM-dd');

                    // Создаем первое событие
                    const event1Data = {
                        ...this.generateEventData(section.id, location.id),
                        start_time: `${date}T09:00:00+00:00`,
                        end_time: `${date}T10:00:00+00:00`
                    };

                    const { data: event1 } = await this.getAuthenticatedClient()
                        .from('events')
                        .insert([event1Data])
                        .select()
                        .single();

                    expect(event1).toBeDefined();
                    if (event1) this.trackTestRecord('events', event1.id);

                    // Пытаемся создать второе событие с пересекающимся временем
                    const event2Data = {
                        ...this.generateEventData(section.id, location.id),
                        start_time: `${date}T09:30:00+00:00`, // Пересекается с первым событием
                        end_time: `${date}T10:30:00+00:00`
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([event2Data])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate section exists', async () => {
                    const nonExistentSectionId = 999999;
                    const eventData = this.generateEventData(nonExistentSectionId);

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate location exists when provided', async () => {
                    const section = await this.createTestSection();
                    const nonExistentLocationId = 999999;
                    const eventData = this.generateEventData(section.id, nonExistentLocationId);

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        400
                    );
                });
            });

            describe('Error Handling', () => {
                it('should handle concurrent modifications gracefully', async () => {
                    const event = await this.createTestEvent();

                    // Попытка одновременного обновления
                    const updates1 = { title: `Updated Title 1 ${Date.now()}` };
                    const updates2 = { title: `Updated Title 2 ${Date.now()}` };

                    const [{ error: error1 }, { error: error2 }] = await Promise.all([
                        this.getAuthenticatedClient()
                            .from('events')
                            .update(updates1)
                            .eq('id', event.id),
                        this.getAuthenticatedClient()
                            .from('events')
                            .update(updates2)
                            .eq('id', event.id)
                    ]);

                    // Одно из обновлений должно пройти успешно
                    expect(error1 === null || error2 === null).toBe(true);
                });

                it('should handle invalid date combinations', async () => {
                    const section = await this.createTestSection();
                    const date = format(new Date(), 'yyyy-MM-dd');

                    // Попытка создать событие с датой, не соответствующей времени
                    const eventData = {
                        ...this.generateEventData(section.id),
                        date: date,
                        start_time: `${format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')}T09:00:00+00:00`,
                        end_time: `${format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')}T10:00:00+00:00`
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should handle invalid section changes', async () => {
                    const event = await this.createTestEvent();
                    const nonExistentSectionId = 999999;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('events')
                            .update({ section_id: nonExistentSectionId })
                            .eq('id', event.id)
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
                            .from('events')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const section = await this.createTestSection();
                    const eventData = this.generateEventData(section.id);

                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('events')
                            .insert([eventData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const event = await this.createTestEvent();

                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('events')
                            .update({ title: 'Updated Title' })
                            .eq('id', event.id),
                        401
                    );
                });

                it('should not allow anonymous delete', async () => {
                    const event = await this.createTestEvent();

                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('events')
                            .delete()
                            .eq('id', event.id),
                        401
                    );
                });
            });

            describe('Integration Scenarios', () => {
                it('should handle section deletion constraints', async () => {
                    const section = await this.createTestSection();
                    await this.createTestEvent(section.id);

                    // Попытка удалить секцию с существующими событиями
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('sections')
                            .delete()
                            .eq('id', section.id),
                        400
                    );
                });

                it('should handle location deletion constraints', async () => {
                    const section = await this.createTestSection();
                    const location = await this.createTestLocation();
                    await this.createTestEvent(section.id, location.id);

                    // Попытка удалить локацию с существующими событиями
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('locations')
                            .delete()
                            .eq('id', location.id),
                        400
                    );
                });

                it('should handle speaker deletion constraints', async () => {
                    const event = await this.createTestEvent();
                    const speaker = await this.createTestPerson('speaker');
                    await this.assignSpeakerToEvent(event.id, speaker.id);

                    // Попытка удалить спикера, привязанного к событию
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('people')
                            .delete()
                            .eq('id', speaker.id),
                        400
                    );
                });

                it('should cascade delete event_people on event deletion', async () => {
                    const event = await this.createTestEvent();
                    const speaker = await this.createTestPerson('speaker');
                    const eventPerson = await this.assignSpeakerToEvent(event.id, speaker.id);

                    // Удаляем событие
                    await this.getAuthenticatedClient()
                        .from('events')
                        .delete()
                        .eq('id', event.id);

                    // Проверяем, что связь event_people тоже удалена
                    const { data: checkData } = await this.getAuthenticatedClient()
                        .from('event_people')
                        .select()
                        .eq('id', eventPerson.id);

                    expect(checkData).toHaveLength(0);
                });

                it('should handle complex event updates with speakers and location', async () => {
                    // Создаем начальные данные
                    const section = await this.createTestSection();
                    const location1 = await this.createTestLocation();
                    const location2 = await this.createTestLocation();
                    const speaker1 = await this.createTestPerson('speaker');
                    const speaker2 = await this.createTestPerson('speaker');

                    // Создаем событие с первой локацией и первым спикером
                    const event = await this.createTestEvent(section.id, location1.id);
                    await this.assignSpeakerToEvent(event.id, speaker1.id);

                    // Обновляем событие: меняем локацию и спикера
                    const { data: updatedEvent, error: updateError } = await this.getAuthenticatedClient()
                        .from('events')
                        .update({ location_id: location2.id })
                        .eq('id', event.id)
                        .select()
                        .single();

                    expect(updateError).toBeNull();
                    expect(updatedEvent).toBeDefined();
                    expect(updatedEvent!.location_id).toBe(location2.id);

                    // Обновляем спикера
                    const { error: removeError } = await this.getAuthenticatedClient()
                        .from('event_people')
                        .delete()
                        .eq('event_id', event.id);

                    expect(removeError).toBeNull();

                    const { error: addError } = await this.getAuthenticatedClient()
                        .from('event_people')
                        .insert({
                            event_id: event.id,
                            person_id: speaker2.id,
                            role: 'speaker'
                        });

                    expect(addError).toBeNull();

                    // Проверяем финальное состояние
                    const { data: finalEvent } = await this.getAuthenticatedClient()
                        .from('events')
                        .select(`
                            *,
                            location:locations(*),
                            event_people:event_people(
                                person:people(*)
                            )
                        `)
                        .eq('id', event.id)
                        .single();

                    expect(finalEvent).toBeDefined();
                    expect(finalEvent!.location!.id).toBe(location2.id);
                    expect(finalEvent!.event_people![0].person!.id).toBe(speaker2.id);
                });
            });
        });
    }
}

// Run the tests
EventsApiTest.runTests(); 