// src/app/__tests__/pages.smoke.test.tsx
import { mockHooks } from '@/__mocks__/hooks';
import { renderWithProviders } from '@/__mocks__/test-wrapper';

// Импортируем страницы
import DashboardPage from '@/app/page';
import EventsPage from '@/app/events/page';
import NewEventPage from '@/app/events/new/page';
import LocationsPage from '@/app/locations/page';
import LoginPage from '@/app/login/page';
import NotificationsPage from '@/app/notifications/page';
import PagesPage from '@/app/pages/page';
import NewPage from '@/app/pages/new/page';
import PeoplePage from '@/app/people/page';
import ResourcesPage from '@/app/resources/page';
import SectionsPage from '@/app/sections/page';
import VersionsPage from '@/app/versions/page';

beforeEach(() => {
  mockHooks();
});

describe('Smoke tests for pages', () => {
  it('Dashboard page renders without crashing', () => {
    renderWithProviders(<DashboardPage />);
  });

  it('Events page renders without crashing', () => {
    renderWithProviders(<EventsPage />);
  });

  it('New Event page renders without crashing', () => {
    renderWithProviders(<NewEventPage />);
  });

  it('Locations page renders without crashing', () => {
    renderWithProviders(<LocationsPage />);
  });

  it('Login page renders without crashing', () => {
    renderWithProviders(<LoginPage />);
  });

  it('Notifications page renders without crashing', () => {
    renderWithProviders(<NotificationsPage />);
  });

  it('Pages page renders without crashing', () => {
    renderWithProviders(<PagesPage />);
  });

  it('New Page renders without crashing', () => {
    renderWithProviders(<NewPage />);
  });

  it('People page renders without crashing', () => {
    renderWithProviders(<PeoplePage />);
  });

  it('Resources page renders without crashing', () => {
    renderWithProviders(<ResourcesPage />);
  });

  it('Sections page renders without crashing', () => {
    renderWithProviders(<SectionsPage />);
  });

  it('Versions page renders without crashing', () => {
    renderWithProviders(<VersionsPage />);
  });
});
