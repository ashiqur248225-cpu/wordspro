'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllWords } from '@/lib/db';
import type { Word } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

function getInitials(word: string) {
    return word.substring(0, 2).toUpperCase();
}

export function RecentActivity() {
    const [recentWords, setRecentWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecentActivity() {
            try {
                const allWords = await getAllWords();
                const sortedWords = allWords.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.createdAt).getTime());
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
                        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
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
        <div className="space-y-6">
            {recentWords.map((word) => (
                <Link href={`/words/${word.id}`} key={word.id} className="flex items-center gap-4 group">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{getInitials(word.word)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none group-hover:underline">
                            {new Date(word.createdAt).getTime() === new Date(word.updatedAt).getTime() ? "Added word:" : "Updated word:"} <span className="text-primary">{word.word}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(word.updatedAt), { addSuffix: true })}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
