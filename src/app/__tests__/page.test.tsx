// src/app/__tests__/page.test.tsx
import { screen } from '@testing-library/react';
import DashboardPage from '../page';
import { mockHooks } from '@/__mocks__/hooks';
import { renderWithProviders } from '@/__mocks__/test-wrapper';

// Mock hooks
beforeEach(() => {
  mockHooks();
});

describe('DashboardPage', () => {
  it('renders the Dashboard header', () => {
    renderWithProviders(<DashboardPage />);
    const header = screen.getByRole('heading', { level: 1 });
    expect(header).toHaveTextContent('Dashboard');
  });

  it('renders Quick Actions buttons', () => {
    renderWithProviders(<DashboardPage />);
    const addPersonButton = screen.getByRole('button', {
      name: /Add New Person/i,
    });
    const createEventButton = screen.getByRole('button', {
      name: /Create Event/i,
    });
    const publishVersionButton = screen.getByRole('button', {
      name: /Publish New Version/i,
    });

    expect(addPersonButton).toBeInTheDocument();
    expect(createEventButton).toBeInTheDocument();
    expect(publishVersionButton).toBeInTheDocument();
  });
});
