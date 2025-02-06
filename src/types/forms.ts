// src/types/forms.ts
import type { Event, Location, Person, Resource } from './supabase';

export interface EventFormData
  extends Omit<
    Event,
    'id' | 'created_at' | 'section' | 'location' | 'event_people'
  > {
  speaker_ids: number[];
}

export type LocationFormData = Omit<Location, 'id' | 'created_at'>;

export type PersonFormData = Omit<Person, 'id' | 'created_at'>;

export type ResourceFormData = Omit<Resource, 'id' | 'created_at'>;
