'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllWords } from '@/lib/db';
import type { Word } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { PlusCircle, FilePenLine } from 'lucide-react';


export function RecentActivity() {
    const [recentWords, setRecentWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecentActivity() {
            try {
                const allWords = await getAllWords();
                const sortedWords = allWords.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setRecentWords(sortedWords.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch recent activity:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchRecentActivity();
    }, []);

    if (loading) {
        return (
             <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                        <div className="grid gap-1 w-full">
                           <div className="h-4 bg-muted animate-pulse w-1/2" />
                           <div className="h-3 bg-muted animate-pulse w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (recentWords.length === 0) {
        return (
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {recentWords.map((word) => {
                const isNew = new Date(word.createdAt).getTime() === new Date(word.updatedAt).getTime();
                return (
                    <Link href={`/words/${word.id}`} key={word.id} className="flex items-center gap-3 p-2 -mx-2 rounded-lg transition-colors hover:bg-muted/50">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isNew ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {isNew ? <PlusCircle className="h-4 w-4" /> : <FilePenLine className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium leading-none">
                                {isNew ? "Added:" : "Updated:"} <span className="text-primary">{word.word}</span>
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(word.updatedAt), { addSuffix: true })}
                        </p>
                    </Link>
                )
            })}
        </div>
    );
}
