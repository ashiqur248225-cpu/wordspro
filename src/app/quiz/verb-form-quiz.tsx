'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VerbFormQuizProps {
    word: Word;
    onAnswer: (isCorrect: boolean, userAnswer: string) => void;
}

type VerbFormKey = 'v1_present' | 'v2_past' | 'v3_past_participle';

export function VerbFormQuiz({ word, onAnswer }: VerbFormQuizProps) {
    const [userAnswer, setUserAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { knownForm, unknownFormKey } = useMemo(() => {
        const forms: VerbFormKey[] = ['v1_present', 'v2_past', 'v3_past_participle'];
        const availableForms = forms.filter(key => word.verb_forms?.[key]?.word);
        
        if (availableForms.length < 2) {
            // This should be handled by the fallback in learning-client, but as a safeguard:
            return { knownForm: null, unknownFormKey: null };
        }
        
        const knownIndex = Math.floor(Math.random() * availableForms.length);
        let unknownIndex = Math.floor(Math.random() * availableForms.length);
        while (unknownIndex === knownIndex) {
            unknownIndex = Math.floor(Math.random() * availableForms.length);
        }

        const knownKey = availableForms[knownIndex];
        
        return {
            knownForm: { key: knownKey, ...word.verb_forms![knownKey]! },
            unknownFormKey: availableForms[unknownIndex],
        };
    }, [word]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    if (!knownForm || !unknownFormKey) {
        return <p>This word does not have enough verb forms for a quiz.</p>;
    }
    
    const correctAnswer = word.verb_forms?.[unknownFormKey]?.word || '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userAnswer.trim()) return;

        setIsSubmitted(true);
        const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();
        onAnswer(isCorrect, userAnswer.trim());
    };

    const getBorderColor = () => {
        if (!isSubmitted) return '';
        const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();
        return isCorrect ? 'border-green-500 focus-visible:ring-green-500' : 'border-red-500 focus-visible:ring-red-500';
    };

    const formLabels: Record<VerbFormKey, string> = {
        v1_present: 'V1 (Present)',
        v2_past: 'V2 (Past)',
        v3_past_participle: 'V3 (Past Participle)',
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8 space-y-4">
                <p className="text-lg text-muted-foreground">
                    Given the <Badge variant="secondary">{formLabels[knownForm.key]}</Badge> form of the verb:
                </p>
                <h2 className="text-4xl font-bold">{knownForm.word}</h2>
                <p className="text-lg text-muted-foreground">
                    What is the <Badge>{formLabels[unknownFormKey]}</Badge> form?
                </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-4">
                <Input
                    ref={inputRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={`Type the ${formLabels[unknownFormKey]} form...`}
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

    