// src/components/events/__tests__/event-form.test.tsx
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { EventForm } from '../event-form';
import { createTestData, mockHooks } from '@/__mocks__/hooks';
import { renderWithProviders } from '@/__mocks__/test-wrapper';
import { mockMutation } from '@/__mocks__/test-submit-setup';

// Моки с тестовыми данными
const mockLocations = [createTestData.location()];
const mockSections = [createTestData.section()];
const mockPeople = [createTestData.person({ role: 'speaker' })];

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/hooks/use-events', () => ({
  useEvents: () => ({
    data: [],
    isLoading: false,
    createEvent: mockMutation,
    updateEvent: mockMutation,
  }),
}));

vi.mock('@/hooks/use-locations', () => ({
  useLocations: () => ({
    data: mockLocations,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-sections', () => ({
  useSections: () => ({
    data: mockSections,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-query', () => ({
  usePeople: () => ({
    data: mockPeople,
    isLoading: false,
  }),
}));

describe('EventForm', () => {
  const mockOnSuccess = vi.fn();

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
      // Заполняем форму валидными данными
      const titleInput = screen.getByLabelText('Title');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');

      fireEvent.change(titleInput, { target: { value: 'New Test Event' } });
      fireEvent.change(startTimeInput, { target: { value: '10:00' } });
      fireEvent.change(endTimeInput, { target: { value: '11:00' } });

      // Отправляем форму через кнопку submit
      const submitButton = screen.getByRole('button', {
        name: /create event/i,
      });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalled();
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
      // Вносим изменения в форму
      const titleInput = screen.getByLabelText('Title');
      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });

      // Нажимаем кнопку отмены
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
