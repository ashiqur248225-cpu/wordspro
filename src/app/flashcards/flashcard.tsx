'use client';
import { useState } from 'react';
import type { Word, VerbFormDetail, Synonym, Antonym, WordFamilyDetail } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import './flashcard.css';

interface FlashCardProps {
  word: Word;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="text-left">
      <h3 className="font-semibold text-lg mb-2 text-primary">{title}</h3>
      <div className="text-sm text-muted-foreground space-y-2">{children}</div>
    </div>
  );
}

// Reusable components with audio functionality
const VerbFormRow = ({ label, data, isPlaying, onPlay }: { label: string; data?: VerbFormDetail; isPlaying: boolean; onPlay: (text: string) => void; }) => {
    if (!data || !data.word) return null;
    return (
        <TableRow onClick={(e) => { e.stopPropagation(); onPlay(data.word!); }} className="cursor-pointer hover:bg-muted/50">
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell className="flex items-center gap-2">
              {data.word}
              <Volume2 className={cn("h-4 w-4 text-muted-foreground", isPlaying && "animate-pulse text-primary")} />
            </TableCell>
            <TableCell>{data.bangla_meaning}</TableCell>
        </TableRow>
    );
};

const WordFamilyRow = ({ label, data, isPlaying, onPlay }: { label: string; data?: WordFamilyDetail; isPlaying: boolean; onPlay: (text: string) => void; }) => {
    if (!data || !data.word) return null;
    return (
        <TableRow onClick={(e) => { e.stopPropagation(); onPlay(data.word); }} className="cursor-pointer hover:bg-muted/50">
            <TableCell className="font-medium capitalize">{label}</TableCell>
            <TableCell className="flex items-center gap-2">
              {data.word}
              <Volume2 className={cn("h-4 w-4 text-muted-foreground", isPlaying && "animate-pulse text-primary")} />
            </TableCell>
            <TableCell>{data.meaning}</TableCell>
        </TableRow>
    )
}

const getWordText = (item: string | Synonym | Antonym) => typeof item === 'string' ? item : item.word;

const SynonymAntonymItem = ({ item, isPlaying, onPlay }: { item: string | Synonym | Antonym; isPlaying: boolean; onPlay: (text: string) => void; }) => {
    const wordText = getWordText(item);
    const bangla = typeof item !== 'string' ? item.bangla : undefined;

    return (
        <Badge 
            variant={isPlaying ? 'default' : 'secondary'} 
            className="text-base px-3 py-1 cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onPlay(wordText);
            }}
        >
            <span>{wordText}</span>
            {bangla && <span className={cn("text-sm ml-2", isPlaying ? "text-primary-foreground/80" : "text-muted-foreground")}>({bangla})</span>}
            <Volume2 className={cn("inline h-4 w-4 ml-2", isPlaying ? "animate-pulse text-primary-foreground" : "text-muted-foreground")} />
        </Badge>
    );
};

export function FlashCard({ word }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  if (!word) return null;
  
  const handlePlayAudio = (textToSpeak: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.error('Speech synthesis not supported.');
        return;
    }
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (isPlaying === textToSpeak) {
          setIsPlaying(null);
          return;
        }
    }
    
    setIsPlaying(textToSpeak);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    const allVoices = window.speechSynthesis.getVoices();
    let selectedVoice = allVoices.find(voice => voice.lang === 'en-US' && (voice.name.includes('Google') || voice.name.includes('Alex')));
     if (!selectedVoice) {
        selectedVoice = allVoices.find(voice => voice.lang.startsWith('en-'));
    }

    utterance.voice = selectedVoice || null;
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => setIsPlaying(null);
    utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          console.error('Speech synthesis error:', event.error);
        }
        setIsPlaying(null);
    };

    window.speechSynthesis.speak(utterance);
  };
  
  const hasVerbForms = word.verb_forms && (word.verb_forms.v1_present?.word || word.verb_forms.v2_past?.word || word.verb_forms.v3_past_participle?.word);
  const hasWordFamily = word.word_family && Object.values(word.word_family).some(v => v);
  const hasExampleSentences = word.exampleSentences && ((word.exampleSentences.by_structure?.length || 0) > 0 || (word.exampleSentences.by_tense?.length || 0) > 0);


  return (
    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <Card className="w-full h-full">
             <ScrollArea className="h-full">
                <div className="p-6">
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center gap-2">
                            <CardTitle className="text-4xl font-bold">{word.word}</CardTitle>
                             <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handlePlayAudio(word.word); }}>
                                <Volume2 className={cn("h-7 w-7 text-muted-foreground", isPlaying === word.word && "animate-pulse text-primary")} />
                            </Button>
                        </div>
                        <CardDescription className="text-xl capitalize">{word.partOfSpeech}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailSection title="Meaning">
                            <p className="text-2xl text-center font-semibold">{word.meaning}</p>
                        </DetailSection>

                        {word.usage_distinction && (
                            <DetailSection title="Usage Distinction">
                                <p className="italic">"{word.usage_distinction}"</p>
                            </DetailSection>
                        )}
                        
                        {hasWordFamily && (
                             <DetailSection title="Word Family">
                                <Table>
                                    <TableBody>
                                        <WordFamilyRow label="noun" data={word.word_family?.noun} isPlaying={isPlaying === word.word_family?.noun?.word} onPlay={handlePlayAudio} />
                                        <WordFamilyRow label="adjective" data={word.word_family?.adjective} isPlaying={isPlaying === word.word_family?.adjective?.word} onPlay={handlePlayAudio} />
                                        <WordFamilyRow label="adverb" data={word.word_family?.adverb} isPlaying={isPlaying === word.word_family?.adverb?.word} onPlay={handlePlayAudio} />
                                        <WordFamilyRow label="verb" data={word.word_family?.verb} isPlaying={isPlaying === word.word_family?.verb?.word} onPlay={handlePlayAudio} />
                                    </TableBody>
                                </Table>
                            </DetailSection>
                        )}

                        {hasVerbForms && (
                             <DetailSection title="Verb Forms">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Form</TableHead>
                                            <TableHead>Word</TableHead>
                                            <TableHead>Meaning</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <VerbFormRow label="V1" data={word.verb_forms?.v1_present} isPlaying={isPlaying === word.verb_forms?.v1_present?.word} onPlay={handlePlayAudio} />
                                        <VerbFormRow label="V2" data={word.verb_forms?.v2_past} isPlaying={isPlaying === word.verb_forms?.v2_past?.word} onPlay={handlePlayAudio} />
                                        <VerbFormRow label="V3" data={word.verb_forms?.v3_past_participle} isPlaying={isPlaying === word.verb_forms?.v3_past_participle?.word} onPlay={handlePlayAudio} />
                                    </TableBody>
                                </Table>
                            </DetailSection>
                        )}
                    </CardContent>
                </div>
             </ScrollArea>
          </Card>
        </div>
        <div className="flashcard-back">
          <Card className="w-full h-full">
            <ScrollArea className="h-full">
                <div className="p-6">
                    <CardHeader>
                        <CardTitle className="text-center text-3xl">{word.word} - Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {hasExampleSentences && (
                            <DetailSection title="Example Sentences">
                                <ul className="list-disc list-inside space-y-2">
                                    {word.exampleSentences?.by_structure?.map((ex, i) => (
                                        <li key={`str-${i}`}>
                                            <span className="font-semibold">"{ex.sentence}"</span>
                                            {ex.explanation && <p className="text-xs italic text-muted-foreground/80 pl-4">{ex.explanation}</p>}
                                        </li>
                                    ))}
                                    {word.exampleSentences?.by_tense?.map((ex, i) => (
                                        <li key={`ten-${i}`}>
                                            <Badge variant="outline" className="mr-2">{ex.tense}</Badge> 
                                            <span className="font-semibold">"{ex.sentence}"</span>
                                        </li>
                                    ))}
                                </ul>
                            </DetailSection>
                        )}

                        {word.synonyms && word.synonyms.length > 0 && (
                            <DetailSection title="Synonyms">
                                <div className="flex flex-wrap gap-2">
                                    {word.synonyms.map((item, i) => <SynonymAntonymItem key={i} item={item} isPlaying={isPlaying === getWordText(item)} onPlay={handlePlayAudio} />)}
                                </div>
                            </DetailSection>
                        )}

                        {word.antonyms && word.antonyms.length > 0 && (
                            <DetailSection title="Antonyms">
                                <div className="flex flex-wrap gap-2">
                                    {word.antonyms.map((item, i) => <SynonymAntonymItem key={i} item={item} isPlaying={isPlaying === getWordText(item)} onPlay={handlePlayAudio} />)}
                                </div>
                            </DetailSection>
                        )}
                    </CardContent>
                </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
