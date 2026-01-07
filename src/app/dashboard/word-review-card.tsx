'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getWordsByDifficulty } from '@/lib/db';
import type { Word } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

interface WordReviewCardProps {
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function WordReviewCard({ difficulty }: WordReviewCardProps) {
    const [wordCount, setWordCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWordCount = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedWords = await getWordsByDifficulty([difficulty]);
            setWordCount(fetchedWords.length);
        } catch (error) {
            console.error(`Failed to fetch ${difficulty} words:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [difficulty]);

    useEffect(() => {
        fetchWordCount();
    }, [fetchWordCount]);

    const difficultyColors = {
        Easy: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600',
        Medium: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-600',
        Hard: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600',
    };
    
    const badgeVariants = {
        Easy: 'secondary',
        Medium: 'default',
        Hard: 'destructive',
    } as const;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-6 w-24" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Link href={`/words?difficulty=${difficulty}`} className="block">
            <Card className={`${difficultyColors[difficulty]} transition-all`}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                       <span>{difficulty} Words</span>
                       <Badge variant={badgeVariants[difficulty]}>{wordCount} words</Badge>
                    </CardTitle>
                    <CardDescription>Review words you've marked as {difficulty.toLowerCase()}.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center justify-end text-sm font-medium text-primary">
                        View List <ArrowRight className="ml-2 h-4 w-4" />
                   </div>
                </CardContent>
            </Card>
        </Link>
    );
}
