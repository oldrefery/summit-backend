// src/app/__tests__/pages.smoke.test.tsx
import { mockHooks } from '@/__mocks__/hooks';
import { renderWithProviders } from '@/__mocks__/test-wrapper';

// Import all application pages for smoke testing
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

describe('Smoke tests for pages', () => {
  beforeEach(() => {
    mockHooks();
    // Reset window.location for each test
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });
  });

  // Dashboard tests
  describe('DashboardPage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<DashboardPage />);
    });
  });

  // Events page tests
  describe('EventsPage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<EventsPage />);
    });

    it('renders new event page without crashing', () => {
      renderWithProviders(<NewEventPage />);
    });
  });

  // Locations page tests
  describe('LocationsPage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<LocationsPage />);
    });
  });

  // Login page tests
  describe('LoginPage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<LoginPage />);
    });

    it('renders with correct test credentials', () => {
      const { getByPlaceholderText } = renderWithProviders(<LoginPage />);
      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/password/i);

      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });
  });

  // Notifications page tests
  describe('NotificationsPage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<NotificationsPage />);
    });

    it('displays test notification data', () => {
      const { getByText } = renderWithProviders(<NotificationsPage />);
      expect(getByText('Push Notifications')).toBeInTheDocument();
      expect(getByText('Notification History')).toBeInTheDocument();
    });
  });

  // Content pages tests
  describe('PagesPage', () => {
    it('renders pages list without crashing', () => {
      renderWithProviders(<PagesPage />);
    });

    it('renders new page form without crashing', () => {
      renderWithProviders(<NewPage />);
    });
  });

  // People page tests
  describe('PeoplePage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<PeoplePage />);
    });
  });

  // Resources page tests
  describe('ResourcesPage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<ResourcesPage />);
    });
  });

  // Sections page tests
  describe('SectionsPage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<SectionsPage />);
    });

    it('displays test section data', () => {
      const { getByText } = renderWithProviders(<SectionsPage />);
      expect(getByText('Test Item')).toBeInTheDocument();
      expect(getByText('No date')).toBeInTheDocument();
    });
  });

  // Versions page tests
  describe('VersionsPage', () => {
    it('renders without crashing', () => {
      renderWithProviders(<VersionsPage />);
    });

    it('displays test version data', () => {
      const { getByText } = renderWithProviders(<VersionsPage />);
      expect(getByText(/Version 1/)).toBeInTheDocument();
      expect(getByText(/Latest/)).toBeInTheDocument();
    });
  });
});
