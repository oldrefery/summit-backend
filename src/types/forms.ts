// src/types/forms.ts
import type { Event, Location, Person, Resource } from './supabase';
import { ElementType } from 'react';

export interface EventFormData
  extends Omit<
    Event,
    'id' | 'created_at' | 'section' | 'location' | 'event_people'
  > {
  speaker_ids?: number[];
}

export type LocationFormData = Omit<Location, 'id' | 'created_at'>;

export type PersonFormData = Omit<Person, 'id' | 'created_at'>;

export type ResourceFormData = Omit<Resource, 'id' | 'created_at'>;

export interface StatItem {
  title: string;
  value: number;
  loading: boolean;
  icon: ElementType;
  description: string;
  href: string;
}
