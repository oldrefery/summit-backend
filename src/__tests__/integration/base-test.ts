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

        // Verify that we're using the test database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase environment variables are not set');
        }

        // Verify this is the test database
        if (!supabaseUrl.includes('vupwomxxfqjmwtbptkfu')) {
            throw new Error('Tests must run against test database only');
        }

        // Create client with automatic session refresh
        this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false
            }
        });

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
    }

    static getAuthenticatedClient() {
        if (!this.supabase) {
            throw new Error('Supabase client is not initialized');
        }
        return this.supabase;
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
        // Эффективное создание тестовых данных с обработкой ошибок
        const { data: createdData, error } = await this.getAuthenticatedClient()
            .from(tableName)
            .insert([data])
            .select()
            .single();

        if (error) {
            console.error(`Failed to create test data in ${tableName}:`, error);
            throw error;
        }
        if (!createdData) throw new Error(`Failed to create test data in ${tableName}`);

        // Уменьшенная задержка для более быстрых тестов
        await delay(200);
        return createdData as T;
    }

    public static async cleanupTestData(
        tableName: string,
        id: string | number
    ) {
        if (!id) return;

        try {
            await this.getAuthenticatedClient()
                .from(tableName)
                .delete()
                .eq('id', id);

            // Уменьшенная задержка для более быстрых тестов
            await delay(200);
        } catch (error) {
            console.warn(`Failed to clean up test data in ${tableName}, id=${id}:`, error);
            // Не выбрасываем ошибку, чтобы процесс очистки мог продолжаться
        }
    }
}

// Setup and cleanup hooks
beforeAll(async () => {
    await BaseIntegrationTest.setupTestClient();
});

afterAll(async () => {
    await BaseIntegrationTest.cleanupTestData('', '');
}); 