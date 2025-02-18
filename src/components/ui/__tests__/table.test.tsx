import * as React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from '../table';

describe('Table Components', () => {
    afterEach(() => {
        cleanup();
    });

    describe('Table', () => {
        it('renders table with default styles', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>Test</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const table = screen.getByRole('table');
            expect(table).toBeInTheDocument();
            expect(table).toHaveClass('w-full caption-bottom text-sm');
            expect(table.parentElement).toHaveClass('relative w-full overflow-auto');
        });

        it('applies additional className to table', () => {
            render(
                <Table className="custom-class">
                    <TableBody>
                        <TableRow>
                            <TableCell>Test</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const table = screen.getByRole('table');
            expect(table).toHaveClass('custom-class');
        });
    });

    describe('TableHeader', () => {
        it('renders header with default styles', () => {
            render(
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Header</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            );

            const header = screen.getByRole('rowgroup');
            expect(header).toBeInTheDocument();
            expect(header).toHaveClass('[&_tr]:border-b');
        });

        it('applies additional className to header', () => {
            render(
                <Table>
                    <TableHeader className="custom-class">
                        <TableRow>
                            <TableHead>Header</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            );

            const header = screen.getByRole('rowgroup');
            expect(header).toHaveClass('custom-class');
        });
    });

    describe('TableBody', () => {
        it('renders body with default styles', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const body = screen.getByRole('rowgroup');
            expect(body).toBeInTheDocument();
            expect(body).toHaveClass('[&_tr:last-child]:border-0');
        });

        it('applies additional className to body', () => {
            render(
                <Table>
                    <TableBody className="custom-class">
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const body = screen.getByRole('rowgroup');
            expect(body).toHaveClass('custom-class');
        });
    });

    describe('TableFooter', () => {
        it('renders footer with default styles', () => {
            render(
                <Table>
                    <TableFooter>
                        <TableRow>
                            <TableCell>Footer</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            );

            const footer = screen.getByRole('rowgroup');
            expect(footer).toBeInTheDocument();
            expect(footer).toHaveClass('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0');
        });

        it('applies additional className to footer', () => {
            render(
                <Table>
                    <TableFooter className="custom-class">
                        <TableRow>
                            <TableCell>Footer</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            );

            const footer = screen.getByRole('rowgroup');
            expect(footer).toHaveClass('custom-class');
        });
    });

    describe('TableRow', () => {
        it('renders row with default styles', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const row = screen.getByRole('row');
            expect(row).toBeInTheDocument();
            expect(row).toHaveClass('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted');
        });

        it('applies additional className to row', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow className="custom-class">
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const row = screen.getByRole('row');
            expect(row).toHaveClass('custom-class');
        });

        it('applies selected state correctly', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow data-state="selected">
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const row = screen.getByRole('row');
            expect(row).toHaveAttribute('data-state', 'selected');
        });
    });

    describe('TableHead', () => {
        it('renders header cell with default styles', () => {
            render(
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Header</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            );

            const headerCell = screen.getByRole('columnheader');
            expect(headerCell).toBeInTheDocument();
            expect(headerCell).toHaveClass('h-12 px-4 text-left align-middle font-medium text-muted-foreground');
        });

        it('applies additional className to header cell', () => {
            render(
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="custom-class">Header</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            );

            const headerCell = screen.getByRole('columnheader');
            expect(headerCell).toHaveClass('custom-class');
        });

        it('adjusts padding when containing checkbox', () => {
            render(
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <input type="checkbox" role="checkbox" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            );

            const headerCell = screen.getByRole('columnheader');
            expect(headerCell).toHaveClass('[&:has([role=checkbox])]:pr-0');
        });
    });

    describe('TableCell', () => {
        it('renders cell with default styles', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const cell = screen.getByRole('cell');
            expect(cell).toBeInTheDocument();
            expect(cell).toHaveClass('p-4 align-middle');
        });

        it('applies additional className to cell', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="custom-class">Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const cell = screen.getByRole('cell');
            expect(cell).toHaveClass('custom-class');
        });

        it('adjusts padding when containing checkbox', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <input type="checkbox" role="checkbox" />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const cell = screen.getByRole('cell');
            expect(cell).toHaveClass('[&:has([role=checkbox])]:pr-0');
        });
    });

    describe('TableCaption', () => {
        it('renders caption with default styles', () => {
            render(
                <Table>
                    <TableCaption>Caption</TableCaption>
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const caption = screen.getByText('Caption');
            expect(caption).toBeInTheDocument();
            expect(caption).toHaveClass('mt-4 text-sm text-muted-foreground');
        });

        it('applies additional className to caption', () => {
            render(
                <Table>
                    <TableCaption className="custom-class">Caption</TableCaption>
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );

            const caption = screen.getByText('Caption');
            expect(caption).toHaveClass('custom-class');
        });
    });

    it('renders complex table structure correctly', () => {
        render(
            <Table>
                <TableCaption>Demo Table</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>John</TableCell>
                        <TableCell>Developer</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Jane</TableCell>
                        <TableCell>Designer</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={2}>Summary</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        );

        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Demo Table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength(2);
        expect(screen.getAllByRole('row')).toHaveLength(4);
        expect(screen.getAllByRole('cell')).toHaveLength(5);
    });
}); 