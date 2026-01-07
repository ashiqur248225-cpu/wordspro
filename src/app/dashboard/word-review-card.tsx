'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { getWordsByDifficulty } from '@/lib/db';
import type { Word, WordDifficulty } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface WordReviewCardProps {
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function WordReviewCard({ difficulty }: WordReviewCardProps) {
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showMeaning, setShowMeaning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedWords = await getWordsByDifficulty([difficulty]);
            const shuffledWords = fetchedWords.sort(() => 0.5 - Math.random());
            setWords(shuffledWords);
        } catch (error) {
            console.error(`Failed to fetch ${difficulty} words:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [difficulty]);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    const cycleWord = () => {
        setShowMeaning(false);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % (words.length || 1));
    };

    const currentWord = words.length > 0 ? words[currentIndex] : null;

    const difficultyColors = {
        Easy: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700',
        Medium: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700',
        Hard: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700',
    };
    
    const badgeVariants = {
        Easy: 'secondary',
        Medium: 'default',
        Hard: 'destructive',
    } as const;

    if (isLoading) {
        return (
            <Card className={difficultyColors[difficulty]}>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                </CardHeader>
                <CardContent className="h-24">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-6 w-3/4 mt-2" />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-10" />
                </CardFooter>
            </Card>
        );
    }
    
    return (
        <Card className={`${difficultyColors[difficulty]} flex flex-col`}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                   <span>{difficulty} Words</span>
                   <Badge variant={badgeVariants[difficulty]}>{words.length} words</Badge>
                </CardTitle>
                <CardDescription>Review words you've marked as {difficulty.toLowerCase()}.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow min-h-[120px]">
                {currentWord ? (
                    <div>
                        <h3 className="text-2xl font-semibold">{currentWord.word}</h3>
                        <div className="mt-2 text-muted-foreground transition-opacity duration-300">
                           {showMeaning ? (
                             <p>{currentWord.meaning}</p>
                           ) : (
                            <p className="italic text-sm">Click 'Reveal' to see the meaning.</p>
                           )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No words found for this difficulty.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <Button variant="ghost" onClick={() => setShowMeaning(prev => !prev)} disabled={!currentWord}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {showMeaning ? 'Hide' : 'Reveal'}
                </Button>
                <Button onClick={cycleWord} disabled={words.length < 2}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Next
                </Button>
            </CardFooter>
        </Card>
    );
}
