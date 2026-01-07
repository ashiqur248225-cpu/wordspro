'use client';
import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTemplate } from '@/components/page-template';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { Word, WordDifficulty } from '@/lib/types';
import { partOfSpeechOptions } from '@/lib/types';
import { addWord, getAllWords, deleteWord, updateWord, getWordsByDifficulty } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const wordSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  meaning: z.string().min(1, 'Meaning is required'),
  partOfSpeech: z.enum(partOfSpeechOptions),
  explanation: z.string().optional(),
  syllables: z.string().optional(),
  usageDistinction: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
  exampleSentences: z.string().optional(),
});

type WordFormData = Omit<z.infer<typeof wordSchema>, 'difficulty'>;


function WordsClientContent() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilters, setDifficultyFilters] = useState<Set<WordDifficulty>>(new Set());
  const [posFilters, setPosFilters] = useState<Set<Word['partOfSpeech']>>(new Set());

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialDifficultyFilter = searchParams.get('difficulty') as WordDifficulty | null;

  const fetchWords = useCallback(async () => {
    try {
        const words = await getAllWords();
        setAllWords(words.sort((a, b) => b.id - a.id));
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error fetching words",
            description: "Could not load words from the database.",
        });
    }
  }, [toast]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    if (initialDifficultyFilter && ['Easy', 'Medium', 'Hard', 'New'].includes(initialDifficultyFilter)) {
        setDifficultyFilters(new Set([initialDifficultyFilter]));
    }
  }, [initialDifficultyFilter]);

  useEffect(() => {
    let words = allWords;

    if (searchTerm) {
        words = words.filter(word => 
            word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
            word.meaning.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (difficultyFilters.size > 0) {
        words = words.filter(word => difficultyFilters.has(word.difficulty));
    }
    
    if (posFilters.size > 0) {
        words = words.filter(word => posFilters.has(word.partOfSpeech));
    }

    setFilteredWords(words);
  }, [searchTerm, difficultyFilters, posFilters, allWords]);
  
  const form = useForm<WordFormData>({
    resolver: zodResolver(wordSchema),
    defaultValues: {
      word: '',
      meaning: '',
      partOfSpeech: 'noun',
      explanation: '',
      syllables: '',
      usageDistinction: '',
      synonyms: '',
      antonyms: '',
      exampleSentences: '',
    },
  });

  const onSubmit = async (data: WordFormData) => {
    try {
        if (editingWord) {
            await updateWord({ ...editingWord, ...data });
            toast({ title: 'Word updated successfully' });
        } else {
            const newWordData: Omit<Word, 'id' | 'createdAt' | 'updatedAt'> = {
                ...data,
                difficulty: 'New'
            };
            await addWord(newWordData);
            toast({ title: 'Word added successfully' });
        }
        await fetchWords();
        setIsFormOpen(false);
        setEditingWord(null);
        form.reset();
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Error saving word",
            description: e.message || "Could not save the word.",
        });
    }
  };

  const handleEdit = (word: Word) => {
    setEditingWord(word);
    form.reset({
      ...word,
      synonyms: Array.isArray(word.synonyms) ? word.synonyms.join(', ') : '',
      antonyms: Array.isArray(word.antonyms) ? word.antonyms.join(', ') : '',
      exampleSentences: Array.isArray(word.exampleSentences) ? word.exampleSentences.join('\n') : '',
    });
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingWord(null);
    form.reset();
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
        await deleteWord(id);
        toast({ title: 'Word deleted successfully' });
        await fetchWords();
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Error deleting word",
            description: "Could not delete the word.",
        });
    }
  }

  const toggleDifficultyFilter = (difficulty: WordDifficulty) => {
    setDifficultyFilters(prev => {
        const next = new Set(prev);
        if (next.has(difficulty)) {
            next.delete(difficulty);
        } else {
            next.add(difficulty);
        }
        return next;
    });
  };

  const togglePosFilter = (pos: Word['partOfSpeech']) => {
      setPosFilters(prev => {
          const next = new Set(prev);
          if (next.has(pos)) {
              next.delete(pos);
          } else {
              next.add(pos);
          }
          return next;
      });
  };
  
  const pageTitle = initialDifficultyFilter ? `${initialDifficultyFilter} Words` : 'Vocabulary';
  const pageDescription = initialDifficultyFilter ? `A list of all words marked as ${initialDifficultyFilter.toLowerCase()}.` : 'Manage your collection of words.';

  const hasActiveFilters = difficultyFilters.size > 0 || posFilters.size > 0 || searchTerm !== '';

  return (
    <PageTemplate
      title={pageTitle}
      description={pageDescription}
      actions={
        <>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Upload className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Import
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Word
            </span>
          </Button>
        </>
      }
    >
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{editingWord ? 'Edit Word' : 'Add New Word'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-4">
                        <FormField control={form.control} name="word" render={({ field }) => (
                            <FormItem><FormLabel>Word</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="meaning" render={({ field }) => (
                            <FormItem><FormLabel>Meaning</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="partOfSpeech" render={({ field }) => (
                            <FormItem className="col-span-2"><FormLabel>Part of Speech</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{partOfSpeechOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="synonyms" render={({ field }) => (
                            <FormItem className="col-span-2"><FormLabel>Synonyms (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="antonyms" render={({ field }) => (
                            <FormItem className="col-span-2"><FormLabel>Antonyms (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="exampleSentences" render={({ field }) => (
                            <FormItem className="col-span-2"><FormLabel>Example Sentences (one per line)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter className="col-span-2">
                          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                          <Button type="submit">Save Word</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        <div className="flex items-center gap-2 mb-4">
            <Input 
                placeholder="Search words or meanings..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Difficulty {difficultyFilters.size > 0 && `(${difficultyFilters.size})`}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Difficulty</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(['New', 'Easy', 'Medium', 'Hard'] as WordDifficulty[]).map(d => (
                        <DropdownMenuCheckboxItem
                            key={d}
                            checked={difficultyFilters.has(d)}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={() => toggleDifficultyFilter(d)}
                        >
                            {d}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Part of Speech {posFilters.size > 0 && `(${posFilters.size})`}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                     <DropdownMenuLabel>Filter by Part of Speech</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {partOfSpeechOptions.map(pos => (
                        <DropdownMenuCheckboxItem
                            key={pos}
                            checked={posFilters.has(pos)}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={() => togglePosFilter(pos)}
                        >
                            {pos}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {initialDifficultyFilter && (
                <Link href="/words" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                    <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => setDifficultyFilters(new Set())}>
                        <X className="h-3.5 w-3.5" />
                        Clear URL Filter
                    </Button>
                </Link>
            )}
        </div>
        
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Meaning</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredWords.length > 0 ? filteredWords.map(word => (
                    <TableRow key={word.id}>
                        <TableCell className="font-medium">{word.word}</TableCell>
                        <TableCell>{word.meaning}</TableCell>
                        <TableCell><Badge variant={word.difficulty === 'Hard' ? 'destructive' : 'secondary'}>{word.difficulty}</Badge></TableCell>
                        <TableCell>{new Date(word.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(word)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(word.id)}>Delete</Button>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                           {hasActiveFilters ? 'No words match your filters.' : 'No words added yet.'}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </PageTemplate>
  );
}

export function WordsClientPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WordsClientContent />
        </Suspense>
    )
}
