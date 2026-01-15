'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { getWord, getAllWords } from '@/lib/db';
import type { Word, VerbFormDetail, Synonym, Antonym, WordFamilyDetail, ExampleSentence } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Volume2, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function DetailCard({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  if (!children) return null;
  return (
    <Card className="bg-card/70">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}


function WordDetailsPageInternal() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [word, setWord] = useState<Word | null>(null);
  const [filteredWordIds, setFilteredWordIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  // Pronunciation settings state
  const [accent, setAccent] = useState<'US' | 'UK'>('US');
  const [speed, setSpeed] = useState([1]);
  const [volume, setVolume] = useState([1]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const handleVoicesChanged = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    handleVoicesChanged(); // Initial load
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);


  const handlePlayAudio = async (textToSpeak: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.error('Speech synthesis not supported.');
        return;
    }
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (isPlaying === textToSpeak) {
          setIsPlaying(null);
          return;
        }
    }
    
    setIsPlaying(textToSpeak);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const selectedVoice = voices.find(voice => 
        accent === 'UK' 
            ? voice.lang.includes('en-GB') 
            : voice.lang.includes('en-US')
    );

    utterance.voice = selectedVoice || voices.find(voice => voice.lang.startsWith('en')) || null;
    utterance.volume = volume[0]; // 0 to 1
    utterance.rate = speed[0]; // 0.1 to 10
    utterance.pitch = 1; // 0 to 2

    utterance.onend = () => {
        setIsPlaying(null);
    };
    utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          console.error('Speech synthesis error:', event.error);
        }
        setIsPlaying(null);
    };

    window.speechSynthesis.speak(utterance);
  };

const VerbFormRow = ({ label, data }: { label: string, data?: VerbFormDetail }) => {
    if (!data || !data.word) return null;
    return (
        <TableRow>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell>
                <p 
                    className="font-semibold cursor-pointer flex items-center gap-2"
                    onClick={() => handlePlayAudio(data.word!)}
                >
                    {data.word} 
                    <Volume2 className={`inline h-4 w-4 text-muted-foreground ${isPlaying === data.word ? 'animate-pulse text-primary' : ''}`} />
                </p>
                <p className="text-sm text-muted-foreground">{data.pronunciation}</p>
            </TableCell>
            <TableCell>{data.bangla_meaning}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{data.usage_timing}</TableCell>
        </TableRow>
    );
};

const SynonymAntonymItem = ({ item }: { item: string | Synonym | Antonym }) => {
    const wordText = typeof item === 'string' ? item : item.word;
    const bangla = typeof item !== 'string' ? item.bangla : undefined;

    return (
        <Badge 
            variant="secondary" 
            className="text-base px-3 py-1 cursor-pointer flex items-center gap-2"
            onClick={() => handlePlayAudio(wordText)}
        >
            <span>{wordText}</span>
            {bangla && <span className="text-sm text-muted-foreground">({bangla})</span>}
            <Volume2 className={`inline h-4 w-4 text-muted-foreground ${isPlaying === wordText ? 'animate-pulse text-primary' : ''}`} />
        </Badge>
    );
};

const WordFamilyRow = ({ label, data }: { label: string, data?: WordFamilyDetail }) => {
    if (!data) return null;
    return (
        <TableRow>
            <TableCell className="font-medium capitalize">{label}</TableCell>
            <TableCell>
                 <p className="font-semibold">{data.word}</p>
                 <p className="text-sm text-muted-foreground">{data.pronunciation}</p>
            </TableCell>
            <TableCell>{data.meaning}</TableCell>
        </TableRow>
    )
}


  const fetchWordData = useCallback(async () => {
    setLoading(true);
    if (id) {
        try {
            const fetchedWord = await getWord(id);
            if (!fetchedWord) {
                notFound();
                return;
            }
            setWord(fetchedWord);
        } catch(e) {
            console.error(e);
            setWord(null);
            notFound();
        }
    } else {
        notFound();
    }
  }, [id]);

  useEffect(() => {
    const fetchAndFilterWords = async () => {
        try {
            let allWords = await getAllWords();
            const difficultyFilter = searchParams.get('difficulty');
            const posFilter = searchParams.get('pos');
            const searchTerm = searchParams.get('q');
            
            if (searchTerm) {
                const lowercasedFilter = searchTerm.toLowerCase();
                allWords = allWords.filter(word => {
                    if (word.word.toLowerCase().includes(lowercasedFilter)) return true;
                    if (word.meaning.toLowerCase().includes(lowercasedFilter)) return true;
                    if (word.verb_forms) {
                        if (word.verb_forms.v1_present?.word?.toLowerCase().includes(lowercasedFilter)) return true;
                        if (word.verb_forms.v2_past?.word?.toLowerCase().includes(lowercasedFilter)) return true;
                        if (word.verb_forms.v3_past_participle?.word?.toLowerCase().includes(lowercasedFilter)) return true;
                    }
                    if (word.synonyms?.some(syn => (typeof syn === 'string' ? syn : syn.word).toLowerCase().includes(lowercasedFilter))) return true;
                    if (word.antonyms?.some(ant => (typeof ant === 'string' ? ant : ant.word).toLowerCase().includes(lowercasedFilter))) return true;
                    return false;
                });
            }

            if (difficultyFilter && difficultyFilter !== 'All') {
                const today = new Date().toDateString();
                allWords = allWords.filter(word => {
                    if (difficultyFilter === "Today's") return new Date(word.createdAt).toDateString() === today;
                    if (difficultyFilter === "Learned") return word.difficulty === 'Learned';
                    return word.difficulty === difficultyFilter;
                });
            }

            if (posFilter && posFilter !== 'All') {
                allWords = allWords.filter(word => word.partOfSpeech === posFilter);
            }

            const sortedWords = allWords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const ids = sortedWords.map(w => w.id);
            setFilteredWordIds(ids);

        } catch(e) {
            console.error("Could not fetch and filter word list for navigation", e);
        }
    };

    fetchWordData();
    fetchAndFilterWords();
  }, [id, fetchWordData, searchParams]);

  useEffect(() => {
    if (word && filteredWordIds.length > 0) {
        const index = filteredWordIds.indexOf(word.id);
        setCurrentIndex(index);
    }
    setLoading(false);
  }, [word, filteredWordIds]);

  const navigateToWord = (index: number) => {
    if (index >= 0 && index < filteredWordIds.length) {
      const nextId = filteredWordIds[index];
      const currentQuery = new URLSearchParams(Array.from(searchParams.entries()));
      router.push(`/words/${nextId}?${currentQuery.toString()}`);
    }
  };


  if (loading) {
    return (
      <div className="p-4 md:p-6">
          <div className="space-y-4">
              <Skeleton className="h-12 w-1/4" />
              <Skeleton className="h-8 w-1/6" />
              <div className="space-y-6 pt-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
          </div>
      </div>
    );
  }

  if (!word) {
    return null;
  }

  const hasVerbForms = word.verb_forms && (word.verb_forms.v1_present?.word || word.verb_forms.v2_past?.word || word.verb_forms.v3_past_participle?.word);
  const hasWordFamily = word.word_family && Object.keys(word.word_family).length > 0;
  const hasExampleSentences = word.exampleSentences && (word.exampleSentences.by_structure?.length || word.exampleSentences.by_tense?.length);


  return (
    <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
            <header className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-5xl font-bold">{word.word}</h1>
                    <p className="text-xl text-muted-foreground capitalize">{word.partOfSpeech}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handlePlayAudio(word.word)} disabled={!!isPlaying}>
                        <Volume2 className={isPlaying === word.word ? 'animate-pulse text-primary' : ''} />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon"><Settings /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Pronunciation Control</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Adjust accent, speed, and volume.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="accent">Accent</Label>
                                        <RadioGroup
                                            value={accent}
                                            onValueChange={(value: 'US' | 'UK') => setAccent(value)}
                                            className="col-span-2 flex items-center"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="US" id="us-accent" />
                                                <Label htmlFor="us-accent">US</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="UK" id="uk-accent" />
                                                <Label htmlFor="uk-accent">UK</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="speed">Speed</Label>
                                        <Slider
                                            id="speed"
                                            min={0.5}
                                            max={2}
                                            step={0.1}
                                            defaultValue={speed}
                                            onValueChange={setSpeed}
                                            className="col-span-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="volume">Volume</Label>
                                        <Slider
                                            id="volume"
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            defaultValue={volume}
                                            onValueChange={setVolume}
                                            className="col-span-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Badge variant={word.difficulty === 'Hard' ? 'destructive' : word.difficulty === 'New' ? 'outline' : 'secondary'} className="text-base px-4 py-1">{word.difficulty}</Badge>
                </div>
            </header>

            <main className="space-y-6">
                <DetailCard title="Meaning (Bangla)">
                    <p className="text-2xl">{word.meaning}</p>
                </DetailCard>

                {word.meaning_explanation && (
                  <DetailCard title="Meaning Explanation">
                      <p className="text-lg text-muted-foreground">{word.meaning_explanation}</p>
                  </DetailCard>
                )}

                {word.usage_distinction && (
                  <DetailCard title="Usage Distinction">
                      <p className="text-lg text-muted-foreground">{word.usage_distinction}</p>
                  </DetailCard>
                )}
                
                {hasWordFamily && (
                    <DetailCard title="Word Family">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Form</TableHead>
                                    <TableHead>Word & Pronunciation</TableHead>
                                    <TableHead>Meaning</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <WordFamilyRow label="noun" data={word.word_family?.noun} />
                                <WordFamilyRow label="adjective" data={word.word_family?.adjective} />
                                <WordFamilyRow label="adverb" data={word.word_family?.adverb} />
                                <WordFamilyRow label="verb" data={word.word_family?.verb} />
                                <WordFamilyRow label="person noun" data={word.word_family?.person_noun} />
                            </TableBody>
                        </Table>
                    </DetailCard>
                )}

                {word.synonyms && word.synonyms.length > 0 && (
                    <DetailCard title="Synonyms">
                        <div className="flex flex-wrap gap-2">
                            {word.synonyms.map((item, i) => <SynonymAntonymItem key={i} item={item} />)}
                        </div>
                    </DetailCard>
                )}

                {word.antonyms && word.antonyms.length > 0 && (
                    <DetailCard title="Antonyms">
                         <div className="flex flex-wrap gap-2">
                            {word.antonyms.map((item, i) => <SynonymAntonymItem key={i} item={item} />)}
                        </div>
                    </DetailCard>
                )}

                {word.syllables && word.syllables.length > 0 && (
                  <DetailCard title="Syllables">
                      <p className="font-mono text-lg tracking-widest">{word.syllables?.join(' / ')}</p>
                  </DetailCard>
                )}
                
                {hasExampleSentences && (
                    <div className="space-y-6">
                        {word.exampleSentences?.by_structure && word.exampleSentences.by_structure.length > 0 && (
                            <DetailCard title="Examples by Structure">
                                <div className="space-y-4">
                                {word.exampleSentences.by_structure.map((ex, i) => (
                                    <div key={i}>
                                        <p className="font-semibold text-lg">"{ex.sentence}"</p>
                                        <div className="text-sm text-muted-foreground">
                                            <Badge variant="outline" className="mr-2">{ex.type}</Badge>
                                            {ex.explanation}
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </DetailCard>
                        )}
                         {word.exampleSentences?.by_tense && word.exampleSentences.by_tense.length > 0 && (
                            <DetailCard title="Examples by Tense">
                                <ul className="list-disc list-inside space-y-2">
                                {word.exampleSentences.by_tense.map((ex, i) => (
                                     <li key={i}><Badge variant="secondary" className="mr-2">{ex.tense}</Badge> "{ex.sentence}"</li>
                                ))}
                                </ul>
                            </DetailCard>
                        )}
                    </div>
                )}

                {hasVerbForms && (
                    <DetailCard title="Verb Forms">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Form</TableHead>
                                <TableHead>Word & Pronunciation</TableHead>
                                <TableHead>Bangla Meaning</TableHead>
                                <TableHead>Usage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <VerbFormRow label="Present (V1)" data={word.verb_forms?.v1_present} />
                                <VerbFormRow label="Past (V2)" data={word.verb_forms?.v2_past} />
                                <VerbFormRow label="Past Participle (V3)" data={word.verb_forms?.v3_past_participle} />
                            </TableBody>
                        </Table>
                    </DetailCard>
                )}

            </main>

            <footer className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => navigateToWord(currentIndex - 1)} disabled={currentIndex <= 0}>
                    <ArrowLeft className="mr-2" /> Previous Word
                </Button>
                <Button variant="outline" onClick={() => navigateToWord(currentIndex + 1)} disabled={currentIndex >= filteredWordIds.length - 1}>
                    Next Word <ArrowRight className="ml-2" />
                </Button>
            </footer>
        </div>
    </div>
  );
}

export default function WordDetailsPage() {
    return (
        <Suspense fallback={<div className="p-4 md:p-6"><Skeleton className="h-screen w-full" /></div>}>
            <WordDetailsPageInternal />
        </Suspense>
    )
}
