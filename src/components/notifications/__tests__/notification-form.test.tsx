import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationForm } from '../notification-form';
import { usePushUsers, useSendNotification } from '@/hooks/use-push';
import { createTestData } from '@/__mocks__/hooks';

// Mock the hooks
vi.mock('@/hooks/use-push', () => ({
    usePushUsers: vi.fn(),
    useSendNotification: vi.fn(),
}));

interface ReactSelectProps {
    options: Array<{ label: string; value: string }>;
    value?: Array<{ label: string; value: string }>;
    onChange: (selected: Array<{ label: string; value: string }> | null) => void;
    isMulti?: boolean;
}

// Mock react-select
vi.mock('react-select', () => ({
    default: ({ options, value, onChange, isMulti }: ReactSelectProps) => (
        <select
            data-testid="user-select"
            multiple={isMulti}
            value={value?.map(v => v.value) || []}
            onChange={e => {
                const selectedOptions = Array.from(e.target.selectedOptions).map(
                    option => options.find(o => o.value === option.value)
                ).filter((o): o is { label: string; value: string } => o !== undefined);
                onChange(isMulti ? selectedOptions : null);
            }}
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    ),
}));

describe('NotificationForm', () => {
    const mockOnOpenChangeAction = vi.fn();
    const mockSendNotification = vi.fn();
    const mockUsers = [
        createTestData.pushUser({ id: 1 }),
        createTestData.pushUser({ id: 2 }),
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        (usePushUsers as jest.Mock).mockReturnValue({
            data: mockUsers,
        });

        (useSendNotification as jest.Mock).mockReturnValue({
            mutate: mockSendNotification,
            isPending: false,
        });
    });

    it('renders form correctly', () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        expect(screen.getByText('Send Push Notification')).toBeInTheDocument();
        expect(screen.getByText('Fill in the notification details below.')).toBeInTheDocument();
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
        expect(screen.getByText(/send to/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send notification/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        const submitButton = screen.getByRole('button', { name: /send notification/i });
        fireEvent.click(submitButton);

        // Проверяем, что форма не отправляется без заполненных обязательных полей
        expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('handles target type change', async () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        // Выбираем отправку конкретным пользователям
        const targetButton = screen.getByRole('combobox');
        fireEvent.click(targetButton);

        const specificUsersOption = screen.getByRole('option', { name: /specific users/i });
        fireEvent.click(specificUsersOption);

        // Проверяем, что кнопка отправки отключена, пока не выбраны пользователи
        const submitButton = screen.getByRole('button', { name: /send notification/i });
        expect(submitButton).toBeDisabled();
    });

    it('handles successful notification send to all users', async () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        // Заполняем форму
        fireEvent.change(screen.getByLabelText(/title/i), {
            target: { value: 'Test Title' },
        });
        fireEvent.change(screen.getByLabelText(/message/i), {
            target: { value: 'Test Message' },
        });

        // Отправляем форму
        const submitButton = screen.getByRole('button', { name: /send notification/i });
        fireEvent.click(submitButton);

        // Проверяем, что уведомление отправлено с правильными данными
        expect(mockSendNotification).toHaveBeenCalledWith({
            title: 'Test Title',
            body: 'Test Message',
            target_type: 'all',
            data: { action: 'open' },
        });

        // Проверяем, что форма закрылась
        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });

    it('disables submit button while sending', () => {
        (useSendNotification as jest.Mock).mockReturnValue({
            mutate: mockSendNotification,
            isPending: true,
        });

        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        const submitButton = screen.getByRole('button', { name: /sending/i });
        expect(submitButton).toBeDisabled();
    });

    it('handles form cancellation', () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(mockOnOpenChangeAction).toHaveBeenCalledWith(false);
    });
}); 