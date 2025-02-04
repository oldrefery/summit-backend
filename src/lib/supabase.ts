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
