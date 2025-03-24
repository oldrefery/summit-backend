import { BaseApiTest } from './base-api-test';
import { describe, it, expect } from 'vitest';

class ProfileUpdateApiTest extends BaseApiTest {
    public static async runTests() {
        describe('Profile Update API Tests', () => {
            describe('update_profile_by_id RPC', () => {
                it('should update a person\'s bio by ID', async () => {
                    // Create a test person
                    const { data: person } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([this.generatePersonData()])
                        .select()
                        .single();

                    expect(person).not.toBeNull();
                    if (!person) throw new Error('Failed to create test person');
                    this.trackTestRecord('people', person.id);

                    const newBio = 'Updated bio via profile update RPC';

                    // Call RPC function to update bio
                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('update_profile_by_id', {
                            person_id: person.id,
                            bio: newBio,
                            email: null,
                            mobile: null,
                            photo_url: null
                        });

                    expect(error).toBeNull();
                    expect(data).toBeTruthy();

                    // Verify the person was updated in the database
                    const { data: updatedPerson } = await this.getAuthenticatedClient()
                        .from('people')
                        .select('*')
                        .eq('id', person.id)
                        .single();

                    expect(updatedPerson).not.toBeNull();
                    expect(updatedPerson?.bio).toBe(newBio);
                });

                it('should update a person\'s email and phone by ID', async () => {
                    // Create a test person
                    const { data: person } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([this.generatePersonData()])
                        .select()
                        .single();

                    expect(person).not.toBeNull();
                    if (!person) throw new Error('Failed to create test person');
                    this.trackTestRecord('people', person.id);

                    const newEmail = 'updated.email@example.com';
                    const newPhone = '+1234567890';

                    // Call RPC function to update email and phone
                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('update_profile_by_id', {
                            person_id: person.id,
                            bio: null,
                            email: newEmail,
                            mobile: newPhone,
                            photo_url: null
                        });

                    expect(error).toBeNull();
                    expect(data).toBeTruthy();

                    // Verify the person was updated in the database
                    const { data: updatedPerson } = await this.getAuthenticatedClient()
                        .from('people')
                        .select('*')
                        .eq('id', person.id)
                        .single();

                    expect(updatedPerson).not.toBeNull();
                    expect(updatedPerson?.email).toBe(newEmail);
                    expect(updatedPerson?.mobile).toBe(newPhone);
                });

                it('should update a person\'s avatar URL by ID', async () => {
                    // Create a test person
                    const { data: person } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([this.generatePersonData()])
                        .select()
                        .single();

                    expect(person).not.toBeNull();
                    if (!person) throw new Error('Failed to create test person');
                    this.trackTestRecord('people', person.id);

                    const newAvatarUrl = 'https://example.com/new-avatar.jpg';

                    // Call RPC function to update avatar URL
                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('update_profile_by_id', {
                            person_id: person.id,
                            bio: null,
                            email: null,
                            mobile: null,
                            photo_url: newAvatarUrl
                        });

                    expect(error).toBeNull();
                    expect(data).toBeTruthy();

                    // Verify the person was updated in the database
                    const { data: updatedPerson } = await this.getAuthenticatedClient()
                        .from('people')
                        .select('*')
                        .eq('id', person.id)
                        .single();

                    expect(updatedPerson).not.toBeNull();
                    expect(updatedPerson?.photo_url).toBe(newAvatarUrl);
                });

                it('should handle non-existent person ID', async () => {
                    const nonExistentId = 99999;

                    // Try to update non-existent person
                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('update_profile_by_id', {
                            person_id: nonExistentId,
                            bio: 'This should fail',
                            email: null,
                            mobile: null,
                            photo_url: null
                        });

                    // Check that there's no error but operation was successful
                    expect(error).toBeNull();

                    // Check the data object structure
                    expect(data).toBeTruthy();
                    expect(data.success).toBe(false);
                    expect(data.message).toContain('not found');
                });

                it('should update a profile and return success', async () => {
                    // Create a test person first
                    const { data: person } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([this.generatePersonData()])
                        .select()
                        .single();

                    expect(person).not.toBeNull();
                    if (!person) throw new Error('Failed to create test person');
                    this.trackTestRecord('people', person.id);

                    // Update the person's profile
                    const { data, error } = await this.getAuthenticatedClient()
                        .rpc('update_profile_by_id', {
                            person_id: person.id,
                            bio: 'Updated bio for testing',
                            email: null,
                            mobile: null,
                            photo_url: null
                        });

                    // Check request success
                    expect(error).toBeNull();
                    expect(data).toBeTruthy();
                    expect(data.success).toBe(true);
                    expect(data.message).toContain('updated successfully');

                    // Check that changes were applied
                    const { data: updatedPerson } = await this.getAuthenticatedClient()
                        .from('people')
                        .select('bio')
                        .eq('id', person.id)
                        .single();

                    expect(updatedPerson).not.toBeNull();
                    expect(updatedPerson?.bio).toBe('Updated bio for testing');
                });

                it('should not allow anonymous users to update profiles', async () => {
                    // Create a test person first using authenticated client
                    const { data: person } = await this.getAuthenticatedClient()
                        .from('people')
                        .insert([this.generatePersonData()])
                        .select()
                        .single();

                    expect(person).not.toBeNull();
                    if (!person) throw new Error('Failed to create test person');
                    this.trackTestRecord('people', person.id);

                    // Try to update with anonymous client
                    await this.expectSupabaseError(
                        this.getAnonymousClient().rpc('update_profile_by_id', {
                            person_id: person.id,
                            bio: 'This should fail',
                            email: null,
                            mobile: null,
                            photo_url: null
                        }),
                        401 // Expect Unauthorized error
                    );
                });
            });
        });
    }
}

// Run the tests
ProfileUpdateApiTest.runTests(); 