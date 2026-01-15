'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getWordsByDifficulty, getAllWords } from '@/lib/db';
import type { Word, WordDifficulty } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

interface WordReviewCardProps {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'New' | 'All' | 'Learned';
}

export function WordReviewCard({ difficulty }: WordReviewCardProps) {
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWordCount = useCallback(async () => {
    setIsLoading(true);
    try {
      let fetchedWords: Word[] = [];
      if (difficulty === 'All') {
        fetchedWords = await getAllWords();
      } else {
        fetchedWords = await getWordsByDifficulty([difficulty as WordDifficulty]);
      }
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

  const difficultyConfig = {
    Easy: {
      color:
        'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-600',
      badge: 'secondary',
      description: "Words you've marked as easy."
    },
    Medium: {
      color:
        'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700/50 hover:border-yellow-400 dark:hover:border-yellow-600',
      badge: 'default',
      description: 'Words that need some practice.'
    },
    Hard: {
      color:
        'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700/50 hover:border-red-400 dark:hover:border-red-600',
      badge: 'destructive',
      description: 'Focus on these challenging words.'
    },
    New: {
      color:
        'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700/50 hover:border-blue-400 dark:hover:border-blue-600',
      badge: 'outline',
      description: 'Fresh words added to your list.'
    },
    Learned: {
      color:
        'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700/50 hover:border-indigo-400 dark:hover:border-indigo-600',
      badge: 'secondary',
      description: 'Words you have mastered.'
    },
    All: {
        color:
        'bg-slate-100 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700/50 hover:border-slate-400 dark:hover:border-slate-600',
      badge: 'secondary',
      description: 'View your entire collection.'
    }
  } as const;

  const config = difficultyConfig[difficulty];


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardFooter>
          <Skeleton className="h-6 w-24" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card asChild className={`${config.color} transition-all flex flex-col`}>
      <Link href={`/flashcards?difficulty=${difficulty}`}>
        <CardHeader className="flex-grow">
          <CardTitle className="flex items-center justify-between">
            <span>{difficulty} Words</span>
            <Badge variant={config.badge}>{wordCount} words</Badge>
          </CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <div className="flex items-center text-sm font-medium text-primary">
            Start Flashcards <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
