'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { getWordsByDifficulty, getAllWords, updateWord } from '@/lib/db';
import type { Word, WordDifficulty } from '@/lib/types';
import { McqEnBnQuiz } from '../quiz/mcq-en-bn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

type LearningState = 'loading' | 'testing' | 'feedback' | 'finished';
type DifficultyFilter = 'All' | "Today's" | 'Hard' | 'Medium' | 'Easy' | 'New';
type ExamType = 'dynamic' | 'mcq-en-bn' | 'spelling' | 'fill-blanks' | 'verb-form';

interface AnswerFeedback {
    isCorrect: boolean;
    correctAnswer: string;
    userAnswer: string;
}

const difficultyLevels: WordDifficulty[] = ['Hard', 'Medium', 'Easy', 'New'];

export function LearningClient() {
    const [state, setState] = useState<LearningState>('loading');
    const [wordQueue, setWordQueue] = useState<Word[]>([]);
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);

    const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('Hard');
    const [examType, setExamType] = useState<ExamType>('mcq-en-bn');

    const selectWords = useCallback(async () => {
        setState('loading');
        let words: Word[] = [];
        const today = new Date().toDateString();

        if (difficultyFilter === 'All') {
            words = await getAllWords();
        } else if (difficultyFilter === "Today's") {
            const allWords = await getAllWords();
            words = allWords.filter(w => new Date(w.createdAt).toDateString() === today);
        } else {
            words = await getWordsByDifficulty([difficultyFilter as WordDifficulty]);
        }

        // Smart Revision: Prioritize Hard, then Medium, then others.
        const priorityMap = { 'Hard': 1, 'Medium': 2, 'Easy': 3, 'New': 4 };
        const sortedWords = words.sort((a, b) => priorityMap[a.difficulty] - priorityMap[b.difficulty]);

        setWordQueue(sortedWords);
    }, [difficultyFilter]);

    useEffect(() => {
        selectWords();
    }, [selectWords]);

    useEffect(() => {
        if (wordQueue.length > 0) {
            setCurrentWord(wordQueue[0]);
            setState('testing');
        } else if(state !== 'loading') {
            setState('finished');
            setCurrentWord(null);
        }
    }, [wordQueue, state]);


    const handleAnswer = async (isCorrect: boolean, userAnswer: string) => {
        if (!currentWord) return;

        const newStats = { ...currentWord };
        if(isCorrect) {
            newStats.correct_count = (newStats.correct_count || 0) + 1;
            // Promote word difficulty
            const currentDifficultyIndex = difficultyLevels.indexOf(newStats.difficulty);
            if (currentDifficultyIndex > 0) {
                newStats.difficulty = difficultyLevels[currentDifficultyIndex - 1];
            }
        } else {
            newStats.wrong_count = {
                spelling: newStats.wrong_count?.spelling || 0,
                meaning: (newStats.wrong_count?.meaning || 0) + 1, // Assuming MCQ is meaning based
            };
            // Demote word difficulty
             const currentDifficultyIndex = difficultyLevels.indexOf(newStats.difficulty);
             if (currentDifficultyIndex < difficultyLevels.length - 1) {
                 newStats.difficulty = difficultyLevels[currentDifficultyIndex + 1];
             }
        }
        newStats.total_exams = (newStats.total_exams || 0) + 1;

        await updateWord(newStats as Word);

        setFeedback({ isCorrect, correctAnswer: currentWord.meaning, userAnswer });
        setState('feedback');
    };

    const handleNextWord = () => {
        setState('loading');
        setFeedback(null);
        setWordQueue(prev => prev.slice(1));
    };

    const renderTest = () => {
        if (!currentWord) return <p>No word available.</p>;

        switch (examType) {
            case 'mcq-en-bn':
                return <McqEnBnQuiz words={[currentWord]} onAnswer={handleAnswer} />;
            case 'spelling':
            case 'fill-blanks':
            case 'verb-form':
            default:
                return (
                    <div className="text-center p-8">
                        <h3 className="font-semibold text-lg">Coming Soon!</h3>
                        <p className="text-muted-foreground">This exam type is under construction.</p>
                    </div>
                )
        }
    };

    const difficultyOptions: { value: DifficultyFilter, label: string }[] = [
        { value: 'Hard', label: 'Hard Words' },
        { value: 'Medium', label: 'Medium Words' },
        { value: 'Easy', label: 'Easy Words' },
        { value: 'New', label: 'New Words' },
        { value: 'All', label: 'All Words' },
        { value: "Today's", label: "Today's Words" },
    ];

     const examTypeOptions: { value: ExamType, label: string, disabled: boolean }[] = [
        { value: 'dynamic', label: 'Dynamic Revision', disabled: true },
        { value: 'mcq-en-bn', label: 'MCQ (Eng to Ban)', disabled: false },
        { value: 'spelling', label: 'Spelling Test', disabled: true },
        { value: 'fill-blanks', label: 'Fill-in-the-Blanks', disabled: true },
        { value: 'verb-form', label: 'Verb Form Test', disabled: true },
    ];


    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={difficultyFilter} onValueChange={(val) => setDifficultyFilter(val as DifficultyFilter)}>
                    <SelectTrigger><SelectValue placeholder="Select Difficulty" /></SelectTrigger>
                    <SelectContent>
                        {difficultyOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={examType} onValueChange={(val) => setExamType(val as ExamType)}>
                    <SelectTrigger><SelectValue placeholder="Select Exam Type" /></SelectTrigger>
                    <SelectContent>
                        {examTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <Card className="min-h-[300px] flex items-center justify-center">
                <CardContent className="w-full pt-6">
                    {state === 'loading' && <LoadingState />}
                    {state === 'testing' && renderTest()}
                    {state === 'feedback' && feedback && (
                        <FeedbackScreen
                            feedback={feedback}
                            word={currentWord!}
                            onNext={handleNextWord}
                        />
                    )}
                    {state === 'finished' && <FinishedState onRestart={selectWords} />}
                </CardContent>
            </Card>
        </div>
    );
}


function LoadingState() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <div className="grid grid-cols-2 gap-4 mt-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
}

function FeedbackScreen({ feedback, word, onNext }: { feedback: AnswerFeedback, word: Word, onNext: () => void }) {
    return (
        <div className={`text-center space-y-4 p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
            {feedback.isCorrect ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            )}
            <h2 className="text-2xl font-bold">{feedback.isCorrect ? 'Correct!' : 'Incorrect'}</h2>
            
            {!feedback.isCorrect && (
                <p className="text-lg">Your answer: <span className="font-semibold">{feedback.userAnswer}</span></p>
            )}

            <div className="text-lg bg-muted/50 p-4 rounded-md">
                <p>The correct meaning for <span className="font-bold text-primary">{word.word}</span> is:</p>
                <p className="text-2xl font-semibold">{word.meaning}</p>
            </div>
            
            {word.exampleSentences && word.exampleSentences[0] && (
                 <p className="text-muted-foreground italic">e.g., "{word.exampleSentences[0]}"</p>
            )}

            <Button onClick={onNext} className="w-full md:w-1/2">
                Next Word
            </Button>
        </div>
    );
}

function FinishedState({ onRestart }: { onRestart: () => void }) {
    return (
        <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <p className="text-muted-foreground">You have reviewed all the words in this set.</p>
            <div className='space-x-2'>
                <Button onClick={onRestart}>Restart Session</Button>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
