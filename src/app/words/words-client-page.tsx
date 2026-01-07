'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
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
  difficulty: z.enum(['New', 'Easy', 'Medium', 'Hard']),
});

type WordFormData = z.infer<typeof wordSchema>;


function WordsClientContent() {
  const [words, setWords] = useState<Word[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const difficultyFilter = searchParams.get('difficulty') as WordDifficulty | null;

  const fetchWords = useCallback(async () => {
    try {
        let allWords: Word[];
        if (difficultyFilter && ['Easy', 'Medium', 'Hard'].includes(difficultyFilter)) {
            allWords = await getWordsByDifficulty([difficultyFilter]);
        } else {
            allWords = await getAllWords();
        }
        setWords(allWords.sort((a, b) => b.id - a.id));
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error fetching words",
            description: "Could not load words from the database.",
        });
    }
  }, [toast, difficultyFilter]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);
  
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
      difficulty: 'New',
    },
  });

  const onSubmit = async (data: WordFormData) => {
    try {
        if (editingWord) {
            await updateWord({ ...editingWord, ...data });
            toast({ title: 'Word updated successfully' });
        } else {
            await addWord(data);
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
  
  const pageTitle = difficultyFilter ? `${difficultyFilter} Words` : 'Vocabulary';
  const pageDescription = difficultyFilter ? `A list of all words marked as ${difficultyFilter.toLowerCase()}.` : 'Manage your collection of words.';

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
                            <FormItem><FormLabel>Part of Speech</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{partOfSpeechOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="difficulty" render={({ field }) => (
                            <FormItem><FormLabel>Difficulty</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{['New', 'Easy', 'Medium', 'Hard'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
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
        
        {difficultyFilter && (
            <div className="mb-4">
                <Link href="/words" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                        <X className="h-3.5 w-3.5" />
                        Clear filter
                    </Button>
                </Link>
            </div>
        )}
        
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
                {words.length > 0 ? words.map(word => (
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
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No words found for this filter.</TableCell></TableRow>
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
