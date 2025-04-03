import { BaseApiTest } from './base-api-test';

describe('Public Access Tests', () => {
    beforeAll(async () => {
        await BaseApiTest.setupTestClient();
    });

    beforeEach(async () => {
        // Удаляем все предыдущие версии
        await BaseApiTest.getAuthenticatedClient()
            .from('json_versions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        // Create a test JSON version
        const { data: insertedData, error: insertError } = await BaseApiTest.getAuthenticatedClient()
            .from('json_versions')
            .insert({
                version: '1.0.0',
                file_path: `/test/path/${Date.now()}`,
                changes: { test: 'data' },
                file_url: `https://example.com/test-${Date.now()}.json`,
                published_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) throw insertError;
        if (!insertedData) throw new Error('Failed to create test JSON version');
    });

    describe('JSON Data Access', () => {
        it.skip('should not allow anonymous access to JSON versions', async () => {
            const { data, error } = await BaseApiTest.getAnonymousClient()
                .from('json_versions')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            console.log('Anonymous access error:', {
                error,
                errorCode: error?.code,
                errorMessage: error?.message,
                errorDetails: error ? JSON.stringify(error, null, 2) : null
            });

            expect(error).toBeDefined();
            expect(data).toBeNull();
        });

        it('should allow authenticated access to JSON versions', async () => {
            const { data, error } = await BaseApiTest.getAuthenticatedClient()
                .from('json_versions')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data?.version).toBeDefined();
            expect(data?.file_url).toBeDefined();
        });
    });

    describe('Storage Access', () => {
        it('should allow anonymous access to public storage bucket', async () => {
            const { data, error } = await BaseApiTest.getAnonymousClient()
                .storage
                .from('public')
                .list();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
        });

        it('should not allow anonymous access to private storage buckets', async () => {
            const { data, error } = await BaseApiTest.getAnonymousClient()
                .storage
                .from('private')
                .list();

            expect(error).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
            expect(data).toHaveLength(0);
        });
    });

    describe('Data Format', () => {
        it('should provide valid JSON format for authenticated users', async () => {
            const { data: jsonData, error } = await BaseApiTest.getAuthenticatedClient()
                .from('json_versions')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            expect(error).toBeNull();
            expect(jsonData).toBeDefined();
            expect(jsonData?.changes).toBeDefined();
            expect(typeof jsonData?.changes).toBe('object');
        });

        it('should handle empty data sets for authenticated users', async () => {
            // Удаляем все версии
            await BaseApiTest.getAuthenticatedClient()
                .from('json_versions')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

            const { data: jsonData, error } = await BaseApiTest.getAuthenticatedClient()
                .from('json_versions')
                .select('*')
                .maybeSingle();

            expect(error).toBeNull();
            expect(jsonData).toBeNull();
        });
    });
});