import { BaseApiTest } from './base-api-test';
import { delay } from '@/utils/test-utils';

class EventPeopleApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Event People API Tests', () => {
            describe('Validation', () => {
                it('should enforce unique event_id and person_id combination constraint', async () => {
                    try {
                        // Create and verify a test section first
                        let section = await this.createTestSection();
                        this.trackTestRecord('sections', section.id);

                        // Verify section exists
                        const sectionCheck = await this.getAuthenticatedClient()
                            .from('sections')
                            .select('id')
                            .eq('id', section.id)
                            .maybeSingle();

                        if (!sectionCheck.data) {
                            // Create a new section if verification failed
                            await delay(500);
                            section = await this.createTestSection();
                            this.trackTestRecord('sections', section.id);
                        }

                        // Create a test person
                        const person = await this.createTestPerson();
                        this.trackTestRecord('people', person.id);

                        // Create a test event with retry mechanism
                        let event;
                        let eventCreateAttempt = 0;
                        const maxEventAttempts = 3;

                        while (eventCreateAttempt < maxEventAttempts) {
                            eventCreateAttempt++;
                            try {
                                const eventData = this.generateEventData(section.id);
                                const { data, error } = await this.getAuthenticatedClient()
                                    .from('events')
                                    .insert([eventData])
                                    .select()
                                    .single();

                                if (error) {
                                    console.log(`Failed to create event (attempt ${eventCreateAttempt}):`, error);
                                    await delay(500);
                                    continue;
                                }

                                event = data;
                                this.trackTestRecord('events', event.id);
                                break;
                            } catch (err) {
                                console.log(`Error creating event (attempt ${eventCreateAttempt}):`, err);
                                await delay(500);
                            }
                        }

                        if (!event) {
                            throw new Error('Failed to create test event after multiple attempts');
                        }

                        // Create the first event-person link
                        const { data: firstLink, error: firstError } = await this.getAuthenticatedClient()
                            .from('event_people')
                            .insert({
                                event_id: event.id,
                                person_id: person.id,
                                role: 'speaker'
                            })
                            .select()
                            .single();

                        expect(firstError).toBeNull();
                        expect(firstLink).toBeDefined();
                        if (firstLink) this.trackTestRecord('event_people', firstLink.id);

                        // Try to create a duplicate link
                        await this.expectSupabaseError(
                            this.getAuthenticatedClient()
                                .from('event_people')
                                .insert({
                                    event_id: event.id,
                                    person_id: person.id,
                                    role: 'speaker'
                                })
                                .select()
                                .single()
                        );
                    } catch (error) {
                        console.error('Test error:', error);
                        throw error;
                    }
                });
            });
        });
    }
}

// Run the tests
EventPeopleApiTest.runTests(); 