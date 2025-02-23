import { describe, it, expect, afterAll } from 'vitest';
import { BaseApiTest } from './base-api-test';
import type { Location, Event } from '@/types';

class LocationsApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Locations API Tests', () => {
            describe('CRUD Operations', () => {
                let testLocation: Location;

                afterAll(async () => {
                    if (testLocation?.id) {
                        await this.cleanupTestData('locations', testLocation.id);
                    }
                });

                it('should get all locations', async () => {
                    // Create two test locations
                    const location1Data = this.generateLocationData();
                    const location2Data = this.generateLocationData();

                    const { data: l1, error: error1 } = await this.getAuthenticatedClient()
                        .from('locations')
                        .insert([location1Data])
                        .select()
                        .single();

                    expect(error1).toBeNull();
                    expect(l1).toBeDefined();

                    const { data: l2, error: error2 } = await this.getAuthenticatedClient()
                        .from('locations')
                        .insert([location2Data])
                        .select()
                        .single();

                    expect(error2).toBeNull();
                    expect(l2).toBeDefined();

                    try {
                        const { data, error } = await this.getAuthenticatedClient()
                            .from('locations')
                            .select('*')
                            .order('name');

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(Array.isArray(data)).toBe(true);
                        expect(data!.length).toBeGreaterThanOrEqual(2);
                        expect(data!.some(l => l.id === l1!.id)).toBe(true);
                        expect(data!.some(l => l.id === l2!.id)).toBe(true);
                    } finally {
                        // Cleanup
                        if (l1?.id) await this.cleanupTestData('locations', l1.id);
                        if (l2?.id) await this.cleanupTestData('locations', l2.id);
                    }
                });

                it('should create a location with all fields', async () => {
                    const locationData = this.generateLocationData();
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('locations')
                        .insert([locationData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    testLocation = data;

                    // Validate all fields
                    expect(data.name).toBe(locationData.name);
                    expect(data.link_map).toBe(locationData.link_map);
                    expect(data.link).toBe(locationData.link);
                    expect(data.link_address).toBe(locationData.link_address);

                    // Validate timestamps and id
                    this.validateTimestamps(data);
                    this.validateIds(data);
                });

                it('should read a location by id', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('locations')
                        .select()
                        .eq('id', testLocation.id)
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.id).toBe(testLocation.id);
                });

                it('should update a location', async () => {
                    const updateData = {
                        name: 'Updated Location Name',
                        link_map: 'https://maps.test/updated',
                        link: 'https://test.com/updated',
                        link_address: 'Updated Address'
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('locations')
                        .update(updateData)
                        .eq('id', testLocation.id)
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data).toBeDefined();
                    expect(data.name).toBe(updateData.name);
                    expect(data.link_map).toBe(updateData.link_map);
                    expect(data.link).toBe(updateData.link);
                    expect(data.link_address).toBe(updateData.link_address);
                    expect(data.id).toBe(testLocation.id);
                });

                it('should delete a location', async () => {
                    const { error } = await this.getAuthenticatedClient()
                        .from('locations')
                        .delete()
                        .eq('id', testLocation.id);

                    expect(error).toBeNull();

                    // Verify deletion
                    const { data, error: readError } = await this.getAuthenticatedClient()
                        .from('locations')
                        .select()
                        .eq('id', testLocation.id)
                        .single();

                    expect(data).toBeNull();
                    expect(readError).toBeDefined();
                });
            });

            describe('Event Relationships', () => {
                let location: Location;
                let events: Event[];

                beforeAll(async () => {
                    location = await this.createTestLocation();
                    const section = await this.createTestSection();
                    events = await Promise.all([
                        this.createTestEvent(section.id, location.id),
                        this.createTestEvent(section.id, location.id),
                    ]);
                });

                afterAll(async () => {
                    await Promise.all([
                        ...events.map((e: Event) => this.cleanupTestData('events', e.id)),
                        this.cleanupTestData('locations', location.id),
                    ]);
                });

                it('should get location with related events', async () => {
                    const { data, error } = await this.getAuthenticatedClient()
                        .from('locations')
                        .select('*, events(*)')
                        .eq('id', location.id)
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

                it('should not delete location with related events', async () => {
                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('locations')
                            .delete()
                            .eq('id', location.id),
                        400
                    );
                });
            });

            describe('Validation', () => {
                it('should require name field', async () => {
                    const locationData = this.generateLocationData();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { name: _name, ...dataWithoutName } = locationData;

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('locations')
                            .insert([dataWithoutName])
                            .select()
                            .single(),
                        400
                    );
                });

                it('should validate URL formats', async () => {
                    const locationData = this.generateLocationData();
                    const invalidData = {
                        ...locationData,
                        link_map: 'invalid-url',
                        link: 'invalid-url'
                    };

                    await this.expectSupabaseError(
                        this.getAuthenticatedClient()
                            .from('locations')
                            .insert([invalidData])
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
                            .from('locations')
                            .select(),
                        401
                    );
                });

                it('should not allow anonymous create', async () => {
                    const locationData = this.generateLocationData();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('locations')
                            .insert([locationData])
                            .select()
                            .single(),
                        401
                    );
                });

                it('should not allow anonymous update', async () => {
                    const location = await this.createTestLocation();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('locations')
                            .update({ name: 'Updated Name' })
                            .eq('id', location.id),
                        401
                    );
                    await this.cleanupTestData('locations', location.id);
                });

                it('should not allow anonymous delete', async () => {
                    const location = await this.createTestLocation();
                    await this.expectSupabaseError(
                        this.getAnonymousClient()
                            .from('locations')
                            .delete()
                            .eq('id', location.id),
                        401
                    );
                    await this.cleanupTestData('locations', location.id);
                });
            });

            describe('Edge Cases', () => {
                it('should handle very long text fields', async () => {
                    const longText = 'a'.repeat(255);
                    const locationData = this.generateLocationData();
                    locationData.link_address = longText;
                    let createdId: number | undefined;

                    try {
                        const { data, error } = await this.getAuthenticatedClient()
                            .from('locations')
                            .insert([locationData])
                            .select()
                            .single();

                        expect(error).toBeNull();
                        expect(data).toBeDefined();
                        expect(data.link_address).toBe(longText);
                        createdId = data?.id;
                    } finally {
                        if (createdId) {
                            await this.cleanupTestData('locations', createdId);
                        }
                    }
                });

                it('should handle special characters in text fields', async () => {
                    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
                    const locationData = this.generateLocationData();
                    locationData.name += specialChars;
                    locationData.link_address += specialChars;

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('locations')
                        .insert([locationData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.name).toBe(locationData.name);
                    expect(data.link_address).toBe(locationData.link_address);

                    await this.cleanupTestData('locations', data.id);
                });

                it('should handle empty optional fields', async () => {
                    const locationData = {
                        name: `Test Location ${Date.now()}`
                    };

                    const { data, error } = await this.getAuthenticatedClient()
                        .from('locations')
                        .insert([locationData])
                        .select()
                        .single();

                    expect(error).toBeNull();
                    expect(data.link_map).toBeNull();
                    expect(data.link).toBeNull();
                    expect(data.link_address).toBeNull();

                    await this.cleanupTestData('locations', data.id);
                });
            });
        });
    }
}

// Run the tests
LocationsApiTest.runTests(); 