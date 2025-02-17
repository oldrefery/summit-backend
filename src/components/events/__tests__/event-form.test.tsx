// src/components/events/__tests__/event-form.test.tsx
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { EventForm } from '../event-form';
import { createTestData, mockHooks } from '@/__mocks__/hooks';
import { renderWithProviders } from '@/__mocks__/test-wrapper';
import { mockMutation } from '@/__mocks__/test-submit-setup';
import { TestDateUtils } from '@/__mocks__/test-constants';
import { FORM_VALIDATION } from '@/app/constants';

// Mock navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock hooks
vi.mock('@/hooks/use-events', () => ({
  useEvents: () => ({
    data: [],
    isLoading: false,
    createEvent: mockMutation,
    updateEvent: mockMutation,
  }),
}));

const mockShowError = vi.fn();

const mockLocations = [
  { id: '1', name: 'Location 1' },
  { id: '2', name: 'Location 2' },
];

// Initialize test data using mock factories with dynamic dates
const mockSections = [createTestData.section()];
const mockPeople = [createTestData.person({ role: 'speaker' })];

describe('EventForm', () => {
  const mockOnSuccess = vi.fn();

  // Prepare test data using date utilities
  const testDate = TestDateUtils.getBaseTestDate();
  const formattedDate = TestDateUtils.formatDate(testDate);
  const startTime = '10:00';
  const endTime = '11:00';

  vi.mock('@/hooks/use-locations', () => ({
    useLocations: () => ({
      data: mockLocations,
      isLoading: false,
    }),
  }));

  vi.mock('@/hooks/use-sections', () => ({
    useSections: () => ({
      data: [createTestData.section()],
      isLoading: false,
    }),
  }));

  vi.mock('@/hooks/use-query', () => ({
    usePeople: () => ({
      data: mockPeople,
      isLoading: false,
    }),
  }));

  beforeEach(() => {
    mockHooks();
    vi.clearAllMocks();
    mockPush.mockClear();
    mockMutation.mutateAsync.mockClear();
    mockOnSuccess.mockClear();
  });

  it('renders empty form for new event', () => {
    renderWithProviders(<EventForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
    expect(screen.getByLabelText('End Time')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Create Event/i })
    ).toBeInTheDocument();
  });

  it('validates form submission', async () => {
    renderWithProviders(<EventForm onSuccess={mockOnSuccess} />);

    await act(async () => {
      // Fill form with valid test data
      const titleInput = screen.getByLabelText('Title');
      const dateInput = screen.getByLabelText('Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');

      fireEvent.change(titleInput, { target: { value: 'New Test Event' } });
      fireEvent.change(dateInput, { target: { value: formattedDate } });
      fireEvent.change(startTimeInput, { target: { value: startTime } });
      fireEvent.change(endTimeInput, { target: { value: endTime } });

      // Submit form using the submit button
      const submitButton = screen.getByRole('button', {
        name: /create event/i,
      });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith({
        title: 'New Test Event',
        date: formattedDate,
        start_time: `${formattedDate}T${startTime}:00Z`,
        end_time: `${formattedDate}T${endTime}:00Z`,
        description: null,
        duration: null,
        location_id: null,
        section_id: 1,
        speaker_ids: [],
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/events');
    });
  });

  it('shows confirmation dialog on cancel with unsaved changes', async () => {
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockImplementation(() => true);

    renderWithProviders(<EventForm onSuccess={mockOnSuccess} />);

    await act(async () => {
      // Make changes to the form
      const titleInput = screen.getByLabelText('Title');
      const dateInput = screen.getByLabelText('Date');

      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });
      fireEvent.change(dateInput, { target: { value: formattedDate } });

      // Click the cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      expect(mockPush).toHaveBeenCalledWith('/events');
    });

    confirmSpy.mockRestore();
  });

  it('does not show confirmation dialog on cancel without changes', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');

    renderWithProviders(<EventForm onSuccess={mockOnSuccess} />);

    await act(async () => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/events');
    });

    confirmSpy.mockRestore();
  });
});
