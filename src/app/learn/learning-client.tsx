'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWordsByDifficulty, getAllWords, updateWord } from '@/lib/db';
import type { Word, WordDifficulty, VerbFormDetail } from '@/lib/types';
import { McqEnBnQuiz } from '../quiz/mcq-en-bn';
import { McqBnEnQuiz } from '../quiz/mcq-bn-en';
import { SpellingQuiz } from '../quiz/spelling-quiz';
import { FillBlanksQuiz } from '../quiz/fill-in-the-blanks-quiz';
import { VerbFormQuiz } from '../quiz/verb-form-quiz';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Check, X, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


type LearningState = 'loading' | 'testing' | 'feedback' | 'finished';
type DifficultyFilter = 'All' | "Today's" | 'Hard' | 'Medium' | 'Easy' | 'New';
type ExamType = 'dynamic' | 'mcq-en-bn' | 'mcq-bn-en' | 'spelling' | 'fill-blanks' | 'verb-form';

interface AnswerFeedback {
    isCorrect: boolean;
    correctAnswer: string | { v2: string, v3: string };
    userAnswer: string | { v2: string, v3: string };
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

    const getNextWord = useCallback((wordList: Word[], currentTestedIds: Set<string>): Word | null => {
        const availableWords = wordList.filter(w => !currentTestedIds.has(w.id));
        if (availableWords.length === 0) return null;

        const spellingPriorityWords = availableWords.filter(w => (w.wrong_count?.spelling || 0) >= 3);
        if (spellingPriorityWords.length > 0) {
            return spellingPriorityWords.sort((a, b) => (b.wrong_count?.spelling || 0) - (a.wrong_count?.spelling || 0))[0];
        }

        for (const level of ['Hard', 'Medium', 'New', 'Easy']) {
            const levelWords = availableWords.filter(w => w.difficulty === level);
            if (levelWords.length > 0) {
                return levelWords[Math.floor(Math.random() * levelWords.length)];
            }
        }
        return availableWords.length > 0 ? availableWords[0] : null;
    }, []);

    useEffect(() => {
        async function fetchAndSetWords() {
            setState('loading');
            let words: Word[] = [];
            const today = new Date().toDateString();
    
            if (difficultyFilter === 'All') {
                words = await getAllWords();
            } else if (difficultyFilter === "Today's") {
                const allWords = await getAllWords();
                words = allWords.filter(w => new Date(w.createdAt).toDateString() === today);
            } else if (['New', 'Easy', 'Medium', 'Hard'].includes(difficultyFilter)) {
                words = await getWordsByDifficulty([difficultyFilter as WordDifficulty]);
            } else {
                words = await getWordsByDifficulty(['Hard', 'Medium']);
            }
            
            setWordQueue(words);
            const initialTestedIds = new Set<string>();
            setTestedWordIds(initialTestedIds);

            const initialWord = getNextWord(words, initialTestedIds);
            setCurrentWord(initialWord);
    
            if (initialWord) {
                setState('testing');
            } else {
                setState('finished');
            }
        }

        fetchAndSetWords();
    }, [difficultyFilter, getNextWord]);


    const determineTestType = (word: Word): ExamType => {
        if (examType !== 'dynamic') {
             if (examType === 'verb-form' && (word.partOfSpeech !== 'verb' || !word.verb_forms?.v1_present?.word || !word.verb_forms?.v2_past?.word || !word.verb_forms?.v3_past_participle?.word)) {
                 setFallbackMessage("This word is not a verb or lacks complete verb forms. Switching to MCQ test.");
                 return 'mcq-en-bn';
             }
             if (examType === 'fill-blanks' && (!word.word || word.word.length < 3)) {
                setFallbackMessage("This word is too short for a fill-in-the-blanks test. Switching to MCQ test.");
                return 'mcq-bn-en';
             }
             return examType;
        }

        if ((word.wrong_count?.spelling || 0) > 1) return 'spelling';
        if (word.partOfSpeech === 'verb' && word.verb_forms?.v1_present?.word && word.verb_forms?.v2_past?.word) return 'verb-form';
        if (Math.random() > 0.66) return 'mcq-bn-en';
        if (Math.random() > 0.33) return 'fill-blanks';
        return 'mcq-en-bn';
    }

    const handleAnswer = async ({ isCorrect, userAnswer, correctAnswer, quizType }: { isCorrect: boolean; userAnswer: AnswerFeedback['userAnswer'], correctAnswer: AnswerFeedback['correctAnswer'], quizType: ExamType }) => {
        if (!currentWord) return;

        const newStats = { ...currentWord };

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
            
            if (!newStats.wrong_count) {
                newStats.wrong_count = { spelling: 0, meaning: 0 };
            }

            if (quizType === 'spelling' || quizType === 'mcq-bn-en' || quizType === 'fill-blanks' || quizType === 'verb-form') {
                newStats.wrong_count.spelling = (newStats.wrong_count.spelling || 0) + 1;
            } else {
                 newStats.wrong_count.meaning = (newStats.wrong_count.meaning || 0) + 1;
            }
        }
        newStats.total_exams = (newStats.total_exams || 0) + 1;

        await updateWord(newStats as Word);
        setFeedback({ isCorrect, correctAnswer, userAnswer, quizType });
        setState('feedback');
    };


    const handleNextWord = () => {
        if (!currentWord) return;

        const newTestedWordIds = new Set(testedWordIds).add(currentWord.id);
        setTestedWordIds(newTestedWordIds);

        const nextWord = getNextWord(wordQueue, newTestedWordIds);
        
        if (nextWord) {
            setCurrentWord(nextWord);
            setState('testing');
            setFeedback(null);
            setFallbackMessage(null);
        } else {
            setState('finished');
            setCurrentWord(null);
        }
    };
    
    const restartSession = () => {
        const currentFilter = difficultyFilter;
        // Trigger a re-fetch by changing the filter and then changing it back.
        if (currentFilter === 'All') {
            setDifficultyFilter('Hard');
             setTimeout(() => setDifficultyFilter('All'), 0);
        } else {
            setDifficultyFilter('All');
            setTimeout(() => setDifficultyFilter(currentFilter), 0);
        }
    };


    const renderTest = () => {
        if (!currentWord) return <p>Loading word...</p>;

        const testToRender = determineTestType(currentWord);

        switch (testToRender) {
            case 'mcq-en-bn':
                return <McqEnBnQuiz 
                    words={[currentWord]} 
                    onAnswer={(isCorrect, userAnswer) => handleAnswer({ isCorrect, userAnswer, correctAnswer: currentWord.meaning, quizType: 'mcq-en-bn' })} 
                />;
            case 'mcq-bn-en':
                return <McqBnEnQuiz 
                    words={[currentWord]} 
                    onAnswer={(isCorrect, userAnswer) => handleAnswer({ isCorrect, userAnswer, correctAnswer: currentWord.word, quizType: 'mcq-bn-en' })} 
                />;
            case 'spelling':
                 return <SpellingQuiz 
                    word={currentWord} 
                    onAnswer={(isCorrect, userAnswer) => handleAnswer({ isCorrect, userAnswer, correctAnswer: currentWord.word, quizType: 'spelling' })}
                />;
            case 'fill-blanks':
                 return <FillBlanksQuiz
                    word={currentWord}
                    onAnswer={(isCorrect, userAnswer) => handleAnswer({ isCorrect, userAnswer, correctAnswer: currentWord.word, quizType: 'fill-blanks' })}
                />;
            case 'verb-form':
                 return <VerbFormQuiz
                    word={currentWord}
                    onAnswer={(isCorrect, userAnswer) => handleAnswer({ 
                        isCorrect, 
                        userAnswer,
                        correctAnswer: {
                            v2: currentWord.verb_forms?.v2_past?.word || '',
                            v3: currentWord.verb_forms?.v3_past_participle?.word || '',
                        },
                        quizType: 'verb-form' 
                    })}
                />;
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
    
    const VerbFormRow = ({ label, verbData, isCorrect }: { label: string, verbData?: VerbFormDetail, isCorrect?: boolean }) => {
        if (!verbData?.word) return null;
        return (
            <div className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div className="flex-1">
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">{verbData.usage_timing}</p>
                </div>
                <p className="flex-1 text-center font-bold text-lg">{verbData.word}</p>
                <p className="flex-1 text-right">{verbData.bangla_meaning}</p>
            </div>
        )
    };

    return (
        <div className="text-center space-y-6 p-4 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-2">
                {feedback.isCorrect ? 
                    <CheckCircle className="h-16 w-16 text-green-500" /> : 
                    <XCircle className="h-16 w-16 text-red-500" />
                }
                <h2 className="text-3xl font-bold">{feedback.isCorrect ? 'Correct!' : 'Review this!'}</h2>
            </div>
            
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">The word was:</p>
                    <p className="text-3xl font-bold text-primary">{word.word}</p>
                    <p className="text-xl text-muted-foreground">"{word.meaning}"</p>
                </CardContent>
            </Card>

            {!feedback.isCorrect && (
                <Card className="border-red-500/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Your Answer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {typeof feedback.userAnswer === 'string' ? (
                            <p className="text-xl font-semibold line-through">{feedback.userAnswer}</p>
                        ) : (
                            <div className="space-y-2 text-left">
                                <p><span className="font-semibold">V2:</span> <span className="line-through">{feedback.userAnswer.v2}</span></p>
                                <p><span className="font-semibold">V3:</span> <span className="line-through">{feedback.userAnswer.v3}</span></p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {word.verb_forms && (
                <Card>
                    <CardHeader><CardTitle>Verb Forms</CardTitle></CardHeader>
                    <CardContent className="px-6 text-left">
                       <VerbFormRow label="Present (V1)" verbData={word.verb_forms.v1_present} />
                       <VerbFormRow label="Past (V2)" verbData={word.verb_forms.v2_past} />
                       <VerbFormRow label="Past Participle (V3)" verbData={word.verb_forms.v3_past_participle} />
                    </CardContent>
                </Card>
            )}

            {word.exampleSentences && word.exampleSentences.length > 0 && (
                 <Card>
                    <CardHeader><CardTitle>Examples</CardTitle></CardHeader>
                    <CardContent className="text-left">
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            {word.exampleSentences.map((ex, i) => <li key={i}>"{ex}"</li>)}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                 <Button onClick={onNext} className="w-full sm:w-auto">
                    Next Word <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href={`/words/${word.id}`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Details
                    </Link>
                </Button>
            </div>
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

    

    