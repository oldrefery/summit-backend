import { BaseCrudTest } from './base-crud.test';
import type { Section } from '@/types';

const uniqueId = Date.now();

const testSection: Omit<Section, 'id' | 'created_at'> = {
    name: `Test Section ${uniqueId}`,
    date: '2024-03-20'
};

const updateData = {
    name: `Updated Test Section ${uniqueId}`,
    date: '2024-03-21'
};

// Создаем и запускаем тесты
const sectionsTest = new BaseCrudTest<Section>({
    tableName: 'sections',
    testData: testSection,
    updateData,
    additionalCreateChecks: (data) => {
        expect(data.name).toBe(testSection.name);
        expect(data.date).toBe(testSection.date);
        expect(data.user_id).toBeTruthy();
    },
    additionalUpdateChecks: (data) => {
        expect(data.name).toBe(updateData.name);
        expect(data.date).toBe(updateData.date);
        expect(data.user_id).toBeTruthy();
    }
});

sectionsTest.runTests(); 