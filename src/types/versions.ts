// src/types/versions.ts

// Tracking changes in every entity
import {
  Announcement,
  MarkdownPage,
  Person,
  Resource,
  Section,
  SocialFeedPost,
} from '@/types/supabase';
import { BaseEntity } from '@/types/base';

export interface EntityChanges {
  events: number;
  people: number;
  locations: number;
  sections: number;
  resources: number;
  announcements: number;
  social_posts: number;
  markdown_pages: number;
}

// Type for JSON file version
export interface JsonVersion extends BaseEntity {
  version: string;
  published_at: string;
  changes: EntityChanges;
  file_path: string;
}

// Metadata type in JSON file
export interface JsonMetadata {
  version: number;
  publishedAt: string;
  changes: EntityChanges;
}

// Full JSON file type
export interface AppJson {
  metadata: JsonMetadata;
  data: {
    events: Event[];
    people: Person[];
    locations: Location[];
    sections: Section[];
    resources: Resource[];
    announcements: Announcement[];
    social_posts: SocialFeedPost[];
    markdown_pages: MarkdownPage[];
  };
}

export interface Version {
  version: string;
  published_at: string;
  changes: {
    events: number;
    people: number;
    sections: number;
    locations: number;
    resources: number;
    social_posts: number;
    announcements: number;
    markdown_pages: number;
  };
  file_url: string;
  id: string;
  created_at: string;
}
