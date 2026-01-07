


'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlusCircle, Upload, X, Filter, BookOpenCheck, ListTree } from 'lucide-react';
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
  DialogClose,
  DialogDescription
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
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const verbFormDetailSchema = z.object({
  word: z.string().optional(),
  pronunciation: z.string().optional(),
  bangla_meaning: z.string().optional(),
  usage_timing: z.string().optional(),
}).optional();

const verbFormsSchema = z.object({
    v1_present: verbFormDetailSchema,
    v2_past: verbFormDetailSchema,
    v3_past_participle: verbFormDetailSchema,
    form_examples: z.object({
        v1: z.string().optional(),
        v2: z.string().optional(),
        v3: z.string().optional(),
    }).optional(),
});


const wordSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  meaning: z.string().min(1, 'Meaning is required'),
  partOfSpeech: z.enum(partOfSpeechOptions),
  meaning_explanation: z.string().optional(),
  syllables: z.string().optional(), //
  usageDistinction: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
  exampleSentences: z.string().optional(),
  verb_forms: verbFormsSchema.nullable(),
});

type WordFormData = z.infer<typeof wordSchema>;

// Bulk import schema
const bulkImportVerbFormsSchema = z.object({
    v1_present: verbFormDetailSchema,
    v2_past: verbFormDetailSchema,
    v3_past_participle: verbFormDetailSchema,
    form_examples: z.object({
        v1: z.string().optional(),
        v2: z.string().optional(),
        v3: z.string().optional(),
    }).optional(),
}).nullable();


const bulkImportWordSchema = z.object({
    word: z.string(),
    meaning: z.string(),
    meaning_explanation: z.string().optional(),
    parts_of_speech: z.preprocess(
        (val) => typeof val === 'string' ? val.toLowerCase() : val,
        z.enum(partOfSpeechOptions)
    ),
    syllables: z.array(z.string()).optional(),
    usage_distinction: z.string().optional(),
    example_sentences: z.array(z.string()).optional(),
    verb_forms: bulkImportVerbFormsSchema,
    synonyms: z.union([z.array(z.union([z.string(), z.object({word: z.string(), bangla: z.string()})])), z.null()]).optional(),
    antonyms: z.union([z.array(z.union([z.string(), z.object({word: z.string(), bangla: z.string()})])), z.null()]).optional(),
});
const bulkImportSchema = z.array(bulkImportWordSchema);


function WordsClientContent() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState('mcq-en-bn');
  const [importJson, setImportJson] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [posFilter, setPosFilter] = useState<string>('All');
  const [isMounted, setIsMounted] = useState(false);


  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialDifficultyFilter = searchParams.get('difficulty');

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    if (isMounted && initialDifficultyFilter && ['Easy', 'Medium', 'Hard'].includes(initialDifficultyFilter)) {
        setDifficultyFilter(initialDifficultyFilter);
    }
  }, [initialDifficultyFilter, isMounted]);

  useEffect(() => {
    let words = allWords;

    if (searchTerm) {
        words = words.filter(word => 
            word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
            word.meaning.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (difficultyFilter && difficultyFilter !== 'All') {
        const today = new Date().toDateString();
        words = words.filter(word => {
            if (difficultyFilter === "Today's") {
                return new Date(word.createdAt).toDateString() === today;
            }
            if (difficultyFilter === "Learned") {
                return word.difficulty === 'Easy';
            }
            return word.difficulty === difficultyFilter;
        });
    }
    
    if (posFilter && posFilter !== 'All') {
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
      usageDistinction: '',
      synonyms: '',
      antonyms: '',
      exampleSentences: '',
      verb_forms: null,
    },
  });

  const arrayToString = (arr: any[] | undefined) => Array.isArray(arr) ? arr.map(item => typeof item === 'object' && item !== null ? item.word : item).join(', ') : '';
  const examplesToString = (arr: any[] | undefined) => Array.isArray(arr) ? arr.join('\n') : '';

  const stringToArray = (str: string | undefined) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
  const examplesToArray = (str: string | undefined) => str ? str.split('\n').map(s => s.trim()).filter(Boolean) : [];


  const onSubmit = async (data: WordFormData) => {
    try {
        const payload: Omit<Word, 'id' | 'createdAt' | 'updatedAt' | 'difficulty' | 'learned' | 'wrong_count' | 'correct_count' | 'total_exams'> = {
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
                wrong_count: { spelling: 0, meaning: 0 },
                correct_count: 0,
                total_exams: 0,
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
        usageDistinction: '',
        synonyms: '',
        antonyms: '',
        exampleSentences: '',
        verb_forms: null,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
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

  const handleBulkImport = async () => {
    try {
        const jsonData = JSON.parse(importJson);
        const parsedData = bulkImportSchema.parse(jsonData);
        
        const result = await bulkAddWords(parsedData);
        
        toast({
            title: 'Bulk Import Complete',
            description: `${result.successCount} words imported successfully. ${result.errorCount} failed.`,
        });

        if (result.errorCount > 0) {
            console.error('Import errors:', result.errors);
        }

        await fetchWords();
        setIsImportOpen(false);
        setImportJson('');

    } catch (error: any) {
        let description = "An unknown error occurred.";
        if (error instanceof z.ZodError) {
            description = "JSON data does not match the required format. Check console for details.";
            console.error(error.errors);
        } else if (error instanceof SyntaxError) {
            description = "Invalid JSON format. Please check your syntax.";
        }
        toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: description,
        });
    }
  };

  const handleStartExam = () => {
      const wordIds = filteredWords.map(w => w.id);
      if (wordIds.length === 0) {
          toast({
              variant: 'destructive',
              title: 'No Words Selected',
              description: 'Please filter a list of words to start an exam.',
          });
          return;
      }
      router.push(`/learn?wordIds=${JSON.stringify(wordIds)}`);
      setIsExamOpen(false);
  };
  
  const pageTitle = initialDifficultyFilter ? `${initialDifficultyFilter} Words` : 'Vocabulary';
  const pageDescription = initialDifficultyFilter ? `A list of all words marked as ${initialDifficultyFilter.toLowerCase()}.` : 'Manage your collection of words.';

  const activeFilterCount = (difficultyFilter !== 'All' ? 1 : 0) + (posFilter !== 'All' ? 1 : 0);

  const isVerb = form.watch('partOfSpeech') === 'verb';
  
  if (!isMounted) {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading Words...</div>}>
    <PageTemplate
      title={pageTitle}
      description={pageDescription}
      actions={
        <>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setIsImportOpen(true)}>
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
                                <SelectContent>{partOfSpeechOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        
                        {isVerb && (
                            <>
                                <h4 className="col-span-2 font-semibold text-lg mt-4 border-b pb-2">Verb Forms</h4>
                                <FormField control={form.control} name="verb_forms.v1_present.word" render={({ field }) => (
                                    <FormItem><FormLabel>V1 (Present)</FormLabel><FormControl><Input placeholder="e.g., do" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="verb_forms.v2_past.word" render={({ field }) => (
                                    <FormItem><FormLabel>V2 (Past)</FormLabel><FormControl><Input placeholder="e.g., did" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="verb_forms.v3_past_participle.word" render={({ field }) => (
                                    <FormItem><FormLabel>V3 (Past Participle)</FormLabel><FormControl><Input placeholder="e.g., done" {...field} /></FormControl></FormItem>
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

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Words</DialogTitle>
                    <DialogDescription>
                        Paste a JSON array of words to import them in bulk.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="[&#10;  { &quot;word&quot;: &quot;example&quot;, &quot;meaning&quot;: &quot;...&quot;, ... },&#10;  ...&#10;]"
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

        <Dialog open={isExamOpen} onOpenChange={setIsExamOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Start a Custom Exam</DialogTitle>
                    <DialogDescription>
                        Choose a quiz type for the <span className="font-bold">{filteredWords.length}</span> currently filtered words.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <RadioGroup defaultValue="mcq-en-bn" onValueChange={setSelectedQuizType}>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <RadioGroupItem value="mcq-en-bn" id="mcq-en-bn" />
                                <Label htmlFor="mcq-en-bn" className="ml-2">MCQ (English to Bengali)</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem value="spelling" id="spelling" disabled />
                                <Label htmlFor="spelling" className="ml-2 text-muted-foreground">Spelling Test (Soon)</Label>
                            </div>
                            <div className="flex items-center">
                                <RadioGroupItem value="fill-blanks" id="fill-blanks" disabled />
                                <Label htmlFor="fill-blanks" className="ml-2 text-muted-foreground">Fill-in-the-Blanks (Soon)</Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleStartExam}>
                        Start Exam
                    </Button>
                </DialogFooter>
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
                    <Button variant="outline" size="sm" className="h-9 gap-1">
                        <Filter className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Filter</span>
                         {activeFilterCount > 0 && <Badge variant="secondary" className="rounded-sm px-1 font-normal">{activeFilterCount}</Badge>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filter by Difficulty</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={difficultyFilter} onValueChange={setDifficultyFilter}>
                        {(["All", "Today's", 'Learned', 'Easy', 'Medium', 'Hard'] as const).map(d => (
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
                                {pos}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => setIsExamOpen(true)}>
                <BookOpenCheck className="h-3.5 w-3.5" />
                Start Exam
            </Button>
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
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/words/${word.id}`)}>Details</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(word)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(word.id)}>Delete</Button>
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
    </PageTemplate>
    </Suspense>
  );
}

export function WordsClientPage() {
    // This outer component ensures Suspense can be used.
    // The actual client logic is in WordsClientContent.
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WordsClientContent />
        </Suspense>
    )
}

    

    
