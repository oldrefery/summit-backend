import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Типы данных в соответствии с базой
export interface Person {
  id: number;
  created_at: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  photo_url?: string;
  country?: string;
  role: string;
  email?: string;
  mobile?: string;
}

export interface Event {
  id: number;
  created_at: string;
  section: string;
  date: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration?: string;
  location_id?: number;
}

export interface EventPerson {
  id: number;
  created_at: string;
  event_id: number;
  person_id: number;
  role: string;
}

export interface Location {
  id: number;
  created_at: string;
  name: string;
  link_map?: string;
  link?: string;
  link_address?: string;
}

export interface Announcement {
  id: number;
  created_at: string;
  person_id?: number;
  published_at: string;
  content: string;
}

export interface Resource {
  id: number;
  created_at: string;
  name: string;
  link: string;
  description?: string;
  is_route: boolean;
}

export interface SocialFeedPost {
  id: number;
  created_at: string;
  author_id: number;
  content: string;
  timestamp: string;
  image_urls: string[];
}

// API функции
export const api = {
  people: {
    async getAll() {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },

    async getById(id: number) {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    async create(person: Omit<Person, 'id' | 'created_at'>) {
      const { data, error } = await supabase
        .from('people')
        .insert(person)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(
      id: number,
      updates: Partial<Omit<Person, 'id' | 'created_at'>>
    ) {
      const { data, error } = await supabase
        .from('people')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: number) {
      const { error } = await supabase.from('people').delete().eq('id', id);

      if (error) throw error;
    },
  },

  events: {
    async getAll() {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          location:locations(*),
          event_people:event_people(
            person:people(*)
          )
        `
        )
        .order('start_time');

      if (error) throw error;
      return data;
    },
  },

  locations: {
    async getAll() {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  },

  announcements: {
    async getAll() {
      const { data, error } = await supabase
        .from('announcements')
        .select(
          `
          *,
          person:people(*)
        `
        )
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  },
};
