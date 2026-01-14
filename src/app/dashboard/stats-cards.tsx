'use client';
import { useState, useEffect } from 'react';
import { Book, CheckCircle, Target, Brain } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAllWords } from '@/lib/db';
import type { Word } from '@/lib/types';

export function StatsCards() {
    const [stats, setStats] = useState({
        totalWords: 0,
        learnedWords: 0,
        averageAccuracy: 0,
        wordsToReview: 0
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                const words: Word[] = await getAllWords();
                const totalWords = words.length;
                const learnedWords = words.filter(w => w.difficulty === 'Learned').length;
                const masteredWords = words.filter(w => w.difficulty === 'Learned' || w.difficulty === 'Easy').length;
                const wordsToReview = words.filter(w => w.difficulty === 'Hard' || w.difficulty === 'Medium').length;
                const averageAccuracy = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
                
                setStats({ totalWords, learnedWords, averageAccuracy, wordsToReview });
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            }
        }
        fetchStats();
    }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Words</CardTitle>
          <Book className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWords}</div>
          <p className="text-xs text-muted-foreground">in your vocabulary</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Learned Words</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.learnedWords}</div>
          <p className="text-xs text-muted-foreground">marked as 'Learned'</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">To Review</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.wordsToReview}</div>
          <p className="text-xs text-muted-foreground">'Hard' or 'Medium'</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mastery</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageAccuracy}%</div>
          <p className="text-xs text-muted-foreground">overall word mastery</p>
        </CardContent>
      </Card>
    </div>
  );
}
