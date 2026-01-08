'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FillBlanksQuizProps {
    word: Word;
    onAnswer: (isCorrect: boolean, userAnswer: string) => void;
}

export function FillBlanksQuiz({ word, onAnswer }: FillBlanksQuizProps) {
    const [userAnswer, setUserAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sentenceWithBlank = useMemo(() => {
        if (!word.exampleSentences || word.exampleSentences.length === 0) {
            return "This word doesn't have an example sentence.";
        }
        // Use the first example sentence
        const sentence = word.exampleSentences[0];
        // Case-insensitive replacement of the word
        const blank = '_______';
        const regex = new RegExp(`\\b${word.word}\\b`, 'gi');
        if (!regex.test(sentence)) {
            // If word is not found as a whole word, try to find it as part of another
             const simpleRegex = new RegExp(word.word, 'i');
             return sentence.replace(simpleRegex, blank);
        }
        return sentence.replace(regex, blank);
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
                <p className="text-lg text-muted-foreground">Fill in the blank:</p>
                <h2 className="text-2xl md:text-3xl font-semibold my-4 leading-relaxed tracking-wide">
                    "{sentenceWithBlank}"
                </h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-4">
                <Input
                    ref={inputRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type the missing word..."
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

    