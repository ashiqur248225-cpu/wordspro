'use client';
import { useState, useEffect, useCallback } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { getWord, getAllWords } from '@/lib/db';
import type { Word, VerbFormDetail } from '@/lib/types';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Volume2, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { speak } from '@/ai/flows/tts-flow';

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

const VerbFormRow = ({ label, data }: { label: string, data?: VerbFormDetail }) => {
    if (!data || !data.word) return null;
    return (
        <div className="grid grid-cols-4 gap-4 py-4 border-b">
            <div className="font-medium text-muted-foreground">{label}</div>
            <div className="col-span-1">
                <p className="font-semibold">{data.word} <Volume2 className="inline h-4 w-4 text-muted-foreground" /></p>
                <p className="text-sm text-muted-foreground">{data.pronunciation}</p>
            </div>
            <div className="col-span-1">
                <p>{data.bangla_meaning}</p>
            </div>
            <div className="col-span-1">
                <p className="text-sm text-muted-foreground">{data.usage_timing}</p>
            </div>
        </div>
    );
};


export default function WordDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [word, setWord] = useState<Word | null>(null);
  const [allWordIds, setAllWordIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pronunciation settings state
  const [accent, setAccent] = useState<'US' | 'UK'>('US');
  const [speed, setSpeed] = useState([1]);
  const [volume, setVolume] = useState([1]);


  const handlePlayAudio = async () => {
    if (!word || isPlaying) return;
    setIsPlaying(true);
    try {
        const audioData = await speak({
            text: word.word,
            accent: accent,
            speed: speed[0],
            volume: volume[0]
        });
        if (audioData) {
            const audio = new Audio(audioData);
            audio.play();
            audio.onended = () => setIsPlaying(false);
        } else {
            setIsPlaying(false);
        }
    } catch (error) {
        console.error("Failed to play audio:", error);
        setIsPlaying(false);
    }
  };


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

  const fetchAllWordIds = useCallback(async () => {
    try {
        const allWords = await getAllWords();
        // Sorting by creation date to have a consistent order
        const sortedWords = allWords.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const ids = sortedWords.map(w => w.id);
        setAllWordIds(ids);
    } catch(e) {
        console.error("Could not fetch word list for navigation", e);
    }
  }, []);

  useEffect(() => {
    fetchWordData();
    fetchAllWordIds();
  }, [id, fetchWordData, fetchAllWordIds]);

  useEffect(() => {
    if (word && allWordIds.length > 0) {
        const index = allWordIds.indexOf(word.id);
        setCurrentIndex(index);
    }
    setLoading(false);
  }, [word, allWordIds]);

  const navigateToWord = (index: number) => {
    if (index >= 0 && index < allWordIds.length) {
      const nextId = allWordIds[index];
      router.push(`/words/${nextId}`);
    }
  };

  if (loading) {
    return (
      <PageTemplate title="Loading..." description="Fetching word details.">
          <div className="space-y-4">
              <Skeleton className="h-12 w-1/4" />
              <Skeleton className="h-8 w-1/6" />
              <div className="space-y-6 pt-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
          </div>
      </PageTemplate>
    );
  }

  if (!word) {
    // This case should be handled by notFound(), but as a fallback:
    return null;
  }

  const hasVerbForms = word.verb_forms && (word.verb_forms.v1_present?.word || word.verb_forms.v2_past?.word || word.verb_forms.v3_past_participle?.word);

  return (
    <PageTemplate title={word.word} description={word.partOfSpeech}>
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-5xl font-bold">{word.word}</h1>
                    <p className="text-xl text-muted-foreground">{word.partOfSpeech}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePlayAudio} disabled={isPlaying}>
                        <Volume2 className={isPlaying ? 'animate-pulse' : ''} />
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
                                            defaultValue={accent}
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
                                            max={1.5}
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
            </div>

            <div className="space-y-6">
                <DetailCard title="Meaning (Bangla)">
                    <p className="text-2xl">{word.meaning}</p>
                </DetailCard>

                <DetailCard title="Meaning Explanation">
                    <p className="text-lg text-muted-foreground">"{word.meaning_explanation}"</p>
                </DetailCard>

                <DetailCard title="Usage Distinction">
                     <p className="text-lg text-muted-foreground">"{word.usageDistinction}"</p>
                </DetailCard>

                <DetailCard title="Syllables">
                    <p className="font-mono text-lg">{word.syllables?.join(' / ')}</p>
                </DetailCard>
                
                <DetailCard title="Example Sentences">
                    <ul className="list-disc list-inside space-y-2">
                        {word.exampleSentences?.map((sentence, i) => <li key={i} className="text-lg">"{sentence}"</li>)}
                    </ul>
                </DetailCard>

                {hasVerbForms && (
                    <DetailCard title="Verb Forms">
                        <VerbFormRow label="Present (V1)" data={word.verb_forms?.v1_present} />
                        <VerbFormRow label="Past (V2)" data={word.verb_forms?.v2_past} />
                        <VerbFormRow label="Past Participle (V3)" data={word.verb_forms?.v3_past_participle} />
                    </DetailCard>
                )}
                
                {word.verb_forms?.form_examples && (
                     <DetailCard title="Form Examples">
                        <div className="space-y-2 text-lg">
                           <p><span className="font-bold">V1:</span> "{word.verb_forms.form_examples.v1}"</p>
                           <p><span className="font-bold">V2:</span> "{word.verb_forms.form_examples.v2}"</p>
                           <p><span className="font-bold">V3:</span> "{word.verb_forms.form_examples.v3}"</p>
                        </div>
                    </DetailCard>
                )}
            </div>

            <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => navigateToWord(currentIndex - 1)} disabled={currentIndex <= 0}>
                    <ArrowLeft className="mr-2" /> Previous Word
                </Button>
                <Button variant="outline" onClick={() => navigateToWord(currentIndex + 1)} disabled={currentIndex >= allWordIds.length - 1}>
                    Next Word <ArrowRight className="ml-2" />
                </Button>
            </div>
        </div>
    </PageTemplate>
  );
}
