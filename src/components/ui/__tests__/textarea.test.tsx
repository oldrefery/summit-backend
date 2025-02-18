import * as React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders textarea with default styles', () => {
        render(<Textarea placeholder="Enter text" />);
        const textarea = screen.getByPlaceholderText('Enter text');

        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveClass('flex min-h-[80px] w-full rounded-md border border-input bg-secondary');
    });

    it('applies additional className when provided', () => {
        render(<Textarea className="custom-class" placeholder="Test" />);
        const textarea = screen.getByPlaceholderText('Test');

        expect(textarea).toHaveClass('custom-class');
    });

    it('handles user input correctly', async () => {
        const user = userEvent.setup();
        render(<Textarea placeholder="Type here" />);
        const textarea = screen.getByPlaceholderText('Type here');

        await user.type(textarea, 'Hello, World!');
        expect(textarea).toHaveValue('Hello, World!');
    });

    it('handles onChange events', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(<Textarea placeholder="Test" onChange={handleChange} />);
        const textarea = screen.getByPlaceholderText('Test');

        await user.type(textarea, 'a');
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(<Textarea disabled placeholder="Disabled" onChange={handleChange} />);
        const textarea = screen.getByPlaceholderText('Disabled');

        expect(textarea).toBeDisabled();
        expect(textarea).toHaveClass('disabled:cursor-not-allowed');
        expect(textarea).toHaveClass('disabled:opacity-50');

        await user.type(textarea, 'test');
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('forwards ref correctly', () => {
        const ref = React.createRef<HTMLTextAreaElement>();
        render(<Textarea ref={ref} placeholder="Ref test" />);

        expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
        expect(screen.getByPlaceholderText('Ref test')).toBe(ref.current);
    });

    it('spreads additional props to textarea element', () => {
        render(
            <Textarea
                placeholder="Test"
                data-testid="test-textarea"
                aria-label="Test textarea"
                maxLength={100}
                rows={5}
            />
        );
        const textarea = screen.getByPlaceholderText('Test');

        expect(textarea).toHaveAttribute('data-testid', 'test-textarea');
        expect(textarea).toHaveAttribute('aria-label', 'Test textarea');
        expect(textarea).toHaveAttribute('maxLength', '100');
        expect(textarea).toHaveAttribute('rows', '5');
    });

    it('handles multiline input correctly', async () => {
        const user = userEvent.setup();
        render(<Textarea placeholder="Type here" />);
        const textarea = screen.getByPlaceholderText('Type here');

        const multilineText = 'First line\nSecond line\nThird line';
        await user.type(textarea, multilineText);

        expect(textarea).toHaveValue(multilineText);
    });
}); 