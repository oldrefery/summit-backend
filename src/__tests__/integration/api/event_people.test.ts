import { BaseApiTest } from './base-api-test';

class EventPeopleApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Event People API Tests', () => {
            describe('Validation', () => {
                it('should enforce unique event_id and person_id combination constraint', async () => {
                    // Создаем тестового человека
                    const person = await this.createTestPerson();

                    // Создаем тестовое событие
                    const event = await this.createTestEvent();

                    // Создаем первую связь
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

                    // Пытаемся создать дублирующую связь
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
                });
            });
        });
    }
}

// Run the tests
EventPeopleApiTest.runTests(); 