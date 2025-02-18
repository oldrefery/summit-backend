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

// Мокаем хуки
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
      data: [{ id: 1, name: 'Test Section' }],
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
          duration: null,
          location_id: null,
          section_id: 1,
          speaker_ids: [],
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
    const confirmSpy = vi.spyOn(window, 'confirm');
    renderEventForm();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/events');

    confirmSpy.mockRestore();
  });
});
