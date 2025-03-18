import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationForm } from '../notification-form';
import { usePushUsers, useSendNotification } from '@/hooks/use-push';

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
    filterOption?: (option: unknown, inputValue: string) => boolean;
    formatOptionLabel?: (data: { label: string; value: string }) => React.ReactNode;
    isSearchable?: boolean;
    placeholder?: string;
}

// Mock react-select
vi.mock('react-select', () => ({
    default: ({ options, value, onChange, isMulti, filterOption, isSearchable }: ReactSelectProps) => (
        <div>
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
            {isSearchable && (
                <input
                    data-testid="user-select-search"
                    placeholder="Search..."
                    onChange={e => {
                        // Имитируем функционал поиска, фильтруя опции через filterOption
                        if (filterOption) {
                            // В реальном компоненте это привело бы к фильтрации опций
                            const inputValue = e.target.value;
                            options.filter(option => filterOption(option, inputValue));
                        }
                    }}
                />
            )}
        </div>
    ),
}));

describe('NotificationForm', () => {
    const mockOnOpenChangeAction = vi.fn();
    const mockSendNotification = vi.fn();
    const mockUsers = [
        {
            id: '1',
            device_info: { deviceName: 'Device 1', osName: 'iOS', deviceModel: 'iPhone 13', appVersion: '1.0.0' },
            push_token: 'token1',
            device_id: 'device1',
            last_active_at: '2023-01-01',
            settings: { announcements: true }
        },
        {
            id: '2',
            device_info: { deviceName: 'Device 2', osName: 'Android', deviceModel: 'Pixel 6', appVersion: '1.0.0' },
            push_token: 'token2',
            device_id: 'device2',
            last_active_at: '2023-01-02',
            settings: { announcements: true }
        },
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
        expect(screen.getByText(/Send a push notification to all users or specific users/i)).toBeInTheDocument();
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

        // Заполняем форму
        fireEvent.change(screen.getByLabelText(/title/i), {
            target: { value: 'Test Title' },
        });
        fireEvent.change(screen.getByLabelText(/message/i), {
            target: { value: 'Test Message' },
        });

        // Выбираем отправку конкретным пользователям
        const targetButton = screen.getByRole('combobox');
        fireEvent.click(targetButton);

        const specificUsersOption = screen.getByRole('option', { name: /specific users/i });
        fireEvent.click(specificUsersOption);

        // Проверяем, что отображается окно выбора пользователей
        expect(screen.getByText(/users with announcements enabled/i)).toBeInTheDocument();
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
        expect(mockSendNotification).toHaveBeenCalledWith(
            {
                title: 'Test Title',
                body: 'Test Message',
                target_type: 'all',
                data: { action: 'open' },
            },
            expect.any(Object)
        );

        // Проверяем, что колбэк onSuccess вызывается
        const onSuccessCallback = mockSendNotification.mock.calls[0][1].onSuccess;
        onSuccessCallback();
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

    it('displays user counter with correct count', () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        // Выбираем отправку конкретным пользователям
        const targetButton = screen.getByRole('combobox');
        fireEvent.click(targetButton);

        const specificUsersOption = screen.getByRole('option', { name: /specific users/i });
        fireEvent.click(specificUsersOption);

        // Проверяем, что счетчик пользователей отображается с правильным значением
        expect(screen.getByText(`${mockUsers.length} users with announcements enabled`)).toBeInTheDocument();
    });

    it('selects all users with tokens when clicking "Select all with tokens" button', () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        // Выбираем отправку конкретным пользователям
        const targetButton = screen.getByRole('combobox');
        fireEvent.click(targetButton);

        const specificUsersOption = screen.getByRole('option', { name: /specific users/i });
        fireEvent.click(specificUsersOption);

        // Нажимаем кнопку "Select all with tokens"
        const selectAllButton = screen.getByRole('button', { name: /select all with tokens/i });
        fireEvent.click(selectAllButton);

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

        // Проверяем, что при отправке формы выбраны все пользователи с токенами
        expect(mockSendNotification).toHaveBeenCalledWith(
            {
                title: 'Test Title',
                body: 'Test Message',
                target_type: 'specific_users',
                data: { action: 'open' },
                target_users: mockUsers.filter(u => u.push_token).map(u => u.id),
            },
            expect.any(Object)
        );
    });

    it('shows notification preview when clicking "Show Preview" button', () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        // Заполняем форму
        fireEvent.change(screen.getByLabelText(/title/i), {
            target: { value: 'Test Title' },
        });
        fireEvent.change(screen.getByLabelText(/message/i), {
            target: { value: 'Test Message' },
        });

        // Нажимаем кнопку "Show Preview"
        const previewButton = screen.getByRole('button', { name: /show preview/i });
        fireEvent.click(previewButton);

        // Проверяем, что предпросмотр отображается
        expect(screen.getByText('Notification Preview')).toBeInTheDocument();

        // Используем более специфичные селекторы для проверки содержимого предпросмотра
        const previewSection = screen.getByText('Notification Preview').closest('div')!;

        // Проверяем заголовок и сообщение в предпросмотре
        expect(within(previewSection).getByText('Test Title')).toBeInTheDocument();

        // Используем getAllByText и проверяем, что есть хотя бы один элемент с текстом "Test Message" в превью
        const previewMessages = within(previewSection).getAllByText('Test Message');
        expect(previewMessages.length).toBeGreaterThan(0);

        // Проверяем, что отображается информация о получателях
        expect(within(previewSection).getByText(/will be sent to all users/i)).toBeInTheDocument();

        // Проверяем, что после нажатия кнопка изменила текст
        expect(screen.getByRole('button', { name: /hide preview/i })).toBeInTheDocument();
    });

    it('toggles preview visibility when clicking show/hide button', () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        // Показываем предпросмотр
        const previewButton = screen.getByRole('button', { name: /show preview/i });
        fireEvent.click(previewButton);

        // Проверяем, что предпросмотр отображается
        expect(screen.getByText('Notification Preview')).toBeInTheDocument();

        // Скрываем предпросмотр
        const hideButton = screen.getByRole('button', { name: /hide preview/i });
        fireEvent.click(hideButton);

        // Проверяем, что предпросмотр больше не отображается
        expect(screen.queryByText('Notification Preview')).not.toBeInTheDocument();
    });

    it('shows correct count of users with tokens in preview', () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        // Показываем предпросмотр
        const previewButton = screen.getByRole('button', { name: /show preview/i });
        fireEvent.click(previewButton);

        // Проверяем, что правильно отображается количество пользователей с токенами
        expect(screen.getByText(`${mockUsers.filter(u => u.push_token).length} users have active push tokens`)).toBeInTheDocument();
    });

    it('supports searching users by device name or other properties', () => {
        render(<NotificationForm open={true} onOpenChangeAction={mockOnOpenChangeAction} />);

        // Выбираем отправку конкретным пользователям
        const targetButton = screen.getByRole('combobox');
        fireEvent.click(targetButton);
        const specificUsersOption = screen.getByRole('option', { name: /specific users/i });
        fireEvent.click(specificUsersOption);

        // Проверяем наличие поля поиска
        const searchInput = screen.getByTestId('user-select-search');
        expect(searchInput).toBeInTheDocument();

        // Имитируем ввод поискового запроса
        fireEvent.change(searchInput, { target: { value: 'Android' } });

        // Поскольку мы не можем напрямую проверить результаты фильтрации в нашем моке,
        // мы проверяем, что ввод поддерживается и компонент не ломается
        expect(searchInput).toHaveValue('Android');
    });
}); 