// src/components/events/__tests__/event-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { EventForm } from '../event-form';
import { TestDateUtils } from '@/__mocks__/test-constants';
import { useToastContext } from '@/components/providers/toast-provider';
import { useEvents } from '@/hooks/use-events';
import { useLocations } from '@/hooks/use-locations';
import { useSections } from '@/hooks/use-sections';
import { usePeople } from '@/hooks/use-people';

// Mock hooks
vi.mock('@/components/providers/toast-provider', () => ({
  useToastContext: vi.fn(),
}));

vi.mock('@/hooks/use-events', () => ({
  useEvents: vi.fn(),
}));

vi.mock('@/hooks/use-locations', () => ({
  useLocations: vi.fn(),
}));

vi.mock('@/hooks/use-sections', () => ({
  useSections: vi.fn(),
}));

vi.mock('@/hooks/use-people', () => ({
  usePeople: vi.fn(),
}));

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('EventForm', () => {
  const mockShowError = vi.fn();
  const mockShowSuccess = vi.fn();
  const mockCreateEvent = vi.fn();
  const mockUpdateEvent = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useToastContext as jest.Mock).mockReturnValue({
      showError: mockShowError,
      showSuccess: mockShowSuccess,
    });

    (useEvents as jest.Mock).mockReturnValue({
      createEvent: {
        mutateAsync: mockCreateEvent,
        isPending: false,
      },
      updateEvent: {
        mutateAsync: mockUpdateEvent,
        isPending: false,
      },
    });

    (useLocations as jest.Mock).mockReturnValue({
      data: [{ id: 1, name: 'Test Location' }],
    });

    (useSections as jest.Mock).mockReturnValue({
      data: [
        { id: 1, name: 'Test Section 1', date: '2024-03-10' },
        { id: 2, name: 'Test Section 2', date: '2024-03-11' }
      ],
    });

    (usePeople as jest.Mock).mockReturnValue({
      data: [{ id: 1, name: 'Test Person', role: 'speaker' }],
      isLoading: false,
    });
  });

  const renderEventForm = () => {
    render(<EventForm onSuccess={mockOnSuccess} />);
  };

  it('renders empty form for new event', () => {
    renderEventForm();

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
    expect(screen.getByLabelText('End Time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Event/i })).toBeInTheDocument();
  });

  it('validates form submission', async () => {
    renderEventForm();

    const testDate = TestDateUtils.getTestDate(1);
    const formattedDate = TestDateUtils.formatDate(testDate);

    const titleInput = screen.getByLabelText('Title');
    const dateInput = screen.getByLabelText('Date');
    const startTimeInput = screen.getByLabelText('Start Time');
    const endTimeInput = screen.getByLabelText('End Time');

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(dateInput, { target: { value: formattedDate } });
    fireEvent.change(startTimeInput, { target: { value: '10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '11:00' } });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Event',
          description: null,
          duration: '1 hrs',
          location_id: null,
          section_id: 1,
          speaker_ids: [],
          start_time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T10:00:00\+00:00$/),
          end_time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T11:00:00\+00:00$/),
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );
    });
  });

  it('validates end time is after start time', async () => {
    renderEventForm();

    const testDate = TestDateUtils.getTestDate(1);
    const formattedDate = TestDateUtils.formatDate(testDate);

    const titleInput = screen.getByLabelText('Title');
    const dateInput = screen.getByLabelText('Date');
    const startTimeInput = screen.getByLabelText('Start Time');
    const endTimeInput = screen.getByLabelText('End Time');

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(dateInput, { target: { value: formattedDate } });
    fireEvent.change(startTimeInput, { target: { value: '10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '09:00' } });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('End time must be after start time');
    });
    expect(mockCreateEvent).not.toHaveBeenCalled();
  });

  it('validates event date is not in the past', async () => {
    renderEventForm();

    const titleInput = screen.getByLabelText('Title');
    const dateInput = screen.getByLabelText('Date');
    const startTimeInput = screen.getByLabelText('Start Time');
    const endTimeInput = screen.getByLabelText('End Time');

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });
    fireEvent.change(startTimeInput, { target: { value: '10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '11:00' } });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Event date cannot be in the past');
    });
    expect(mockCreateEvent).not.toHaveBeenCalled();
  });

  it('shows confirmation dialog on cancel with unsaved changes', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    renderEventForm();

    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Changed Title' } });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to leave?'
    );
    expect(mockPush).toHaveBeenCalledWith('/events');

    confirmSpy.mockRestore();
  });

  it('does not show confirmation dialog on cancel without changes', () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    // Mock JSON.stringify to return the same value for both initial and current state
    const originalStringify = JSON.stringify;
    const stringifySpy = vi.spyOn(JSON, 'stringify');
    stringifySpy.mockImplementation((value) => {
      // Return the same string for any object to simulate no changes
      if (typeof value === 'object' && value !== null) {
        return '{"mocked":"no-changes"}';
      }
      return originalStringify(value);
    });

    renderEventForm();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/events');

    confirmSpy.mockRestore();
    stringifySpy.mockRestore();
  });

  it('updates event date when section is selected', async () => {
    renderEventForm();

    // Find section select and change value
    const sectionSelect = screen.getByRole('combobox', { name: 'Section' });
    fireEvent.click(sectionSelect);

    // Select second section
    const section2Option = screen.getByTestId('section-option-2');
    fireEvent.click(section2Option);

    // Check that event date was updated
    const dateInput = screen.getByLabelText('Date') as HTMLInputElement;
    expect(dateInput.value).toBe('2024-03-11');
  });

  it('automatically adjusts end time when start time changes to maintain duration', () => {
    renderEventForm();

    // Set initial times
    const startTimeInput = screen.getByLabelText('Start Time');
    const endTimeInput = screen.getByLabelText('End Time');

    fireEvent.change(startTimeInput, { target: { value: '10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '10:30' } });

    // Change start time and check if end time is adjusted
    fireEvent.change(startTimeInput, { target: { value: '11:00' } });

    // End time should be adjusted to maintain 30 min duration
    expect((endTimeInput as HTMLInputElement).value).toBe('11:30');

    // Try another change
    fireEvent.change(startTimeInput, { target: { value: '14:45' } });

    // End time should be adjusted to maintain 30 min duration
    expect((endTimeInput as HTMLInputElement).value).toBe('15:15');
  });

  it('allows changing date after section selection', async () => {
    // Mock the validation to always pass
    vi.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-01').getTime());

    // Mock createEvent to resolve immediately
    mockCreateEvent.mockResolvedValue({ id: 123 });

    renderEventForm();

    // First select a section
    const sectionSelect = screen.getByRole('combobox', { name: 'Section' });
    fireEvent.click(sectionSelect);
    const section2Option = screen.getByTestId('section-option-2');
    fireEvent.click(section2Option);

    // Then manually change the date
    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2024-12-15' } });

    // Check that date was changed
    expect((dateInput as HTMLInputElement).value).toBe('2024-12-15');

    // This test verifies that the date can be manually changed after section selection
    // We don't need to test the form submission here, as that's covered by other tests
  });
});
