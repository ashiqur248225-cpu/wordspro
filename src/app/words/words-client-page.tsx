'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlusCircle, Upload, Filter, Search, MoreHorizontal, BookCopy, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

import type { Word } from '@/lib/types';
import { partOfSpeechOptions } from '@/lib/types';
import { addWord, getAllWords, deleteWord, updateWord, bulkAddWords } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

const verbFormDetailSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  pronunciation: z.string().optional().nullable(),
  bangla_meaning: z.string().optional().nullable(),
  usage_timing: z.string().optional().nullable(),
}).optional().nullable();

const verbFormsSchema = z.object({
    v1_present: verbFormDetailSchema,
    v2_past: verbFormDetailSchema,
    v3_past_participle: verbFormDetailSchema,
}).optional().nullable();


const wordSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  meaning: z.string().min(1, 'Meaning is required'),
  partOfSpeech: z.enum(partOfSpeechOptions),
  meaning_explanation: z.string().optional(),
  syllables: z.string().optional(), //
  usage_distinction: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
  exampleSentences: z.string().optional(),
  verb_forms: verbFormsSchema,
});

type WordFormData = z.infer<typeof wordSchema>;


function WordsClientContent() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [wordToDelete, setWordToDelete] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [difficultyFilter, setDifficultyFilter] = useState(searchParams.get('difficulty') || 'All');
  const [posFilter, setPosFilter] = useState(searchParams.get('pos') || 'All');
  const [isMounted, setIsMounted] = useState(false);


  const { toast } = useToast();
  
  useEffect(() => {
    setIsMounted(true);
    const difficulty = searchParams.get('difficulty');
    if (difficulty) {
        setDifficultyFilter(difficulty);
    }
  }, [searchParams]);

  const fetchWords = useCallback(async () => {
    try {
        const words = await getAllWords();
        setAllWords(words.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
    let words = allWords;

    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        words = words.filter(word => {
            // Search word and meaning
            if (word.word.toLowerCase().includes(lowercasedFilter)) return true;
            if (word.meaning.toLowerCase().includes(lowercasedFilter)) return true;

            // Search verb forms
            if (word.verb_forms) {
                if (word.verb_forms.v1_present?.word?.toLowerCase().includes(lowercasedFilter)) return true;
                if (word.verb_forms.v1_present?.bangla_meaning?.toLowerCase().includes(lowercasedFilter)) return true;
                if (word.verb_forms.v2_past?.word?.toLowerCase().includes(lowercasedFilter)) return true;
                if (word.verb_forms.v2_past?.bangla_meaning?.toLowerCase().includes(lowercasedFilter)) return true;
                if (word.verb_forms.v3_past_participle?.word?.toLowerCase().includes(lowercasedFilter)) return true;
                if (word.verb_forms.v3_past_participle?.bangla_meaning?.toLowerCase().includes(lowercasedFilter)) return true;
            }

            // Search synonyms
            if (word.synonyms?.some(syn => {
                if (typeof syn === 'string') {
                    return syn.toLowerCase().includes(lowercasedFilter);
                }
                return syn.word.toLowerCase().includes(lowercasedFilter) || syn.bangla?.toLowerCase().includes(lowercasedFilter);
            })) return true;

            // Search antonyms
            if (word.antonyms?.some(ant => {
                if (typeof ant === 'string') {
                    return ant.toLowerCase().includes(lowercasedFilter);
                }
                return ant.word.toLowerCase().includes(lowercasedFilter) || ant.bangla?.toLowerCase().includes(lowercasedFilter);
            })) return true;

            return false;
        });
    }
    
    if (difficultyFilter !== 'All') {
        const today = new Date().toDateString();
        words = words.filter(word => {
            if (difficultyFilter === "Today's") {
                return new Date(word.createdAt).toDateString() === today;
            }
            return word.difficulty === difficultyFilter;
        });
    }
    
    if (posFilter !== 'All') {
        words = words.filter(word => word.partOfSpeech === posFilter);
    }

    setFilteredWords(words);
  }, [searchTerm, difficultyFilter, posFilter, allWords]);
  
  const form = useForm<WordFormData>({
    resolver: zodResolver(wordSchema),
    defaultValues: {
      word: '',
      meaning: '',
      partOfSpeech: 'noun',
      meaning_explanation: '',
      syllables: '',
      usage_distinction: '',
      synonyms: '',
      antonyms: '',
      exampleSentences: '',
      verb_forms: {
        v1_present: { word: '' },
        v2_past: { word: '' },
        v3_past_participle: { word: '' },
      },
    },
  });

  const arrayToString = (arr: any[] | undefined) => Array.isArray(arr) ? arr.map(item => typeof item === 'object' && item !== null ? item.word : item).join(', ') : '';
  
  const examplesToString = (examples: any | undefined): string => {
    if (!examples) return '';
    const allSentences = [
        ...(examples.by_structure || []),
        ...(examples.by_tense || [])
    ];
    return allSentences.map(ex => ex.sentence).join('\n');
  };

  const stringToArray = (str: string | undefined) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
  const examplesToArray = (str: string | undefined) => {
    if (!str) return null;
    const sentences = str.split('\n').map(s => s.trim()).filter(Boolean);
    return { by_tense: sentences.map(s => ({ sentence: s })) };
  };


  const onSubmit = async (data: WordFormData) => {
    try {
        const payload: Omit<Word, 'id' | 'createdAt' | 'updatedAt' | 'difficulty' | 'correct_count' | 'wrong_count' | 'total_exams' | 'correct_streak'> = {
          ...data,
          partOfSpeech: data.partOfSpeech,
          syllables: stringToArray(data.syllables),
          synonyms: stringToArray(data.synonyms),
          antonyms: stringToArray(data.antonyms),
          exampleSentences: examplesToArray(data.exampleSentences),
        };

        if (editingWord) {
            await updateWord({ ...editingWord, ...payload });
            toast({ title: 'Word updated successfully' });
        } else {
            const newWordData: Omit<Word, 'id' | 'createdAt' | 'updatedAt'> = {
                ...payload,
                difficulty: 'New',
                wrong_count: { spelling: 0, meaning: 0, synonym: 0, antonym: 0 },
                correct_count: 0,
                total_exams: 0,
                correct_streak: 0,
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
      syllables: word.syllables?.join(', '),
      synonyms: arrayToString(word.synonyms),
      antonyms: arrayToString(word.antonyms),
      exampleSentences: examplesToString(word.exampleSentences),
    });
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingWord(null);
    form.reset({
        word: '',
        meaning: '',
        partOfSpeech: 'noun',
        meaning_explanation: '',
        syllables: '',
        usage_distinction: '',
        synonyms: '',
        antonyms: '',
        exampleSentences: '',
        verb_forms: {
          v1_present: { word: '' },
          v2_past: { word: '' },
          v3_past_participle: { word: '' },
        },
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWord(id);
      toast({ title: 'Word deleted successfully' });
      setAllWords(prevWords => prevWords.filter(word => word.id !== id));
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting word',
        description: 'Could not delete the word.',
      });
    }
  };


const handleBulkImport = async () => {
    if (!importJson.trim()) {
        toast({
            variant: 'destructive',
            title: 'Input Required',
            description: 'Please paste the JSON content to import.',
        });
        return;
    }
  try {
    const jsonData = JSON.parse(importJson);
    
    const formattedData = jsonData.map((item: any) => {
      let pos = item.parts_of_speech || 'noun';
      
      const separator = pos.includes('-') ? '-' : pos.includes('/') ? '/' : null;
      if (separator) {
        pos = pos.split(separator)[0];
      }

      return {
        ...item,
        partOfSpeech: pos.toLowerCase().trim(),
        syllables: Array.isArray(item.syllables) ? item.syllables : [],
        synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
        antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
        exampleSentences: item.example_sentences || { by_tense: [], by_structure: [] },
        verb_forms: item.verb_forms || null,
        difficulty: 'New', 
        createdAt: new Date().toISOString(),
        correct_count: 0,
        wrong_count: { spelling: 0, meaning: 0, synonym: 0, antonym: 0 },
        total_exams: 0,
        correct_streak: 0
      };
    });

    const result = await bulkAddWords(formattedData);
    toast({ 
      title: 'Import Successful', 
      description: `${result.successCount} words have been added to your database.` 
    });
    
    setIsImportOpen(false);
    setImportJson('');
    fetchWords();
  } catch (e: any) {
    console.error("Import Error:", e);
    toast({ 
      variant: 'destructive', 
      title: 'Import Failed', 
      description: "JSON ফরম্যাট সঠিক নয়। দয়া করে ফরম্যাটটি চেক করুন।" 
    });
  }
};


  const handleStartExam = (quizType: string) => {
      if (filteredWords.length === 0) {
          toast({
              variant: 'destructive',
              title: 'No Words Selected',
              description: 'Please filter a list of words to start an exam.',
          });
          return;
      }
      router.push(`/learn?quizType=${quizType}&difficulty=${difficultyFilter}`);
  };
  
  const handleStartFlashcards = () => {
    const query = new URLSearchParams();
    if (difficultyFilter && difficultyFilter !== 'All') query.set('difficulty', difficultyFilter);
    if (posFilter && posFilter !== 'All') query.set('pos', posFilter);
    if (searchTerm) query.set('q', searchTerm);
    router.push(`/flashcards?${query.toString()}`);
  }

  const handleRowClick = (word: Word) => {
    const query = new URLSearchParams();
    if (difficultyFilter !== 'All') {
      query.set('difficulty', difficultyFilter);
    }
    if (posFilter !== 'All') {
      query.set('pos', posFilter);
    }
    if (searchTerm) {
      query.set('q', searchTerm);
    }
    router.push(`/words/${word.id}?${query.toString()}`);
  };
  
  const pageTitle = `Words List (${filteredWords.length})`;

  const activeFilterCount = (difficultyFilter !== 'All' ? 1 : 0) + (posFilter !== 'All' ? 1 : 0);

  const isVerb = form.watch('partOfSpeech') === 'verb';
  
  if (!isMounted) {
    return null;
  }

  const examTypes = [
      { id: 'dynamic', label: 'Dynamic Revision', disabled: false },
      { id: 'mcq-en-bn', label: 'MCQ (Eng to Ban)', disabled: false },
      { id: 'mcq-bn-en', label: 'MCQ (Ban to Eng)', disabled: false },
      { id: 'spelling', label: 'Spelling Test', disabled: false },
      { id: 'fill-blanks', label: 'Fill-in-the-Blanks', disabled: false },
      { id: 'verb-form', label: 'Verb Form Test', disabled: false },
      { id: 'synonym-antonym', label: 'Synonym/Antonym', disabled: false },
  ]

  return (
    <div className="p-4 md:p-6 overflow-x-auto">
        <header className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 gap-1" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                  Import
                </span>
              </Button>
              <Button size="sm" className="h-9 gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-rap">
                  Add Word
                </span>
              </Button>
            </div>
        </header>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[725px]">
              <ScrollArea className="max-h-[80vh]">
                <div className="p-6">
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
                                <SelectContent>{partOfSpeechOptions.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        
                        {isVerb && (
                            <>
                                <h4 className="col-span-2 font-semibold text-lg mt-4 border-b pb-2">Verb Forms</h4>
                                <FormField control={form.control} name="verb_forms.v1_present.word" render={({ field }) => (
                                    <FormItem><FormLabel>V1 (Present)</FormLabel><FormControl><Input placeholder="e.g., do" {...field} value={field.value || ''} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="verb_forms.v2_past.word" render={({ field }) => (
                                    <FormItem><FormLabel>V2 (Past)</FormLabel><FormControl><Input placeholder="e.g., did" {...field} value={field.value || ''} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="verb_forms.v3_past_participle.word" render={({ field }) => (
                                    <FormItem><FormLabel>V3 (Past Participle)</FormLabel><FormControl><Input placeholder="e.g., done" {...field} value={field.value || ''} /></FormControl></FormItem>
                                )} />
                            </>
                        )}

                        <FormField control={form.control} name="synonyms" render={({ field }) => (
                            <FormItem className="col-span-2"><FormLabel>Synonyms (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="antonyms" render={({ field }) => (
                            <FormItem className="col-span-2"><FormLabel>Antonyms (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="exampleSentences" render={({ field }) => (
                            <FormItem className="col-span-2"><FormLabel>Example Sentences (one per line)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter className="col-span-2 pt-4">
                          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                          <Button type="submit">Save Word</Button>
                        </DialogFooter>
                    </form>
                </Form>
                </div>
              </ScrollArea>
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!wordToDelete} onOpenChange={setWordToDelete}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    word from your vocabulary.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => {
                        if (wordToDelete) {
                            handleDelete(wordToDelete);
                        }
                    }}
                >
                    Continue
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Words</DialogTitle>
                    <DialogDescription>
                        Paste your JSON array here. Ensure it follows the correct structure. Required fields are `word`, `meaning`, and `parts_of_speech`.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder='[
  {
    "word": "practice",
    "meaning": "অনুশীলন করা",
    "parts_of_speech": "Noun-Verb",
    "syllables": ["prac", "tice"],
    "word_family": {
      "noun": { "word": "practice", "pronunciation": "প্র্যাকটিস", "meaning": "অনুশীলন বা প্রথা" }
    },
    "example_sentences": {
      "by_tense": [
        { "tense": "Present Simple", "sentence": "They practice cricket every afternoon." }
      ]
    },
    "synonyms": [
      { "word": "exercise", "bangla": "চর্চা করা" }
    ]
  },
  {
    "word": "awareness",
    "meaning": "সচেতনতা",
    "parts_of_speech": "Noun"
  }
]'
                        value={importJson}
                        onChange={(e) => setImportJson(e.target.value)}
                        rows={15}
                        className="font-mono text-xs"
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleBulkImport}>Import Words</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search words..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 max-w-sm"
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1">
                        <Filter className="h-3.5 w-3.5" />
                         {activeFilterCount > 0 && <Badge variant="secondary" className="rounded-sm px-1 font-normal">{activeFilterCount}</Badge>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filter by Level</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={difficultyFilter} onValueChange={setDifficultyFilter}>
                        {(["All", "Today's", 'Learned', 'Easy', 'Medium', 'Hard', 'New'] as const).map(d => (
                            <DropdownMenuRadioItem key={d} value={d}>
                                {d}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Filter by Part of Speech</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={posFilter} onValueChange={setPosFilter}>
                         <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                        {partOfSpeechOptions.map(pos => (
                            <DropdownMenuRadioItem key={pos} value={pos}>
                                {pos.charAt(0).toUpperCase() + pos.slice(1)}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-9 gap-1" onClick={handleStartFlashcards}>
                <CreditCard className="h-3.5 w-3.5" />
                Flash Cards
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1 bg-accent/20 text-accent-foreground">
                        <BookCopy className="h-3.5 w-3.5" />
                        Exam
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px]">
                    <DropdownMenuLabel>Select Exam Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {examTypes.map(exam => (
                             <DropdownMenuItem key={exam.id} onSelect={() => handleStartExam(exam.id)} disabled={exam.disabled}>
                                {exam.label}
                                {exam.disabled && <span className="text-xs text-muted-foreground ml-auto">(Soon)</span>}
                             </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Word</TableHead>
                        <TableHead>Meaning</TableHead>
                        <TableHead>Part of Speech</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredWords.length > 0 ? filteredWords.map(word => (
                        <TableRow 
                            key={word.id} 
                            onClick={() => handleRowClick(word)}
                            className="cursor-pointer"
                        >
                            <TableCell className="font-medium">{word.word}</TableCell>
                            <TableCell>{word.meaning}</TableCell>
                            <TableCell>{word.partOfSpeech.charAt(0).toUpperCase() + word.partOfSpeech.slice(1)}</TableCell>
                            <TableCell><Badge variant={word.difficulty === 'Hard' ? 'destructive' : word.difficulty === 'New' ? 'outline' : 'secondary'}>{word.difficulty}</Badge></TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleEdit(word);}}>
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setWordToDelete(word.id); }} className="text-destructive">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                               {activeFilterCount > 0 ? 'No words match your filters.' : 'No words added yet.'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}

export function WordsClientPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WordsClientContent />
        </Suspense>
    )
}
