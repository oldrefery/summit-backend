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
    BaseEntity,
    AppUserSettings,
    Announcement,
    Version,
    SocialFeedPost
} from '@/types';
import { format } from 'date-fns';
import { PostgrestBuilder } from '@supabase/postgrest-js';
import { afterAll, afterEach } from 'vitest';

type EntityWithTimestamps = BaseEntity & {
    created_at?: string;
    updated_at?: string;
};

interface SupabaseError {
    status: number;
    message: string;
}

interface TestRecord {
    table: string;
    id: string | number;
}

export class BaseApiTest extends BaseIntegrationTest {
    private static testRecords: TestRecord[] = [];

    protected static trackTestRecord(table: string, id: string | number) {
        this.testRecords.push({ table, id });
    }

    protected static async cleanup() {
        for (const record of this.testRecords) {
            await this.cleanupTestData(record.table, record.id);
        }
        this.testRecords = [];
    }

    public static async runTests() {
        afterAll(async () => {
            await this.cleanup();
        });

        afterEach(async () => {
            await this.cleanup();
        });
    }

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
        const startTime = new Date();
        startTime.setHours(9, 0, 0, 0);
        const endTime = new Date();
        endTime.setHours(10, 0, 0, 0);

        return {
            section_id: sectionId,
            title: `Test Event ${timestamp}`,
            date,
            start_time: `${date}T09:00:00+00:00`,
            end_time: `${date}T10:00:00+00:00`,
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

    public static generateResourceData(): Partial<Resource> {
        const timestamp = Date.now();
        return {
            name: `Test Resource ${timestamp}`,
            link: `https://test.com/resource/${timestamp}`,
            description: `Test Description ${timestamp}`,
            is_route: false,
        };
    }

    protected static generateMarkdownPageData(customData?: Partial<MarkdownPage>): Partial<MarkdownPage> {
        const timestamp = Date.now();
        const defaultData = {
            slug: `test-page-${timestamp}`,
            title: `Test Page ${timestamp}`,
            content: `# Test Content ${timestamp}\n\nThis is a test page.`,
            published: false
        };

        return { ...defaultData, ...customData };
    }

    protected static generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    protected static generateAppUserSettingsData(): Partial<AppUserSettings> {
        const timestamp = Date.now();
        return {
            device_id: this.generateUUID(),
            device_info: {
                deviceName: `Test Device ${timestamp}`,
                osName: 'iOS',
                osVersion: '16.0',
                deviceModel: 'iPhone 14',
                appVersion: '1.0.0',
                buildNumber: '1'
            },
            push_token: `test-token-${this.generateUUID()}`,
            settings: {
                social_feed: true,
                announcements: true
            }
        };
    }

    protected static generateAnnouncementData(personId?: number): Partial<Announcement> {
        const timestamp = Date.now();
        return {
            person_id: personId,
            content: `Test Announcement Content ${timestamp}`,
            published_at: new Date().toISOString()
        };
    }

    protected static generateJsonVersionData(customChanges?: Partial<Version['changes']>): Partial<Version> {
        const timestamp = Date.now();
        const defaultChanges = {
            events: 1,
            people: 1,
            sections: 1,
            locations: 1,
            resources: 1,
            social_posts: 1,
            announcements: 1,
            markdown_pages: 1
        };

        return {
            version: Math.floor(timestamp / 1000).toString(),
            file_path: `/test/path/${timestamp}`,
            changes: { ...defaultChanges, ...customChanges },
            file_url: `https://example.com/test-${timestamp}.json`
        };
    }

    protected static generateSocialFeedPostData(): Partial<SocialFeedPost> {
        const timestamp = new Date().toISOString();
        return {
            content: `Test post content ${Date.now()}`,
            timestamp,
            image_urls: [`https://example.com/test-${Date.now()}.jpg`],
            user_id: this.userId
        };
    }

    // Common Test Scenarios
    protected static async createTestPerson(role: PersonRole = 'speaker'): Promise<Person> {
        const person = await this.initializeTestData<Person>('people', this.generatePersonData(role));
        this.trackTestRecord('people', person.id);
        return person;
    }

    protected static async createTestSection(date?: Date): Promise<Section> {
        const section = await this.initializeTestData<Section>('sections', this.generateSectionData(date));
        this.trackTestRecord('sections', section.id);
        return section;
    }

    protected static async createTestLocation(): Promise<Location> {
        const location = await this.initializeTestData<Location>('locations', this.generateLocationData());
        this.trackTestRecord('locations', location.id);
        return location;
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

        const event = await this.initializeTestData<Event>(
            'events',
            this.generateEventData(sectionId, locationId)
        );
        this.trackTestRecord('events', event.id);
        return event;
    }

    protected static async createTestResource(): Promise<Resource> {
        const resource = await this.initializeTestData<Resource>('resources', this.generateResourceData());
        this.trackTestRecord('resources', resource.id);
        return resource;
    }

    protected static async createTestMarkdownPage(): Promise<MarkdownPage> {
        const page = await this.initializeTestData<MarkdownPage>(
            'markdown_pages',
            this.generateMarkdownPageData()
        );
        this.trackTestRecord('markdown_pages', page.id);
        return page;
    }

    protected static async createTestAppUserSettings(): Promise<AppUserSettings> {
        const settings = await this.initializeTestData<AppUserSettings>(
            'app_user_settings',
            this.generateAppUserSettingsData()
        );
        this.trackTestRecord('app_user_settings', settings.id);
        return settings;
    }

    protected static async assignSpeakerToEvent(
        eventId: number,
        personId: number
    ): Promise<EventPerson> {
        const eventPerson = await this.initializeTestData<EventPerson>('event_people', {
            event_id: eventId,
            person_id: personId,
            role: 'speaker',
        });
        this.trackTestRecord('event_people', eventPerson.id);
        return eventPerson;
    }

    protected static async createTestSocialFeedPost(author?: Person): Promise<SocialFeedPost> {
        if (!author) {
            author = await this.createTestPerson();
        }

        const postData = {
            ...this.generateSocialFeedPostData(),
            author_id: author.id
        };

        const post = await this.initializeTestData<SocialFeedPost>('social_feed_posts', postData);
        this.trackTestRecord('social_feed_posts', post.id);
        return post;
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
        if (obj.created_at) {
            expect(new Date(obj.created_at).getTime()).not.toBeNaN();
        }
        if (obj.updated_at) {
            expect(new Date(obj.updated_at).getTime()).not.toBeNaN();
        }
    }

    protected static validateIds(obj: BaseEntity): void {
        expect(obj.id).toBeDefined();
        expect(typeof obj.id === 'number' || typeof obj.id === 'string').toBe(true);
    }

    protected static async getAuthenticatedUserId(): Promise<string> {
        const { data: { session }, error } = await this.getAuthenticatedClient().auth.getSession();
        if (error || !session?.user?.id) {
            throw new Error('Failed to get authenticated user ID');
        }
        return session.user.id;
    }

    protected static getTestUserId(): string {
        return '00000000-0000-0000-0000-000000000000'; // Фиксированный тестовый ID пользователя
    }

    protected static async signInTestUser(): Promise<void> {
        const client = this.getAuthenticatedClient();

        // Создаем промис для ожидания события SIGNED_IN
        const signInPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Auth timeout'));
            }, 5000);

            client.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    clearTimeout(timeout);
                    resolve(session);
                }
            });
        });

        // Выполняем вход
        const { error } = await client.auth.signInWithPassword({
            email: 'anonymoususer@firstlinesoftware.com',
            password: 'Au123456!'
        });

        if (error) throw error;

        // Ждем завершения аутентификации
        await signInPromise;

        // Используем userId из базового класса
        if (!BaseIntegrationTest.userId) {
            throw new Error('Failed to get user ID from base class');
        }
    }
} 