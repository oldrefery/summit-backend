import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { BaseEntity } from '@/types';

/**
 * Базовый интерфейс для тестовых данных
 */
interface TestData extends BaseEntity {
    name?: string;
    date?: string;
    title?: string;
    content?: string;
    description?: string;
    link?: string;
    user_id?: string;
    role?: string;
    company?: string | null;
    bio?: string | null;
    photo_url?: string | null;
    country?: string | null;
    email?: string | null;
    mobile?: string | null;
    section_id?: number;
    start_time?: string;
    end_time?: string;
    duration?: string | null;
    location_id?: number | null;
    event_id?: number;
    person_id?: number;
    link_map?: string | null;
    link_address?: string | null;
    is_route?: boolean;
    published_at?: string;
    author_id?: number;
    timestamp?: string;
    image_urls?: string[];
    updated_at?: string;
    slug?: string;
    published?: boolean;
}

/**
 * Опции для CRUD тестов
 */
interface CrudTestOptions<T extends TestData> {
    /** Название таблицы */
    tableName: string;
    /** Тестовые данные для создания записи */
    testData: Omit<T, 'id' | 'created_at'>;
    /** Данные для обновления записи */
    updateData: Partial<T>;
    /** Дополнительные проверки для созданной записи */
    additionalCreateChecks?: (data: T) => void;
    /** Дополнительные проверки для обновленной записи */
    additionalUpdateChecks?: (data: T) => void;
    /** Функция для очистки связанных данных */
    cleanup?: () => Promise<void>;
}

/**
 * Базовый класс для CRUD тестов
 */
export class BaseCrudTest<T extends TestData> {
    protected supabase: SupabaseClient;
    protected options: CrudTestOptions<T>;
    protected createdId: number | null = null;

    constructor(options: CrudTestOptions<T>) {
        this.options = options;
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    /**
     * Запускает все CRUD тесты
     */
    public runTests() {
        describe(`${this.options.tableName} CRUD Operations`, () => {
            // Подготовка перед всеми тестами
            beforeAll(async () => {
                await this.supabase.auth.signOut();
                const { data: { session } } = await this.supabase.auth.getSession();
                expect(session).toBeNull();
            });

            // Очистка после всех тестов
            afterAll(async () => {
                // Логинимся для очистки
                await this.supabase.auth.signInWithPassword({
                    email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
                    password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
                });

                if (this.createdId) {
                    await this.supabase
                        .from(this.options.tableName)
                        .delete()
                        .eq('id', this.createdId);
                }

                if (this.options.cleanup) {
                    await this.options.cleanup();
                }

                await this.supabase.auth.signOut();
            });

            // Тесты для неаутентифицированного пользователя
            this.testAnonymousAccess();

            // Тесты для аутентифицированного пользователя
            this.testAuthenticatedAccess();
        });
    }

    /**
     * Тесты для неаутентифицированного пользователя
     */
    private testAnonymousAccess() {
        describe('Anonymous Access', () => {
            test('cannot create records', async () => {
                const { data, error } = await this.supabase
                    .from(this.options.tableName)
                    .insert([this.options.testData])
                    .select()
                    .single();

                expect(error).not.toBeNull();
                expect(error?.message).toMatch(/(permission denied|violates row-level security|JSON object requested, multiple \(or no\) rows returned)/);
                expect(data).toBeNull();
            });

            test('cannot read records', async () => {
                const { data, error } = await this.supabase
                    .from(this.options.tableName)
                    .select('*');

                expect(data).toEqual([]);
                expect(error).toBeNull();
            });

            test('cannot update records', async () => {
                const { data, error } = await this.supabase
                    .from(this.options.tableName)
                    .update(this.options.updateData)
                    .eq('id', 1) // Используем фиктивный ID
                    .select()
                    .single();

                expect(error).not.toBeNull();
                expect(error?.message).toMatch(/(permission denied|violates row-level security|JSON object requested, multiple \(or no\) rows returned)/);
                expect(data).toBeNull();
            });

            test('cannot delete records', async () => {
                const { data, error } = await this.supabase
                    .from(this.options.tableName)
                    .delete()
                    .eq('id', 1) // Используем фиктивный ID
                    .select()
                    .single();

                expect(error).not.toBeNull();
                expect(error?.message).toMatch(/(permission denied|violates row-level security|JSON object requested, multiple \(or no\) rows returned)/);
                expect(data).toBeNull();
            });
        });
    }

    /**
     * Тесты для аутентифицированного пользователя
     */
    private testAuthenticatedAccess() {
        describe('Authenticated Access', () => {
            beforeAll(async () => {
                // Логинимся перед тестами
                await this.supabase.auth.signInWithPassword({
                    email: process.env.INTEGRATION_SUPABASE_USER_EMAIL!,
                    password: process.env.INTEGRATION_SUPABASE_USER_PASSWORD!
                });
            });

            test('can create and read records', async () => {
                // Создаем запись
                const { data: createData, error: createError } = await this.supabase
                    .from(this.options.tableName)
                    .insert([this.options.testData])
                    .select()
                    .single();

                expect(createError).toBeNull();
                expect(createData).not.toBeNull();

                if (createData?.id) {
                    this.createdId = createData.id;
                }

                // Дополнительные проверки для созданной записи
                if (this.options.additionalCreateChecks) {
                    this.options.additionalCreateChecks(createData as T);
                }

                // Читаем все записи
                const { data: readData, error: readError } = await this.supabase
                    .from(this.options.tableName)
                    .select('*');

                expect(readError).toBeNull();
                expect(readData).not.toBeNull();
                expect(Array.isArray(readData)).toBe(true);
                expect(readData?.length).toBeGreaterThan(0);
                expect(readData?.find(r => r.id === this.createdId)).toBeTruthy();
            });

            test('can update own records', async () => {
                const { data, error } = await this.supabase
                    .from(this.options.tableName)
                    .update(this.options.updateData)
                    .eq('id', this.createdId!)
                    .select()
                    .single();

                expect(error).toBeNull();
                expect(data).not.toBeNull();

                // Дополнительные проверки для обновленной записи
                if (this.options.additionalUpdateChecks) {
                    this.options.additionalUpdateChecks(data as T);
                }
            });

            test('can delete own records', async () => {
                const { error } = await this.supabase
                    .from(this.options.tableName)
                    .delete()
                    .eq('id', this.createdId!);

                expect(error).toBeNull();

                // Проверяем, что запись удалена
                const { data, error: readError } = await this.supabase
                    .from(this.options.tableName)
                    .select('*')
                    .eq('id', this.createdId!)
                    .single();

                expect(data).toBeNull();
                expect(readError?.message).toContain('JSON object requested, multiple (or no) rows returned');

                // Сбрасываем ID, так как запись удалена
                this.createdId = null;
            });

            test('cannot update records of other users', async () => {
                // TODO: Implement this test when we have a way to create records for other users
            });

            test('cannot delete records of other users', async () => {
                // TODO: Implement this test when we have a way to create records for other users
            });
        });
    }
} 