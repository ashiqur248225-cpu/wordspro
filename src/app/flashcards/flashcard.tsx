'use client';
import { useState } from 'react';
import type { Word, VerbFormDetail, Synonym, Antonym, WordFamilyDetail } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const VerbFormRow = ({ label, data }: { label: string, data?: VerbFormDetail }) => {
    if (!data || !data.word) return null;
    return (
        <TableRow>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell>{data.word}</TableCell>
            <TableCell>{data.bangla_meaning}</TableCell>
        </TableRow>
    );
};

const WordFamilyRow = ({ label, data }: { label: string, data?: WordFamilyDetail }) => {
    if (!data) return null;
    return (
        <TableRow>
            <TableCell className="font-medium capitalize">{label}</TableCell>
            <TableCell>{data.word}</TableCell>
            <TableCell>{data.meaning}</TableCell>
        </TableRow>
    )
}

const SynonymAntonymItem = ({ item }: { item: string | Synonym | Antonym }) => {
    const wordText = typeof item === 'string' ? item : item.word;
    const bangla = typeof item !== 'string' ? item.bangla : undefined;

    return (
        <Badge variant="secondary" className="text-base px-3 py-1">
            <span>{wordText}</span>
            {bangla && <span className="text-sm text-muted-foreground ml-2">({bangla})</span>}
        </Badge>
    );
};

export function FlashCard({ word }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!word) return null;
  
  const hasVerbForms = word.verb_forms && (word.verb_forms.v1_present?.word || word.verb_forms.v2_past?.word || word.verb_forms.v3_past_participle?.word);
  const hasWordFamily = word.word_family && Object.values(word.word_family).some(v => v);

  return (
    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <Card className="w-full h-full">
             <ScrollArea className="h-full">
                <div className="p-6">
                    <CardHeader className="text-center">
                        <CardTitle className="text-4xl font-bold">{word.word}</CardTitle>
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
                                        <WordFamilyRow label="noun" data={word.word_family?.noun} />
                                        <WordFamilyRow label="adjective" data={word.word_family?.adjective} />
                                        <WordFamilyRow label="adverb" data={word.word_family?.adverb} />
                                        <WordFamilyRow label="verb" data={word.word_family?.verb} />
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
                                        <VerbFormRow label="V1" data={word.verb_forms?.v1_present} />
                                        <VerbFormRow label="V2" data={word.verb_forms?.v2_past} />
                                        <VerbFormRow label="V3" data={word.verb_forms?.v3_past_participle} />
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
                        {word.exampleSentences && (word.exampleSentences.by_tense || word.exampleSentences.by_structure) && (
                            <DetailSection title="Example Sentences">
                                <ul className="list-disc list-inside space-y-2">
                                    {word.exampleSentences.by_structure?.map((ex, i) => <li key={`str-${i}`}>"{ex.sentence}"</li>)}
                                    {word.exampleSentences.by_tense?.map((ex, i) => <li key={`ten-${i}`}>"{ex.sentence}"</li>)}
                                </ul>
                            </DetailSection>
                        )}

                        {word.synonyms && word.synonyms.length > 0 && (
                            <DetailSection title="Synonyms">
                                <div className="flex flex-wrap gap-2">
                                    {word.synonyms.map((item, i) => <SynonymAntonymItem key={i} item={item} />)}
                                </div>
                            </DetailSection>
                        )}

                        {word.antonyms && word.antonyms.length > 0 && (
                            <DetailSection title="Antonyms">
                                <div className="flex flex-wrap gap-2">
                                    {word.antonyms.map((item, i) => <SynonymAntonymItem key={i} item={item} />)}
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
