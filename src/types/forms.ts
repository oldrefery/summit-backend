// src/types/forms.ts
import type { Event, Location, Person, Resource } from './supabase';

export interface EventFormData
  extends Omit<
    Event,
    'id' | 'created_at' | 'section' | 'location' | 'event_people'
  > {
  speaker_ids: number[];
}

export interface LocationFormData extends Omit<Location, 'id' | 'created_at'> {}

export interface PersonFormData extends Omit<Person, 'id' | 'created_at'> {}

export interface ResourceFormData extends Omit<Resource, 'id' | 'created_at'> {}
