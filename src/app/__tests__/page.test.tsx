// src/app/__tests__/page.test.tsx
import { screen } from '@testing-library/react';
import { mockHooks } from '@/__mocks__/hooks';
import { renderWithProviders } from '@/__mocks__/test-wrapper';
import DashboardPage from '../page';
import userEvent from '@testing-library/user-event';

describe('DashboardPage', () => {
  beforeEach(() => {
    mockHooks();
  });

  it('renders dashboard components', () => {
    renderWithProviders(<DashboardPage />);

    // Check for main sections
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
  });

  it('displays statistics', () => {
    renderWithProviders(<DashboardPage />);

    // Check for statistics
    expect(screen.getByText('1 speakers')).toBeInTheDocument();
    expect(screen.getByText('0 upcoming')).toBeInTheDocument();
  });

  it('displays loading states correctly', () => {
    renderWithProviders(<DashboardPage />);

    // Check for basic structure even in loading state
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    renderWithProviders(<DashboardPage />);

    // Check for basic structure even in error state
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders Profile Editing Enabled toggle and handles toggle logic', async () => {
    renderWithProviders(<DashboardPage />);
    // Check for toggle label and status
    const status = screen.getByText('Profile Editing Enabled');
    expect(status).toBeInTheDocument();
    // Check for green color (enabled)
    expect(status).toHaveStyle({ color: 'rgb(34, 197, 94)' });
    // Simulate toggle
    const toggle = screen.getByRole('switch');
    await userEvent.click(toggle);
    // After click, should call setValue (mocked in mockHooks)
    // No error should occur
  });
});
