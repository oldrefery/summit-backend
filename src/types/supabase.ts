// src/types/supabase.ts
import { BaseEntity } from './base';

export type PersonRole = 'speaker' | 'attendee';
type EventPersonRole = 'speaker';

export interface Person extends BaseEntity {
  name: string;
  role: PersonRole;
  title?: string | null;
  company?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  country?: string | null;
  email?: string | null;
  mobile?: string | null;
}

export interface Event extends BaseEntity {
  section_id: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string | null;
  duration?: string | null;
  location_id?: number | null;
  section?: {
    name: string;
  };
  location?: Location;
  event_people?: EventPerson[];
}

export interface EventPerson extends BaseEntity {
  event_id: number;
  person_id: number;
  role: EventPersonRole;
  person?: Person;
}

export interface Location extends BaseEntity {
  name: string;
  link_map?: string | null;
  link?: string | null;
  link_address?: string | null;
}

export interface Section extends BaseEntity {
  name: string;
  date: string;
  user_id?: string;
}

export interface Resource extends BaseEntity {
  name: string;
  link: string;
  description: string | null;
  is_route: boolean;
}

export interface Announcement extends BaseEntity {
  person_id: number;
  content: string;
  published_at: string;
  person?: Person;
}

export interface SocialFeedPost extends BaseEntity {
  author_id: number;
  content: string;
  timestamp: string;
  image_urls: string[];
  updated_at: string;
  user_id: string;
}

export interface MarkdownPage extends BaseEntity {
  slug: string;
  title: string;
  content: string;
  updated_at: string;
  published: boolean;
}
