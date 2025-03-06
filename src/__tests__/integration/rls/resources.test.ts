import { BaseApiTest } from '../api/base-api-test';

describe('Resources Table RLS Policies', () => {
    let createdResourceId: number;

    beforeAll(async () => {
        await BaseApiTest.setupTestClient();
    });

    describe('Anonymous Access', () => {
        it('cannot create records', async () => {
            const { error } = await BaseApiTest.getAnonymousClient()
                .from('resources')
                .insert(BaseApiTest.generateResourceData());

            expect(error?.code).toBe('42501'); // Permission denied
        });

        it('cannot read records', async () => {
            const { data, error } = await BaseApiTest.getAnonymousClient()
                .from('resources')
                .select('*');

            expect(data).toEqual([]);
            expect(error).toBeNull();
        });
    });

    describe('Authenticated Access', () => {
        it('can create and read records', async () => {
            // Создаем тестовый ресурс
            const resourceData = BaseApiTest.generateResourceData();
            const { data: createData, error: createError } = await BaseApiTest.getAuthenticatedClient()
                .from('resources')
                .insert(resourceData)
                .select()
                .single();

            expect(createError).toBeNull();
            expect(createData).not.toBeNull();
            createdResourceId = createData!.id;

            // Проверяем, что можем прочитать созданный ресурс
            const { data: readData, error: readError } = await BaseApiTest.getAuthenticatedClient()
                .from('resources')
                .select('*')
                .eq('id', createdResourceId);

            expect(readError).toBeNull();
            expect(readData).not.toBeNull();
            expect(Array.isArray(readData)).toBe(true);
            expect(readData?.length).toBeGreaterThan(0);
            expect(readData?.find(r => r.id === createdResourceId)).toBeTruthy();
        });

        it('can update own records', async () => {
            const updates = {
                name: `Updated Resource ${Date.now()}`,
                description: `Updated Description ${Date.now()}`
            };

            const { data, error } = await BaseApiTest.getAuthenticatedClient()
                .from('resources')
                .update(updates)
                .eq('id', createdResourceId)
                .select()
                .single();

            expect(error).toBeNull();
            expect(data).not.toBeNull();
            expect(data?.name).toBe(updates.name);
            expect(data?.description).toBe(updates.description);
        });

        it('can delete own records', async () => {
            const { error } = await BaseApiTest.getAuthenticatedClient()
                .from('resources')
                .delete()
                .eq('id', createdResourceId);

            expect(error).toBeNull();

            // Проверяем, что запись действительно удалена
            const { data, error: readError } = await BaseApiTest.getAuthenticatedClient()
                .from('resources')
                .select('*')
                .eq('id', createdResourceId)
                .maybeSingle();

            expect(readError).toBeNull();
            expect(data).toBeNull();
        });

        it('has access to all fields of own records', async () => {
            const resourceData = BaseApiTest.generateResourceData();
            const { data: createData, error: createError } = await BaseApiTest.getAuthenticatedClient()
                .from('resources')
                .insert(resourceData)
                .select()
                .single();

            expect(createError).toBeNull();
            expect(createData).toBeDefined();
            expect(createData?.name).toBe(resourceData.name);
            expect(createData?.link).toBe(resourceData.link);
            expect(createData?.description).toBe(resourceData.description);
            expect(createData?.is_route).toBe(resourceData.is_route);

            if (createData) {
                createdResourceId = createData.id;
            }
        });
    });
}); 