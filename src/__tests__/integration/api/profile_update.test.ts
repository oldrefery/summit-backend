import { BaseApiTest } from './base-api-test';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

class ProfileUpdateApiTest extends BaseApiTest {
    static originalFlag: boolean | null = null;

    public static async runTests() {
        describe('Profile Update API Tests', () => {
            beforeAll(async () => {
                // Сохраняем исходное значение флага
                const { data: flagDataBefore } = await this.getAuthenticatedClient()
                    .from('admin_settings')
                    .select('value')
                    .eq('feature', 'profile_editing_enabled')
                    .single();
                ProfileUpdateApiTest.originalFlag = flagDataBefore?.value ?? true;
                // Включаем флаг для всех тестов
                await this.getAuthenticatedClient()
                    .from('admin_settings')
                    .update({ value: true })
                    .eq('feature', 'profile_editing_enabled');
            });

            afterAll(async () => {
                // Возвращаем исходное значение флага
                if (ProfileUpdateApiTest.originalFlag !== null) {
                    await this.getAuthenticatedClient()
                        .from('admin_settings')
                        .update({ value: ProfileUpdateApiTest.originalFlag })
                        .eq('feature', 'profile_editing_enabled');
                }
            });

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
                            user_id: person.id,
                            user_bio: newBio,
                            user_email: null,
                            user_mobile: null,
                            user_photo_url: null
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
                            user_id: person.id,
                            user_bio: null,
                            user_email: newEmail,
                            user_mobile: newPhone,
                            user_photo_url: null
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
                            user_id: person.id,
                            user_bio: null,
                            user_email: null,
                            user_mobile: null,
                            user_photo_url: newAvatarUrl
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
                            user_id: nonExistentId,
                            user_bio: 'This should fail',
                            user_email: null,
                            user_mobile: null,
                            user_photo_url: null
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
                            user_id: person.id,
                            user_bio: 'Updated bio for testing',
                            user_email: null,
                            user_mobile: null,
                            user_photo_url: null
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
                            user_id: person.id,
                            user_bio: 'This should fail',
                            user_email: null,
                            user_mobile: null,
                            user_photo_url: null
                        }),
                        401 // Expect Unauthorized error
                    );
                });

                it('should not allow profile update when feature flag is disabled', async () => {
                    // Сохраняем текущее значение флага
                    const { data: flagDataBefore, error: flagReadError } = await this.getAuthenticatedClient()
                        .from('admin_settings')
                        .select('value')
                        .eq('feature', 'profile_editing_enabled')
                        .single();
                    expect(flagReadError).toBeNull();
                    expect(flagDataBefore).not.toBeNull();
                    const originalFlag = flagDataBefore?.value;

                    // Отключаем флаг
                    const { error: flagUpdateError } = await this.getAuthenticatedClient()
                        .from('admin_settings')
                        .update({ value: false })
                        .eq('feature', 'profile_editing_enabled');
                    expect(flagUpdateError).toBeNull();

                    try {
                        // Создаём тестового пользователя
                        const { data: person } = await this.getAuthenticatedClient()
                            .from('people')
                            .insert([this.generatePersonData()])
                            .select()
                            .single();
                        expect(person).not.toBeNull();
                        if (!person) throw new Error('Failed to create test person');
                        this.trackTestRecord('people', person.id);

                        // Пытаемся обновить профиль
                        const { data, error } = await this.getAuthenticatedClient()
                            .rpc('update_profile_by_id', {
                                user_id: person.id,
                                user_bio: 'Should not update',
                                user_email: null,
                                user_mobile: null,
                                user_photo_url: null
                            });

                        expect(error).toBeNull();
                        expect(data).toBeTruthy();
                        expect(data.success).toBe(false);
                        expect(data.message).toContain('Profile editing is currently disabled by the administrator.');
                    } finally {
                        // Возвращаем флаг в исходное состояние
                        await this.getAuthenticatedClient()
                            .from('admin_settings')
                            .update({ value: originalFlag })
                            .eq('feature', 'profile_editing_enabled');
                    }
                });
            });
        });
    }
}

// Run the tests
ProfileUpdateApiTest.runTests(); 