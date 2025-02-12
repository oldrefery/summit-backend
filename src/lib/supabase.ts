import { createClient } from '@supabase/supabase-js';
import { MAX_FILE_SIZE_BYTES } from '@/app/constants';
import type {
  Person,
  Event,
  Location,
  Resource,
  MarkdownPage,
  Announcement,
  EventFormData,
  EventPerson,
  Section,
  EntityChanges,
  Version,
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// client with auto refresh of the session
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

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

      return getPublicFileUrl('avatars', fileName);
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      throw error;
    }
  },

  async removeAvatar(url: string) {
    try {
      if (!url) return;

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

      return data as Person[];
    },

    async getById(id: number) {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as Person;
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

      return data as Person;
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

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      return data as Person;
    },

    async delete(id: number) {
      // Check related records in event_people
      const { data: eventPeople, error: checkError } = await supabase
        .from('event_people')
        .select('id')
        .eq('person_id', id);

      if (checkError) {
        console.error('Failed to check related records:', checkError);
        throw checkError;
      }

      if (eventPeople && eventPeople.length > 0) {
        throw new Error('Cannot delete person who is assigned to events');
      }

      // Check related records in announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select('id')
        .eq('person_id', id);

      if (announcementsError) {
        console.error('Failed to check announcements:', announcementsError);
        throw announcementsError;
      }

      if (announcements && announcements.length > 0) {
        throw new Error('Cannot delete person who has announcements');
      }

      const { error } = await supabase.from('people').delete().eq('id', id);
      if (error) throw error;
    },
  },

  events: {
    async getAll() {
      await ensureAuthenticated();

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

      return data as (Event & {
        location: Location | null;
        event_people: (EventPerson & { person: Person })[];
      })[];
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

      return data as Event & {
        location: Location | null;
        event_people: (EventPerson & { person: Person })[];
      };
    },

    async create(eventForm: EventFormData) {
      const { speaker_ids, ...eventData } = eventForm;

      // Start a transaction
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select(
          `
          *,
          location:locations(*),
          event_people:event_people(
            person:people(*)
          )
        `
        )
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
          role: 'speaker' as const,
        }));

        const { error: speakersError } = await supabase
          .from('event_people')
          .insert(eventPeopleData);

        if (speakersError) {
          console.error('Failed to add speakers:', speakersError);
          throw speakersError;
        }
      }

      return newEvent as Event & {
        location: Location | null;
        event_people: EventPerson[];
      };
    },

    async update(id: number, updates: Partial<EventFormData>) {
      const { speaker_ids, ...eventData } = updates;

      // Start by updating the event
      const { data: updatedEvent, error: eventError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select(
          `
          *,
          location:locations(*),
          event_people:event_people(
            person:people(*)
          )
        `
        )
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
            role: 'speaker' as const,
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

      return updatedEvent as Event & {
        location: Location | null;
        event_people: EventPerson[];
      };
    },

    async delete(id: number) {
      // Check related records in event_people
      const { data: eventPeople, error: checkError } = await supabase
        .from('event_people')
        .select('id')
        .eq('event_id', id);

      if (checkError) {
        console.error('Failed to check related records:', checkError);
        throw checkError;
      }

      if (eventPeople && eventPeople.length > 0) {
        throw new Error('Cannot delete event with assigned speakers');
      }

      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
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

      return data as Section[];
    },

    async create(section: Omit<Section, 'id' | 'created_at'>) {
      await ensureAuthenticated();

      const { data, error } = await supabase
        .from('sections')
        .insert([section])
        .select()
        .single();

      if (error) {
        console.error('Failed to create section:', error);
        throw error;
      }

      return data as Section;
    },

    async update(
      id: number,
      updates: Partial<Omit<Section, 'id' | 'created_at'>>
    ) {
      await ensureAuthenticated();

      const { data, error } = await supabase
        .from('sections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update section:', error);
        throw error;
      }

      return data as Section;
    },

    async delete(id: number) {
      await ensureAuthenticated();

      // Проверяем, есть ли связанные события
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('section_id', id);

      if (eventsError) {
        console.error('Failed to check related events:', eventsError);
        throw eventsError;
      }

      if (events && events.length > 0) {
        throw new Error('Cannot delete section with related events');
      }

      const { error } = await supabase.from('sections').delete().eq('id', id);

      if (error) {
        console.error('Failed to delete section:', error);
        throw error;
      }
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

      return data as Location[];
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

      return data as Location;
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

      return data as Location;
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

      return data as Location;
    },

    async delete(id: number) {
      // Check related records in events
      const { data: events, error: checkError } = await supabase
        .from('events')
        .select('id')
        .eq('location_id', id);

      if (checkError) {
        console.error('Failed to check related events:', checkError);
        throw checkError;
      }

      if (events && events.length > 0) {
        throw new Error('Cannot delete location that is used in events');
      }

      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
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

      return data as Resource[];
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

      return data as Resource;
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

      return data as Resource;
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

      return data as Resource;
    },

    async delete(id: number) {
      const { error } = await supabase.from('resources').delete().eq('id', id);

      if (error) {
        console.error('Failed to delete resource:', error);
        throw error;
      }
    },
  },

  markdown: {
    async getAll() {
      await ensureAuthenticated();

      const { data, error } = await supabase
        .from('markdown_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch markdown pages:', error);
        throw error;
      }

      return data as MarkdownPage[];
    },

    async getBySlug(slug: string) {
      const { data, error } = await supabase
        .from('markdown_pages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Failed to fetch markdown page:', error);
        throw error;
      }

      return data as MarkdownPage;
    },

    async create(page: Omit<MarkdownPage, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('markdown_pages')
        .insert([page])
        .select()
        .single();

      if (error) {
        console.error('Failed to create markdown page:', error);
        throw error;
      }

      return data as MarkdownPage;
    },

    async update(
      id: number,
      updates: Partial<Omit<MarkdownPage, 'id' | 'created_at' | 'updated_at'>>
    ) {
      const { data, error } = await supabase
        .from('markdown_pages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update markdown page:', error);
        throw error;
      }

      return data as MarkdownPage;
    },

    async delete(id: number) {
      const { error } = await supabase
        .from('markdown_pages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete markdown page:', error);
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
      return data as (Announcement & { person: Person })[];
    },

    async create(announcement: Omit<Announcement, 'id' | 'created_at'>) {
      const { data, error } = await supabase
        .from('announcements')
        .insert([announcement])
        .select(
          `
          *,
          person:people(*)
        `
        )
        .single();

      if (error) {
        console.error('Failed to create announcement:', error);
        throw error;
      }

      return data as Announcement & { person: Person };
    },

    async delete(id: number) {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete announcement:', error);
        throw error;
      }
    },
  },

  changes: {
    async getAll() {
      await ensureAuthenticated();

      // Get last version's published_at
      const { data: lastVersion } = await supabase
        .from('json_versions')
        .select('published_at')
        .order('published_at', { ascending: false })
        .limit(1);

      const lastPublishedAt = lastVersion?.[0]?.published_at || '1970-01-01';

      // Get counts of updates since last version
      const [
        { count: eventsCount },
        { count: peopleCount },
        { count: locationsCount },
        { count: sectionsCount },
        { count: resourcesCount },
        { count: announcementsCount },
        { count: socialPostsCount },
        { count: markdownPagesCount },
      ] = await Promise.all([
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gt('updated_at', lastPublishedAt), // changed from created_at
        supabase
          .from('people')
          .select('*', { count: 'exact', head: true })
          .gt('updated_at', lastPublishedAt),
        supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .gt('updated_at', lastPublishedAt),
        supabase
          .from('sections')
          .select('*', { count: 'exact', head: true })
          .gt('updated_at', lastPublishedAt),
        supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .gt('updated_at', lastPublishedAt),
        supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true })
          .gt('updated_at', lastPublishedAt),
        supabase
          .from('social_feed_posts')
          .select('*', { count: 'exact', head: true })
          .gt('updated_at', lastPublishedAt),
        supabase
          .from('markdown_pages')
          .select('*', { count: 'exact', head: true })
          .gt('updated_at', lastPublishedAt),
      ]);

      return {
        events: eventsCount || 0,
        people: peopleCount || 0,
        locations: locationsCount || 0,
        sections: sectionsCount || 0,
        resources: resourcesCount || 0,
        announcements: announcementsCount || 0,
        social_posts: socialPostsCount || 0,
        markdown_pages: markdownPagesCount || 0,
      } as EntityChanges;
    },

    async publish() {
      await ensureAuthenticated();

      // Call server function to prepare data and create version record
      const { data, error: rpcError } = await supabase.rpc(
        'publish_new_version'
      );

      if (rpcError) {
        console.error('Failed to publish version:', rpcError);
        throw rpcError;
      }

      // Upload JSON file to storage
      const { error: uploadError } = await supabase.storage
        .from('app-data')
        .upload('app-data.json', JSON.stringify(data.data), {
          upsert: true,
          contentType: 'application/json',
        });

      if (uploadError) {
        console.error('Failed to upload file:', uploadError);
        throw uploadError;
      }

      return data;
    },
  },

  versions: {
    async getAll() {
      const { data, error } = await supabase
        .from('json_versions')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as Version[];
    },

    async rollback(version: string) {
      // Кщддифсл мукышщт
      const { data: versionData, error: versionError } = await supabase
        .from('json_versions')
        .select('*')
        .eq('version', version)
        .single();

      if (versionError) throw versionError;

      // new version from the source version
      const { error: publishError } = await supabase.rpc(
        'publish_new_version_from',
        { source_version_id: versionData.id }
      );

      if (publishError) throw publishError;

      return versionData;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('json_versions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },
};
