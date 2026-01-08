'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface VerbFormQuizProps {
    word: Word;
    onAnswer: (isCorrect: boolean, userAnswer: {v2: string, v3: string}) => void;
}


export function VerbFormQuiz({ word, onAnswer }: VerbFormQuizProps) {
    const [v2Answer, setV2Answer] = useState('');
    const [v3Answer, setV3Answer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const v2InputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        v2InputRef.current?.focus();
    }, []);

    if (!word.verb_forms) {
        return <p>This word does not have enough verb forms for a quiz.</p>;
    }
    
    const correctAnswerV2 = word.verb_forms?.v2_past?.word || '';
    const correctAnswerV3 = word.verb_forms?.v3_past_participle?.word || '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!v2Answer.trim() || !v3Answer.trim()) return;

        setIsSubmitted(true);
        const isCorrect = v2Answer.trim().toLowerCase() === correctAnswerV2.toLowerCase() &&
                          v3Answer.trim().toLowerCase() === correctAnswerV3.toLowerCase();
        
        onAnswer(isCorrect, { v2: v2Answer.trim(), v3: v3Answer.trim() });
    };

    const getBorderColor = (userAnswer: string, correctAnswer: string) => {
        if (!isSubmitted) return '';
        return userAnswer.toLowerCase() === correctAnswer.toLowerCase() ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-500 focus-visible:ring-red-500';
    };


    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8 space-y-2">
                 <h2 className="text-2xl font-bold">Verb Form Test</h2>
                <p className="text-muted-foreground">
                    Write the correct Past (V2) and Past Participle (V3) forms of "<span className="font-bold text-primary">{word.word}</span>".
                </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="v2" className="text-lg">Past Form (V2)</Label>
                    <Input
                        id="v2"
                        ref={v2InputRef}
                        value={v2Answer}
                        onChange={(e) => setV2Answer(e.target.value)}
                        placeholder="e.g., went"
                        disabled={isSubmitted}
                        className={`text-center text-xl h-14 ${getBorderColor(v2Answer, correctAnswerV2)}`}
                        autoCapitalize="none"
                        autoCorrect="off"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="v3" className="text-lg">Past Participle (V3)</Label>
                    <Input
                        id="v3"
                        value={v3Answer}
                        onChange={(e) => setV3Answer(e.target.value)}
                        placeholder="e.g., gone"
                        disabled={isSubmitted}
                        className={`text-center text-xl h-14 ${getBorderColor(v3Answer, correctAnswerV3)}`}
                        autoCapitalize="none"
                        autoCorrect="off"
                    />
                </div>
                <Button type="submit" size="lg" disabled={isSubmitted} className="w-full">
                    Submit
                </Button>
            </form>
        </div>
    );
}
