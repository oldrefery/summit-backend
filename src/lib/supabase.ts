import { createClient } from '@supabase/supabase-js';
import { MAX_FILE_SIZE_BYTES } from '@/app/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// client with auto refresh of the session
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// perform anonymous authentication
export async function ensureAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // If there is no session, perform anonymous authentication
    await supabase.auth.signInWithPassword({
      email: process.env.NEXT_PUBLIC_SUPABASE_ANON_EMAIL!,
      password: process.env.NEXT_PUBLIC_SUPABASE_ANON_PASSWORD!,
    });
  }
}

function getPublicFileUrl(bucketName: string, fileName: string) {
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
}

// interfaces according to the database schema
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
  section_id: number;
  date: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration?: string;
  location_id?: number;
  location?: Location;
  event_people?: EventPerson[];
}

export interface EventPerson {
  id: number;
  created_at: string;
  event_id: number;
  person_id: number;
  role: string;
  person?: Person;
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

// Storage
export const storage = {
  async uploadAvatar(file: File, userId: string) {
    try {
      await ensureAuthenticated();

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(
          'File size should not exceed ' + MAX_FILE_SIZE_BYTES + ' bytes'
        );
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();

      if (!fileExt || !['jpg', 'jpeg', 'png'].includes(fileExt)) {
        throw new Error('Only JPG and PNG files are allowed');
      }

      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Загружаем файл
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message);
      }

      if (!uploadData?.path) {
        throw new Error('Upload successful but path is missing');
      }

      // Получаем публичный URL
      return getPublicFileUrl('avatars', fileName);
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      throw error;
    }
  },

  async removeAvatar(url: string) {
    try {
      if (!url) return;

      // get filename from URL
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];

      if (!fileName) return;

      const { error } = await supabase.storage
        .from('avatars')
        .remove([fileName]);

      if (error) {
        console.error('Remove error:', error);
        throw new Error(`Failed to remove file: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in removeAvatar:', error);
      throw error;
    }
  },

  getPublicUrl(path: string) {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    return getPublicFileUrl('avatars', fileName);
  },
};
// API functions
export const api = {
  people: {
    async getAll() {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('name');

      if (error) {
        console.error('Get all error:', error);
        throw error;
      }

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
        .insert([person])
        .select()
        .single();

      if (error) {
        console.error('Create error:', error);
        throw error;
      }

      return data;
    },

    async update(
      id: number,
      updates: Partial<Omit<Person, 'id' | 'created_at'>>
    ) {
      console.log('Updating with data:', { id, updates }); // для отладки

      const { data, error } = await supabase
        .from('people')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      return data;
    },

    delete: async (id: number) => {
      console.log('Deleting:', id);
      const { error } = await supabase.from('people').delete().eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
  },

  events: {
    async getAll() {
      try {
        const result = await ensureAuthenticated();
      } catch (e) {
        console.log('Error in ensureAuthenticated:', e);
      }

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

    async getById(id: number) {
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
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    },

    async create(
      event: Omit<Event, 'id' | 'created_at'> & { speaker_ids?: number[] }
    ) {
      const { speaker_ids, ...eventData } = event;

      // Start a transaction
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) {
        console.error('Failed to create event:', eventError);
        throw eventError;
      }

      // If we have speakers, create event_people records
      if (speaker_ids?.length) {
        const eventPeopleData = speaker_ids.map(person_id => ({
          event_id: newEvent.id,
          person_id,
          role: 'speaker',
        }));

        const { error: speakersError } = await supabase
          .from('event_people')
          .insert(eventPeopleData);

        if (speakersError) {
          console.error('Failed to add speakers:', speakersError);
          throw speakersError;
        }
      }

      return newEvent;
    },

    async update(
      id: number,
      updates: Partial<Omit<Event, 'id' | 'created_at'>> & {
        speaker_ids?: number[];
      }
    ) {
      const { speaker_ids, ...eventData } = updates;

      // Start by updating the event
      const { data: updatedEvent, error: eventError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (eventError) {
        console.error('Failed to update event:', eventError);
        throw eventError;
      }

      // If speaker_ids are provided, update the speakers
      if (speaker_ids !== undefined) {
        // First, remove all existing speakers
        const { error: deleteError } = await supabase
          .from('event_people')
          .delete()
          .eq('event_id', id)
          .eq('role', 'speaker');

        if (deleteError) {
          console.error('Failed to remove existing speakers:', deleteError);
          throw deleteError;
        }

        // Then, add new speakers if any
        if (speaker_ids.length > 0) {
          const eventPeopleData = speaker_ids.map(person_id => ({
            event_id: id,
            person_id,
            role: 'speaker',
          }));

          const { error: speakersError } = await supabase
            .from('event_people')
            .insert(eventPeopleData);

          if (speakersError) {
            console.error('Failed to add new speakers:', speakersError);
            throw speakersError;
          }
        }
      }

      return updatedEvent;
    },

    async delete(id: number) {
      const { error } = await supabase.from('events').delete().eq('id', id);

      if (error) {
        console.error('Delete event error:', error);
        throw error;
      }
    },
  },

  sections: {
    async getAll() {
      await ensureAuthenticated();

      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('date');

      if (error) {
        console.error('Failed to fetch sections:', error);
        throw error;
      }

      return data;
    },
  },

  locations: {
    async getAll() {
      await ensureAuthenticated();

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) {
        console.error('Failed to fetch locations:', error);
        throw error;
      }

      return data;
    },

    async getById(id: number) {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to fetch location:', error);
        throw error;
      }

      return data;
    },

    async create(location: Omit<Location, 'id' | 'created_at'>) {
      const { data, error } = await supabase
        .from('locations')
        .insert([location])
        .select()
        .single();

      if (error) {
        console.error('Failed to create location:', error);
        throw error;
      }

      return data;
    },

    async update(
      id: number,
      updates: Partial<Omit<Location, 'id' | 'created_at'>>
    ) {
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update location:', error);
        throw error;
      }

      return data;
    },

    async delete(id: number) {
      const { error } = await supabase.from('locations').delete().eq('id', id);

      if (error) {
        console.error('Failed to delete location:', error);
        throw error;
      }
    },
  },

  resources: {
    async getAll() {
      await ensureAuthenticated();

      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('name');

      if (error) {
        console.error('Failed to fetch resources:', error);
        throw error;
      }

      return data;
    },

    async getById(id: number) {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to fetch resource:', error);
        throw error;
      }

      return data;
    },

    async create(resource: Omit<Resource, 'id' | 'created_at'>) {
      const { data, error } = await supabase
        .from('resources')
        .insert([resource])
        .select()
        .single();

      if (error) {
        console.error('Failed to create resource:', error);
        throw error;
      }

      return data;
    },

    async update(
      id: number,
      updates: Partial<Omit<Resource, 'id' | 'created_at'>>
    ) {
      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update resource:', error);
        throw error;
      }

      return data;
    },

    async delete(id: number) {
      const { error } = await supabase.from('resources').delete().eq('id', id);

      if (error) {
        console.error('Failed to delete resource:', error);
        throw error;
      }
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
