'use client';
import { useState, useRef, useEffect } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

interface SpellingQuizProps {
    word: Word;
    onAnswer: (isCorrect: boolean, userAnswer: string) => void;
    mode?: 'meaning' | 'listening'; // default 'meaning'
}

export function SpellingQuiz({ word, onAnswer, mode = 'meaning' }: SpellingQuizProps) {
    const [userAnswer, setUserAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userAnswer.trim()) return;

        setIsSubmitted(true);
        const isCorrect = userAnswer.trim().toLowerCase() === word.word.toLowerCase();
        onAnswer(isCorrect, userAnswer.trim());
    };
    
    // For listening mode (future)
    const handlePlayAudio = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(word.word);
            window.speechSynthesis.speak(utterance);
        }
    };


    const getBorderColor = () => {
        if (!isSubmitted) return '';
        const isCorrect = userAnswer.trim().toLowerCase() === word.word.toLowerCase();
        return isCorrect ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-500 focus-visible:ring-red-500';
    }


    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
                 {mode === 'meaning' ? (
                    <>
                        <p className="text-lg text-muted-foreground">What is the English word for:</p>
                        <h2 className="text-4xl font-bold my-2">{word.meaning}</h2>
                    </>
                ) : (
                     <>
                        <p className="text-lg text-muted-foreground">Listen and type the word:</p>
                        <Button variant="outline" size="icon" onClick={handlePlayAudio} className="my-2">
                            <Volume2 />
                        </Button>
                        <p className="text-sm text-muted-foreground">(Coming Soon)</p>
                    </>
                )}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                    ref={inputRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type the spelling..."
                    disabled={isSubmitted || mode === 'listening'}
                    className={`text-center text-2xl h-16 ${getBorderColor()}`}
                />
                <Button type="submit" size="lg" disabled={isSubmitted || mode === 'listening'}>
                    Check
                </Button>
            </form>
        </div>
    );
}
