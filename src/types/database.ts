import type {
    Person,
    Event,
    EventPerson,
    Location,
    Section,
    Resource,
    Announcement,
    SocialFeedPost,
    MarkdownPage,
} from './supabase';

export interface Database {
    public: {
        Tables: {
            people: {
                Row: Person;
                Insert: Omit<Person, 'id' | 'created_at'>;
                Update: Partial<Omit<Person, 'id' | 'created_at'>>;
            };
            events: {
                Row: Event;
                Insert: Omit<Event, 'id' | 'created_at'>;
                Update: Partial<Omit<Event, 'id' | 'created_at'>>;
            };
            event_people: {
                Row: EventPerson;
                Insert: Omit<EventPerson, 'id' | 'created_at'>;
                Update: Partial<Omit<EventPerson, 'id' | 'created_at'>>;
            };
            locations: {
                Row: Location;
                Insert: Omit<Location, 'id' | 'created_at'>;
                Update: Partial<Omit<Location, 'id' | 'created_at'>>;
            };
            sections: {
                Row: Section;
                Insert: Omit<Section, 'id' | 'created_at'>;
                Update: Partial<Omit<Section, 'id' | 'created_at'>>;
            };
            resources: {
                Row: Resource;
                Insert: Omit<Resource, 'id' | 'created_at'>;
                Update: Partial<Omit<Resource, 'id' | 'created_at'>>;
            };
            announcements: {
                Row: Announcement;
                Insert: Omit<Announcement, 'id' | 'created_at'>;
                Update: Partial<Omit<Announcement, 'id' | 'created_at'>>;
            };
            social_feed_posts: {
                Row: SocialFeedPost;
                Insert: Omit<SocialFeedPost, 'id' | 'created_at'>;
                Update: Partial<Omit<SocialFeedPost, 'id' | 'created_at'>>;
            };
            markdown_pages: {
                Row: MarkdownPage;
                Insert: Omit<MarkdownPage, 'id' | 'created_at'>;
                Update: Partial<Omit<MarkdownPage, 'id' | 'created_at'>>;
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
} 