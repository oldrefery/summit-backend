import { beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { delay } from '../../utils/test-utils';

export class BaseIntegrationTest {
    protected static supabase: SupabaseClient;
    public static userId: string;
    protected static sessionToken: string;
    private static isSetup = false;

    static async setupTestClient() {
        if (this.isSetup) {
            return;
        }

        // Create a new Supabase client
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Sign in with test user
        const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
            email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
            password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
        });

        if (signInError) throw signInError;
        if (!signInData.session) throw new Error('No session');

        this.userId = signInData.user.id;
        this.sessionToken = signInData.session.access_token;
        this.isSetup = true;

        // Wait for auth to be ready
        await delay(2000);
    }

    static async cleanupTestClient() {
        if (this.supabase && this.isSetup) {
            await this.supabase.auth.signOut();
            this.isSetup = false;
            await delay(2000);
        }
    }

    static getAuthenticatedClient() {
        if (!this.sessionToken) {
            throw new Error('No session token available. Make sure setupTestClient was called');
        }

        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${this.sessionToken}`,
                    },
                },
            }
        );
    }

    static getAnonymousClient() {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    public static async initializeTestData<T>(
        tableName: string,
        data: Partial<T>
    ): Promise<T> {
        const { data: createdData, error } = await this.getAuthenticatedClient()
            .from(tableName)
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        if (!createdData) throw new Error(`Failed to create test data in ${tableName}`);

        await delay(1000);
        return createdData as T;
    }

    public static async cleanupTestData(
        tableName: string,
        id: string | number
    ) {
        if (!id) return;

        await this.getAuthenticatedClient()
            .from(tableName)
            .delete()
            .eq('id', id);

        await delay(1000);
    }
}

// Setup and cleanup hooks
beforeAll(async () => {
    await BaseIntegrationTest.setupTestClient();
});

afterAll(async () => {
    await BaseIntegrationTest.cleanupTestClient();
}); 