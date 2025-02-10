// src/hooks/__tests__/useSections.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useSections } from '@/hooks/use-sections';
import { server } from '@/mocks/server';
import { http } from 'msw';

describe('useSections', () => {
  it('fetches sections correctly', async () => {
    // Мокаем ответ от Supabase
    server.use(
      http.get(
        'https://iabwkgppahudnaouwaep.supabase.co/rest/v1/sections',
        () => {
          return new Response(
            JSON.stringify([
              {
                id: 1,
                name: 'Section 1',
                date: '2023-10-01',
                created_at: '2023-01-01T00:00:00Z',
              },
              {
                id: 2,
                name: 'Section 2',
                date: '2023-10-02',
                created_at: '2023-01-02T00:00:00Z',
              },
            ]),
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
      )
    );

    const { result } = renderHook(() => useSections());

    // Ожидаем, что данные будут загружены
    await waitFor(() => {
      expect(result.current.data).toEqual([
        {
          id: 1,
          name: 'Section 1',
          date: '2023-10-01',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Section 2',
          date: '2023-10-02',
          created_at: '2023-01-02T00:00:00Z',
        },
      ]);
    });
  });

  it('handles API errors correctly', async () => {
    // Мокаем ошибку API
    server.use(
      http.get(
        'https://iabwkgppahudnaouwaep.supabase.co/rest/v1/sections',
        () => {
          return new Response(
            JSON.stringify({ message: 'Internal Server Error' }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
      )
    );

    const { result } = renderHook(() => useSections());

    // Ожидаем, что хук вернет ошибку
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
