'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { getWordsByDifficulty, getAllWords, updateWord } from '@/lib/db';
import type { Word, WordDifficulty } from '@/lib/types';
import { McqEnBnQuiz } from '../quiz/mcq-en-bn';
import { McqBnEnQuiz } from '../quiz/mcq-bn-en';
import { SpellingQuiz } from '../quiz/spelling-quiz';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';


type LearningState = 'loading' | 'testing' | 'feedback' | 'finished';
type DifficultyFilter = 'All' | "Today's" | 'Hard' | 'Medium' | 'Easy' | 'New';
type ExamType = 'dynamic' | 'mcq-en-bn' | 'mcq-bn-en' | 'spelling' | 'fill-blanks' | 'verb-form';

interface AnswerFeedback {
    isCorrect: boolean;
    correctAnswer: string;
    userAnswer: string;
    quizType: ExamType;
}

const difficultyLevels: WordDifficulty[] = ['Easy', 'Medium', 'Hard'];

export function LearningClient() {
    const [state, setState] = useState<LearningState>('loading');
    const [wordQueue, setWordQueue] = useState<Word[]>([]);
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
    const [testedWordIds, setTestedWordIds] = useState<Set<string>>(new Set());
    const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

    const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('Hard');
    const [examType, setExamType] = useState<ExamType>('dynamic');

    const selectWords = useCallback(async () => {
        setState('loading');
        setTestedWordIds(new Set()); // Reset tested words for new session
        let words: Word[] = [];
        const today = new Date().toDateString();

        // 1. Initial Filtering
        if (difficultyFilter === 'All') {
            words = await getAllWords();
        } else if (difficultyFilter === "Today's") {
            const allWords = await getAllWords();
            words = allWords.filter(w => new Date(w.createdAt).toDateString() === today);
        } else if (['New', 'Easy', 'Medium', 'Hard'].includes(difficultyFilter)) {
            words = await getWordsByDifficulty([difficultyFilter as WordDifficulty]);
        } else { // Default to Hard and Medium if no filter is selected
            words = await getWordsByDifficulty(['Hard', 'Medium']);
        }
        
        // 2. Prioritization
        const getNextWord = (wordList: Word[]): Word | null => {
            if (wordList.length === 0) return null;

            // Highest Priority: Spelling errors
            const spellingPriorityWords = wordList.filter(w => (w.wrong_count?.spelling || 0) >= 3);
            if (spellingPriorityWords.length > 0) {
                return spellingPriorityWords.sort((a, b) => (b.wrong_count?.spelling || 0) - (a.wrong_count?.spelling || 0))[0];
            }

            // Second Priority: Difficulty Level (Hard > Medium > New > Easy)
            for (const level of ['Hard', 'Medium', 'New', 'Easy']) {
                const levelWords = wordList.filter(w => w.difficulty === level);
                if (levelWords.length > 0) {
                    // Third Priority: Least recently reviewed
                    // This part is simplified as we don't have `last_reviewed` yet.
                    // We can just pick one from this level.
                    return levelWords[0];
                }
            }
            return wordList[0];
        };
        
        const initialWord = getNextWord(words.filter(w => !testedWordIds.has(w.id)));

        setWordQueue(words);
        setCurrentWord(initialWord);

        if (initialWord) {
            setState('testing');
        } else {
            setState('finished');
        }
    }, [difficultyFilter]);

    useEffect(() => {
        selectWords();
    }, [difficultyFilter, selectWords]);


    const determineTestType = (word: Word): ExamType => {
        if (examType !== 'dynamic') {
             // Fallback logic for user's choice
             if (examType === 'verb-form' && word.partOfSpeech !== 'verb') {
                 setFallbackMessage("This word is not a verb. Switching to MCQ test.");
                 return 'mcq-en-bn';
             }
             return examType;
        }

        // Dynamic Revision Logic
        if ((word.wrong_count?.spelling || 0) > 1) return 'spelling';
        if (word.partOfSpeech === 'verb' && word.verb_forms) return 'verb-form';
        if (Math.random() > 0.5) return 'mcq-en-bn';
        return 'mcq-bn-en'; // Default dynamic choice
    }

    const handleAnswer = async ({ isCorrect, userAnswer, quizType }: { isCorrect: boolean; userAnswer: string; quizType: ExamType }) => {
        if (!currentWord) return;

        const newStats = { ...currentWord };
        let feedbackCorrectAnswer = currentWord.meaning;

        if (isCorrect) {
            newStats.correct_count = (newStats.correct_count || 0) + 1;
            const currentDifficultyIndex = difficultyLevels.indexOf(newStats.difficulty);
            if (currentDifficultyIndex > 0) {
                newStats.difficulty = difficultyLevels[currentDifficultyIndex - 1];
            }
        } else {
             const currentDifficultyIndex = difficultyLevels.indexOf(newStats.difficulty);
            if (currentDifficultyIndex < difficultyLevels.length - 1) {
                newStats.difficulty = difficultyLevels[currentDifficultyIndex + 1];
            }
            
            // Initialize wrong_count if it doesn't exist
            if (!newStats.wrong_count) {
                newStats.wrong_count = { spelling: 0, meaning: 0 };
            }

            if (quizType === 'spelling' || quizType === 'mcq-bn-en') {
                newStats.wrong_count.spelling = (newStats.wrong_count.spelling || 0) + 1;
                feedbackCorrectAnswer = currentWord.word;
            } else {
                 newStats.wrong_count.meaning = (newStats.wrong_count.meaning || 0) + 1;
                 feedbackCorrectAnswer = currentWord.meaning;
            }
        }
        newStats.total_exams = (newStats.total_exams || 0) + 1;

        await updateWord(newStats as Word);

        setFeedback({ isCorrect, correctAnswer: feedbackCorrectAnswer, userAnswer, quizType });
        setState('feedback');
    };


    const handleNextWord = () => {
        if (!currentWord) return;

        const newTestedWordIds = new Set(testedWordIds);
        newTestedWordIds.add(currentWord.id);
        setTestedWordIds(newTestedWordIds);

        const remainingWords = wordQueue.filter(word => !newTestedWordIds.has(word.id));
        
        if (remainingWords.length > 0) {
            // Smart selection logic can be re-applied here if needed,
            // or just take the next from the sorted queue.
            // For simplicity, we'll just process the queue.
            setCurrentWord(remainingWords[0]);
            setState('testing');
            setFeedback(null);
            setFallbackMessage(null);
        } else {
            setState('finished');
            setCurrentWord(null);
        }
    };
    
    const restartSession = () => {
        setTestedWordIds(new Set());
        selectWords();
    };


    const renderTest = () => {
        if (!currentWord) return <p>Loading word...</p>;

        const testToRender = determineTestType(currentWord);

        switch (testToRender) {
            case 'mcq-en-bn':
                return <McqEnBnQuiz 
                    words={[currentWord]} 
                    onAnswer={(isCorrect, userAnswer) => handleAnswer({ isCorrect, userAnswer, quizType: 'mcq-en-bn' })} 
                />;
            case 'mcq-bn-en':
                return <McqBnEnQuiz 
                    words={[currentWord]} 
                    onAnswer={(isCorrect, userAnswer) => handleAnswer({ isCorrect, userAnswer, quizType: 'mcq-bn-en' })} 
                />;
            case 'spelling':
                 return <SpellingQuiz 
                    word={currentWord} 
                    onAnswer={(isCorrect, userAnswer) => handleAnswer({ isCorrect, userAnswer, quizType: 'spelling' })}
                />;
            case 'fill-blanks':
            case 'verb-form':
            default:
                return (
                    <div className="text-center p-8">
                        <h3 className="font-semibold text-lg">Coming Soon!</h3>
                        <p className="text-muted-foreground">The '{testToRender}' exam type is under construction.</p>
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
        { value: 'dynamic', label: 'Dynamic Revision', disabled: false },
        { value: 'mcq-en-bn', label: 'MCQ (Eng to Ban)', disabled: false },
        { value: 'mcq-bn-en', label: 'MCQ (Ban to Eng)', disabled: false },
        { value: 'spelling', label: 'Spelling Test', disabled: false },
        { value: 'fill-blanks', label: 'Fill-in-the-Blanks', disabled: false },
        { value: 'verb-form', label: 'Verb Form Test', disabled: false },
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
             {fallbackMessage && (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                       {fallbackMessage}
                    </AlertDescription>
                </Alert>
            )}

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
                    {state === 'finished' && <FinishedState onRestart={restartSession} />}
                </CardContent>
            </Card>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-4 animate-pulse">
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
    const isSpellingTest = feedback.quizType === 'spelling' || feedback.quizType === 'mcq-bn-en';

    const getFeedbackTitle = () => {
        if (isSpellingTest) return 'spelling for';
        return 'meaning for';
    }

    const getFeedbackWord = () => {
        if (isSpellingTest) return word.meaning;
        return word.word;
    }


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
                 <p>The correct {getFeedbackTitle()} <span className="font-bold text-primary">{getFeedbackWord()}</span> is:</p>
                <p className="text-2xl font-semibold">{feedback.correctAnswer}</p>
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

    