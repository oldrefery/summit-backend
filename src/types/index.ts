// src/types/index.ts
export * from './base';
export * from './forms';
export * from './push';
export * from './select';
export * from './supabase';
export * from './versions';

export interface Version {
    id: string;           // uuid NOT NULL DEFAULT gen_random_uuid()
    version: string;      // varchar NOT NULL
    published_at?: Date;  // timestamptz NULL DEFAULT now()
    published_by?: string;// uuid NULL
    file_path: string;    // text NOT NULL
    changes: Record<string, number>; // jsonb NOT NULL
    file_url: string;     // text NOT NULL
    user_id?: string;     // uuid NULL
}
