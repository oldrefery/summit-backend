import * as React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders input with default styles', () => {
        render(<Input placeholder="Enter text" />);
        const input = screen.getByPlaceholderText('Enter text');

        expect(input).toBeInTheDocument();
        expect(input).toHaveClass('flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2');
    });

    it('applies additional className when provided', () => {
        render(<Input className="custom-class" placeholder="Test" />);
        const input = screen.getByPlaceholderText('Test');

        expect(input).toHaveClass('custom-class');
    });

    it('handles different input types', () => {
        const types = ['text', 'password', 'email', 'number'] as const;

        types.forEach((type) => {
            cleanup();
            render(<Input type={type} placeholder={`Type: ${type}`} />);
            const input = screen.getByPlaceholderText(`Type: ${type}`);

            expect(input).toHaveAttribute('type', type);
        });
    });

    it('handles user input correctly', async () => {
        const user = userEvent.setup();
        render(<Input placeholder="Type here" />);
        const input = screen.getByPlaceholderText('Type here');

        await user.type(input, 'Hello, World!');
        expect(input).toHaveValue('Hello, World!');
    });

    it('handles onChange events', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(<Input placeholder="Test" onChange={handleChange} />);
        const input = screen.getByPlaceholderText('Test');

        await user.type(input, 'a');
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(<Input disabled placeholder="Disabled" onChange={handleChange} />);
        const input = screen.getByPlaceholderText('Disabled');

        expect(input).toBeDisabled();
        await user.type(input, 'test');
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('forwards ref correctly', () => {
        const ref = React.createRef<HTMLInputElement>();
        render(<Input ref={ref} placeholder="Ref test" />);

        expect(ref.current).toBeInstanceOf(HTMLInputElement);
        expect(screen.getByPlaceholderText('Ref test')).toBe(ref.current);
    });

    it('spreads additional props to input element', () => {
        render(
            <Input
                placeholder="Test"
                data-testid="test-input"
                aria-label="Test input"
                maxLength={10}
            />
        );
        const input = screen.getByPlaceholderText('Test');

        expect(input).toHaveAttribute('data-testid', 'test-input');
        expect(input).toHaveAttribute('aria-label', 'Test input');
        expect(input).toHaveAttribute('maxLength', '10');
    });
}); 