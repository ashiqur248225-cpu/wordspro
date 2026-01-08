'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FillBlanksQuizProps {
    word: Word;
    onAnswer: (isCorrect: boolean, userAnswer: string) => void;
}

// Function to create a word with blanks, keeping first and last letter
const createWordWithBlanks = (wordStr: string) => {
    if (wordStr.length <= 2) {
        return wordStr;
    }
    const chars = wordStr.split('');
    const middleChars = chars.slice(1, -1);
    const charsToReplace = Math.max(1, Math.floor(middleChars.length * 0.5)); // Replace 50% of middle chars

    const indicesToReplace = new Set<number>();
    while (indicesToReplace.size < charsToReplace) {
        const randomIndex = Math.floor(Math.random() * middleChars.length);
        indicesToReplace.add(randomIndex);
    }
    
    const blankedMiddle = middleChars.map((char, index) => {
        return indicesToReplace.has(index) ? '_' : char;
    });

    return [chars[0], ...blankedMiddle, chars[chars.length - 1]].join(' ');
};

export function FillBlanksQuiz({ word, onAnswer }: FillBlanksQuizProps) {
    const [userAnswer, setUserAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const wordWithBlanks = useMemo(() => {
        return createWordWithBlanks(word.word);
    }, [word]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userAnswer.trim()) return;

        setIsSubmitted(true);
        const isCorrect = userAnswer.trim().toLowerCase() === word.word.toLowerCase();
        onAnswer(isCorrect, userAnswer.trim());
    };
    
    const getBorderColor = () => {
        if (!isSubmitted) return '';
        const isCorrect = userAnswer.trim().toLowerCase() === word.word.toLowerCase();
        return isCorrect ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-500 focus-visible:ring-red-500';
    }


    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <p className="text-lg text-muted-foreground">Complete the word:</p>
                <h2 className="text-2xl md:text-3xl font-semibold my-4 leading-relaxed tracking-wide font-mono">
                    {wordWithBlanks}
                </h2>
                <p className="text-lg text-muted-foreground">Meaning: <span className="font-semibold">{word.meaning}</span></p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-4">
                <Input
                    ref={inputRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type the full word..."
                    disabled={isSubmitted}
                    className={`text-center text-2xl h-16 ${getBorderColor()}`}
                    autoCapitalize="none"
                    autoCorrect="off"
                />
                <Button type="submit" size="lg" disabled={isSubmitted}>
                    Check
                </Button>
            </form>
        </div>
    );
}
