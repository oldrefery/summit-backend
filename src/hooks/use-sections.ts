// src/hooks/use-sections.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/supabase';

export function useSections() {
  return useQuery({
    queryKey: ['sections'],
    queryFn: () => api.sections.getAll(),
  });
}
