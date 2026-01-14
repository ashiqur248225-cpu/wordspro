'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAllWords } from '@/lib/db';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowUpDown, BookOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ErrorTypeFilter = 'all' | 'spelling' | 'meaning' | 'synonym-antonym';

export default function MistakenWordsPage() {
    const [allMistakenWords, setAllMistakenWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'totalWrongs', desc: true }]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [errorTypeFilter, setErrorTypeFilter] = useState<ErrorTypeFilter>('all');
    const router = useRouter();

    useEffect(() => {
        async function fetchMistakenWords() {
            try {
                const allWords = await getAllWords();
                const mistakenWords = allWords
                    .map(word => ({
                        ...word,
                        totalWrongs: (word.wrong_count?.spelling || 0) + (word.wrong_count?.meaning || 0) + (word.wrong_count?.synonym || 0) + (word.wrong_count?.antonym || 0),
                        totalSynonymAntonymWrongs: (word.wrong_count?.synonym || 0) + (word.wrong_count?.antonym || 0)
                    }))
                    .filter(word => word.totalWrongs > 0);
                
                setAllMistakenWords(mistakenWords);
            } catch (error) {
                console.error("Failed to fetch mistaken words:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchMistakenWords();
    }, []);
    
    const filteredWords = useMemo(() => {
        return allMistakenWords.filter(word => {
            if (errorTypeFilter === 'all') return true;
            if (errorTypeFilter === 'spelling') return (word.wrong_count?.spelling || 0) > 0;
            if (errorTypeFilter === 'meaning') return (word.wrong_count?.meaning || 0) > 0;
            if (errorTypeFilter === 'synonym-antonym') return ((word.wrong_count?.synonym || 0) + (word.wrong_count?.antonym || 0)) > 0;
            return true;
        });
    }, [allMistakenWords, errorTypeFilter]);

    const columns: ColumnDef<(Word & { totalWrongs: number, totalSynonymAntonymWrongs: number })>[] = [
        {
            accessorKey: 'word',
            header: 'Word',
            cell: ({ row }) => (
                 <Link href={`/words/${row.original.id}`} className="font-medium text-primary hover:underline">
                    {row.getValue('word')}
                </Link>
            )
        },
        {
            accessorKey: 'partOfSpeech',
            header: 'Part of Speech',
            cell: ({ row }) => <Badge variant="outline">{row.original.partOfSpeech}</Badge>
        },
        {
            accessorKey: 'totalWrongs',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-center w-full"
                >
                    Total Wrongs
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
             cell: ({ row }) => <div className="text-center font-bold text-red-500">{row.original.totalWrongs}</div>
        },
        {
            accessorKey: 'wrong_count.spelling',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                     className="text-center w-full"
                >
                    Spelling Errors
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-center">{row.original.wrong_count?.spelling || 0}</div>
        },
        {
            accessorKey: 'wrong_count.meaning',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                     className="text-center w-full"
                >
                    Meaning Errors
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-center">{row.original.wrong_count?.meaning || 0}</div>
        },
        {
            accessorKey: 'totalSynonymAntonymWrongs',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                     className="text-center w-full"
                >
                    Syn/Ant Errors
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-center">{row.original.totalSynonymAntonymWrongs}</div>
        }
    ];

    const table = useReactTable({
        data: filteredWords,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            globalFilter,
        },
    });

    if (loading) {
        return (
             <div className="p-4 md:p-6">
                 <div className="h-64 w-full bg-muted animate-pulse rounded-lg"></div>
             </div>
        )
    }

    return (
         <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-x-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">All Mistaken Words</h1>
                    <p className="text-muted-foreground">A complete list of words you've made mistakes on.</p>
                </div>
            </div>
            {allMistakenWords.length === 0 ? (
                 <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
                    <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Mistakes Found</h3>
                        <p className="mb-4 mt-2 text-sm text-muted-foreground">
                            Great job! You haven't made any mistakes yet. Keep learning!
                        </p>
                    </div>
                </div>
            ) : (
                <div>
                     <div className="flex items-center py-4 gap-2">
                        <Input
                            placeholder="Filter words..."
                            value={globalFilter}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="max-w-sm"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 gap-1">
                                    <Filter className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Filter</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                                <DropdownMenuLabel>Filter by Error Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={errorTypeFilter} onValueChange={(v) => setErrorTypeFilter(v as ErrorTypeFilter)}>
                                    <DropdownMenuRadioItem value="all">All Errors</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="spelling">Spelling Errors</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="meaning">Meaning Errors</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="synonym-antonym">Synonym/Antonym Errors</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableHead>
                                    )
                                    })}
                                </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        onClick={() => router.push(`/words/${row.original.id}`)}
                                        className="cursor-pointer"
                                    >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} onClick={(e) => cell.column.id !== 'word' ? null : e.stopPropagation()}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                    </TableRow>
                                ))
                                ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                    </TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
