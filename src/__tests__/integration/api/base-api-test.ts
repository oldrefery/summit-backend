import { BaseIntegrationTest } from '../base-test';
import type {
    Person,
    Event,
    Location,
    Section,
    Resource,
    MarkdownPage,
    EventPerson,
    PersonRole,
    BaseEntity
} from '@/types';
import { format } from 'date-fns';
import { PostgrestBuilder } from '@supabase/postgrest-js';

type EntityWithTimestamps = BaseEntity & {
    created_at?: string;
    updated_at?: string;
};

interface SupabaseError {
    status: number;
    message: string;
}

export class BaseApiTest extends BaseIntegrationTest {
    // Data Generators
    protected static generatePersonData(role: PersonRole = 'speaker'): Partial<Person> {
        const timestamp = Date.now();
        return {
            name: `Test Person ${timestamp}`,
            role,
            title: `Test Title ${timestamp}`,
            company: `Test Company ${timestamp}`,
            bio: `Test Bio ${timestamp}`,
            country: 'Test Country',
            email: `test.${timestamp}@example.com`,
            mobile: `+1234567${timestamp.toString().slice(-4)}`,
        };
    }

    protected static generateEventData(
        sectionId: number,
        locationId?: number
    ): Partial<Event> {
        const timestamp = Date.now();
        const date = format(new Date(), 'yyyy-MM-dd');
        return {
            section_id: sectionId,
            title: `Test Event ${timestamp}`,
            date,
            start_time: `${date}T09:00:00Z`,
            end_time: `${date}T10:00:00Z`,
            description: `Test Description ${timestamp}`,
            location_id: locationId,
            duration: '1h',
        };
    }

    protected static generateLocationData(): Partial<Location> {
        const timestamp = Date.now();
        const uniqueSuffix = Math.random().toString(36).substring(2, 15);
        return {
            name: `Test Location ${timestamp}-${uniqueSuffix}`,
            link_map: `https://maps.test/${timestamp}-${uniqueSuffix}`,
            link: `https://test.com/${timestamp}-${uniqueSuffix}`,
            link_address: `Test Address ${timestamp}-${uniqueSuffix}`,
        };
    }

    protected static generateSectionData(date?: Date): Partial<Section> {
        const timestamp = Date.now();
        const uniqueSuffix = Math.random().toString(36).substring(2, 15);
        return {
            name: `Test Section ${timestamp}-${uniqueSuffix}`,
            date: format(date || new Date(), 'yyyy-MM-dd'),
        };
    }

    protected static generateResourceData(): Partial<Resource> {
        const timestamp = Date.now();
        return {
            name: `Test Resource ${timestamp}`,
            link: `https://test.com/resource/${timestamp}`,
            description: `Test Description ${timestamp}`,
            is_route: false,
        };
    }

    protected static generateMarkdownPageData(): Partial<MarkdownPage> {
        const timestamp = Date.now();
        return {
            slug: `test-page-${timestamp}`,
            title: `Test Page ${timestamp}`,
            content: `# Test Content ${timestamp}\n\nThis is a test page.`,
            published: false,
        };
    }

    // Common Test Scenarios
    protected static async createTestPerson(role: PersonRole = 'speaker'): Promise<Person> {
        return await this.initializeTestData<Person>('people', this.generatePersonData(role));
    }

    protected static async createTestSection(date?: Date): Promise<Section> {
        return await this.initializeTestData<Section>('sections', this.generateSectionData(date));
    }

    protected static async createTestLocation(): Promise<Location> {
        return await this.initializeTestData<Location>('locations', this.generateLocationData());
    }

    protected static async createTestEvent(
        sectionId?: number,
        locationId?: number
    ): Promise<Event> {
        if (!sectionId) {
            const section = await this.createTestSection();
            sectionId = section.id;
        }

        if (!locationId) {
            const location = await this.createTestLocation();
            locationId = location.id;
        }

        return await this.initializeTestData<Event>(
            'events',
            this.generateEventData(sectionId, locationId)
        );
    }

    protected static async createTestResource(): Promise<Resource> {
        return await this.initializeTestData<Resource>('resources', this.generateResourceData());
    }

    protected static async createTestMarkdownPage(): Promise<MarkdownPage> {
        return await this.initializeTestData<MarkdownPage>(
            'markdown_pages',
            this.generateMarkdownPageData()
        );
    }

    protected static async assignSpeakerToEvent(
        eventId: number,
        personId: number
    ): Promise<EventPerson> {
        return await this.initializeTestData<EventPerson>('event_people', {
            event_id: eventId,
            person_id: personId,
            role: 'speaker',
        });
    }

    // Error Handling Helpers
    protected static async expectError<T>(
        promise: Promise<T>,
        expectedStatus?: number
    ): Promise<void> {
        try {
            await promise;
            throw new Error('Expected error but got success');
        } catch (error) {
            if (expectedStatus && this.isSupabaseError(error)) {
                expect(error.status).toBe(expectedStatus);
            }
        }
    }

    protected static async expectSupabaseError<T>(
        promise: PostgrestBuilder<T>,
        expectedStatus?: number
    ): Promise<void> {
        try {
            await promise;
            throw new Error('Expected error but got success');
        } catch (error) {
            if (expectedStatus && this.isSupabaseError(error)) {
                expect(error.status).toBe(expectedStatus);
            }
        }
    }

    private static isSupabaseError(error: unknown): error is SupabaseError {
        return (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            typeof (error as SupabaseError).status === 'number'
        );
    }

    // Validation Helpers
    protected static validateTimestamps(obj: EntityWithTimestamps): void {
        expect(obj.created_at).toBeDefined();
        expect(new Date(obj.created_at || '').getTime()).not.toBeNaN();
        if (obj.updated_at) {
            expect(new Date(obj.updated_at).getTime()).not.toBeNaN();
        }
    }

    protected static validateIds(obj: BaseEntity): void {
        expect(obj.id).toBeDefined();
        expect(typeof obj.id === 'number' || typeof obj.id === 'string').toBe(true);
    }
} 