import * as React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '../dialog';

// Мокаем функции DOM API, которые не реализованы в jsdom
beforeAll(() => {
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

const TestDialog = ({ defaultOpen = false, onOpenChange = () => { } }) => (
    <Dialog defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Test Dialog</DialogTitle>
                <DialogDescription>This is a test dialog</DialogDescription>
            </DialogHeader>
            <div>Dialog content</div>
            <DialogFooter>
                <DialogClose>Close Dialog</DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const TestDialogWithChildren: React.FC<{ defaultOpen?: boolean; children?: React.ReactNode }> = ({ defaultOpen, children }) => (
    <Dialog defaultOpen={defaultOpen}>
        <DialogContent>
            {children}
        </DialogContent>
    </Dialog>
);

describe('Dialog Components', () => {
    afterEach(() => {
        cleanup();
    });

    describe('Dialog', () => {
        it('renders dialog trigger button', () => {
            render(<TestDialog />);
            const trigger = screen.getByText('Open Dialog');
            expect(trigger).toBeInTheDocument();
        });

        it('opens dialog when trigger is clicked', async () => {
            const user = userEvent.setup();
            render(<TestDialog />);

            const trigger = screen.getByText('Open Dialog');
            await user.click(trigger);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Test Dialog')).toBeInTheDocument();
            expect(screen.getByText('This is a test dialog')).toBeInTheDocument();
        });

        it('closes dialog when close button is clicked', async () => {
            const user = userEvent.setup();
            render(<TestDialog defaultOpen />);

            const closeButton = screen.getByText('Close Dialog');
            await user.click(closeButton);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('calls onOpenChange when dialog state changes', async () => {
            const handleOpenChange = vi.fn();
            const user = userEvent.setup();
            render(<TestDialog onOpenChange={handleOpenChange} />);

            const trigger = screen.getByText('Open Dialog');
            await user.click(trigger);

            expect(handleOpenChange).toHaveBeenCalledWith(true);

            const closeButton = screen.getByText('Close Dialog');
            await user.click(closeButton);

            expect(handleOpenChange).toHaveBeenCalledWith(false);
        });
    });

    describe('DialogContent', () => {
        it('renders with default styles', () => {
            render(<TestDialog defaultOpen />);
            const dialog = screen.getByRole('dialog');

            expect(dialog).toHaveClass('fixed left-[50%] top-[50%] z-50');
            expect(dialog).toHaveClass('bg-white dark:bg-gray-800');
        });

        it('applies additional className', () => {
            render(
                <Dialog defaultOpen>
                    <DialogContent className="custom-class">
                        <div>Content</div>
                    </DialogContent>
                </Dialog>
            );

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveClass('custom-class');
        });

        it('renders close button with icon', () => {
            render(<TestDialog defaultOpen />);
            const closeButtons = screen.getAllByRole('button', { name: /close/i });
            const closeButtonWithIcon = closeButtons.find(button =>
                button.classList.contains('absolute') &&
                button.classList.contains('right-4') &&
                button.classList.contains('top-4')
            );

            expect(closeButtonWithIcon).toBeInTheDocument();
            expect(closeButtonWithIcon).toHaveClass('absolute right-4 top-4');
            expect(closeButtonWithIcon?.querySelector('svg')).toBeInTheDocument();
        });
    });

    describe('DialogHeader', () => {
        it('renders with default styles', () => {
            render(<TestDialog defaultOpen />);
            const header = screen.getByRole('dialog').querySelector('div');

            expect(header).toHaveClass('flex flex-col space-y-1.5');
            expect(header).toHaveClass('text-center sm:text-left');
        });

        it('applies additional className', () => {
            render(
                <Dialog defaultOpen>
                    <DialogContent>
                        <DialogHeader className="custom-class">
                            <DialogTitle>Title</DialogTitle>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            );

            const header = screen.getByRole('dialog').querySelector('div');
            expect(header).toHaveClass('custom-class');
        });
    });

    describe('DialogFooter', () => {
        it('renders with default styles', () => {
            render(
                <TestDialogWithChildren defaultOpen>
                    <DialogFooter data-testid="dialog-footer">
                        <button>Close</button>
                    </DialogFooter>
                </TestDialogWithChildren>
            );

            const footer = screen.getByTestId('dialog-footer');
            expect(footer).toHaveClass('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2');
        });

        it('applies additional className', () => {
            render(
                <TestDialogWithChildren defaultOpen>
                    <DialogFooter className="custom-class" data-testid="dialog-footer">
                        <button>Close</button>
                    </DialogFooter>
                </TestDialogWithChildren>
            );

            const footer = screen.getByTestId('dialog-footer');
            expect(footer).toHaveClass('custom-class');
        });
    });

    describe('DialogTitle', () => {
        it('renders with default styles', () => {
            render(<TestDialog defaultOpen />);
            const title = screen.getByText('Test Dialog');

            expect(title).toHaveClass('text-lg font-semibold leading-none tracking-tight');
        });

        it('applies additional className', () => {
            render(
                <Dialog defaultOpen>
                    <DialogContent>
                        <DialogTitle className="custom-class">Title</DialogTitle>
                    </DialogContent>
                </Dialog>
            );

            const title = screen.getByText('Title');
            expect(title).toHaveClass('custom-class');
        });
    });

    describe('DialogDescription', () => {
        it('renders with default styles', () => {
            render(<TestDialog defaultOpen />);
            const description = screen.getByText('This is a test dialog');

            expect(description).toHaveClass('text-sm text-muted-foreground');
        });

        it('applies additional className', () => {
            render(
                <Dialog defaultOpen>
                    <DialogContent>
                        <DialogDescription className="custom-class">Description</DialogDescription>
                    </DialogContent>
                </Dialog>
            );

            const description = screen.getByText('Description');
            expect(description).toHaveClass('custom-class');
        });
    });

    it('handles keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleOpenChange = vi.fn();
        render(<TestDialog onOpenChange={handleOpenChange} />);

        // Открываем диалог
        const trigger = screen.getByText('Open Dialog');
        await user.click(trigger);
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Закрываем по Escape
        await user.keyboard('[Escape]');
        expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
}); 