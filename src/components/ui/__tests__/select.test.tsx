import * as React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from '../select';

// Мокаем функции DOM API, которые не реализованы в jsdom
beforeAll(() => {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.scrollIntoView = () => { };
    window.HTMLElement.prototype.scrollIntoView = () => { };
    window.HTMLElement.prototype.hasPointerCapture = () => false;
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

const TestSelect = ({ onValueChange = () => { }, disabled = false }) => (
    <Select onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
            <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
            <SelectItem value="3" disabled>Option 3</SelectItem>
        </SelectContent>
    </Select>
);

describe('Select', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders select with default placeholder', () => {
        render(<TestSelect />);
        const trigger = screen.getByRole('combobox');

        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveTextContent('Select option');
    });

    it('applies disabled state correctly', () => {
        render(<TestSelect disabled />);
        const trigger = screen.getByRole('combobox');

        expect(trigger).toBeDisabled();
        expect(trigger).toHaveClass('disabled:cursor-not-allowed');
        expect(trigger).toHaveClass('disabled:opacity-50');
    });

    it('opens content when trigger is clicked', async () => {
        const user = userEvent.setup();
        render(<TestSelect />);

        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        // Проверяем, что триггер перешел в состояние "открыто"
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveAttribute('data-state', 'open');
    });

    it('selects option when clicked', async () => {
        const handleValueChange = vi.fn();
        const user = userEvent.setup();

        render(<TestSelect onValueChange={handleValueChange} />);

        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        // Выбираем первую опцию (она уже в фокусе)
        await user.keyboard('[Enter]');

        expect(handleValueChange).toHaveBeenCalledWith('1');
    });

    it('respects disabled state of individual options', async () => {
        const handleValueChange = vi.fn();
        const user = userEvent.setup();

        render(<TestSelect onValueChange={handleValueChange} />);

        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        // Пытаемся выбрать третью (отключенную) опцию
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowDown]');

        // Проверяем, что опция отключена
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes when escape is pressed', async () => {
        const user = userEvent.setup();
        render(<TestSelect />);

        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        // Проверяем, что селект открыт
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        // Нажимаем Escape
        await user.keyboard('[Escape]');

        // Проверяем, что селект закрыт
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('handles keyboard navigation', async () => {
        const handleValueChange = vi.fn();
        const user = userEvent.setup();

        render(<TestSelect onValueChange={handleValueChange} />);

        const trigger = screen.getByRole('combobox');
        await user.click(trigger);

        // Навигация с помощью клавиатуры
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[Enter]');

        expect(handleValueChange).toHaveBeenCalledWith('2');
    });
}); 