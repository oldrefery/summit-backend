// src/mocks/handlers.ts
import { http } from 'msw';

const SUPABASE_URL = 'https://iabwkgppahudnaouwaep.supabase.co';

export const handlers = [
  // Мок для таблицы "people"
  http.get(`${SUPABASE_URL}/rest/v1/people`, () => {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          name: 'John Doe',
          role: 'speaker',
          title: 'CEO',
          company: 'Company A',
          bio: 'John is a seasoned speaker.',
          photo_url: 'https://example.com/john.jpg',
          country: 'USA',
          email: 'john@example.com',
          mobile: '+1234567890',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Jane Doe',
          role: 'attendee',
          title: 'CTO',
          company: 'Company B',
          bio: 'Jane is an experienced CTO.',
          photo_url: 'https://example.com/jane.jpg',
          country: 'Canada',
          email: 'jane@example.com',
          mobile: '+0987654321',
          created_at: '2023-01-02T00:00:00Z',
        },
      ]),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  // Мок для таблицы "events"
  http.get(`${SUPABASE_URL}/rest/v1/events`, () => {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          title: 'Event 1',
          date: '2023-10-01',
          start_time: '2023-10-01T10:00:00Z',
          end_time: '2023-10-01T12:00:00Z',
          description: 'This is Event 1',
          duration: '2 hours',
          section_id: 1,
          location_id: 1,
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          title: 'Event 2',
          date: '2023-10-02',
          start_time: '2023-10-02T14:00:00Z',
          end_time: '2023-10-02T16:00:00Z',
          description: 'This is Event 2',
          duration: '2 hours',
          section_id: 2,
          location_id: 2,
          created_at: '2023-01-02T00:00:00Z',
        },
      ]),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  // Мок для таблицы "resources"
  http.get(`${SUPABASE_URL}/rest/v1/resources`, () => {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          name: 'Resource 1',
          link: 'https://example.com/resource1',
          description: 'This is Resource 1',
          is_route: true,
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Resource 2',
          link: 'https://example.com/resource2',
          description: 'This is Resource 2',
          is_route: false,
          created_at: '2023-01-02T00:00:00Z',
        },
      ]),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  // Мок для таблицы "locations"
  http.get(`${SUPABASE_URL}/rest/v1/locations`, () => {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          name: 'Location 1',
          link_map: 'https://example.com/location1/map',
          link: 'https://example.com/location1',
          link_address: '123 Main St, City, Country',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Location 2',
          link_map: 'https://example.com/location2/map',
          link: 'https://example.com/location2',
          link_address: '456 Elm St, City, Country',
          created_at: '2023-01-02T00:00:00Z',
        },
      ]),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  // Мок для таблицы "sections"
  http.get(`${SUPABASE_URL}/rest/v1/sections`, () => {
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
  }),

  // Мок для таблицы "announcements"
  http.get(`${SUPABASE_URL}/rest/v1/announcements`, () => {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          person_id: 1,
          content: 'This is Announcement 1',
          published_at: '2023-01-01T00:00:00Z',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          person_id: 2,
          content: 'This is Announcement 2',
          published_at: '2023-01-02T00:00:00Z',
          created_at: '2023-01-02T00:00:00Z',
        },
      ]),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  // Мок для таблицы "markdown_pages"
  http.get(`${SUPABASE_URL}/rest/v1/markdown_pages`, () => {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          slug: 'page-1',
          title: 'Page 1',
          content: 'This is Page 1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          published: true,
        },
        {
          id: 2,
          slug: 'page-2',
          title: 'Page 2',
          content: 'This is Page 2',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          published: false,
        },
      ]),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  // Мок для таблицы "social_feed_posts"
  http.get(`${SUPABASE_URL}/rest/v1/social_feed_posts`, () => {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          author_id: 1,
          content: 'This is Post 1',
          timestamp: '2023-01-01T00:00:00Z',
          image_urls: ['https://example.com/post1.jpg'],
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          author_id: 2,
          content: 'This is Post 2',
          timestamp: '2023-01-02T00:00:00Z',
          image_urls: ['https://example.com/post2.jpg'],
          created_at: '2023-01-02T00:00:00Z',
        },
      ]),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),
];
