'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { getWordsByDifficulty, getAllWords, updateWord } from '@/lib/db';
import type { Word, WordDifficulty } from '@/lib/types';
import { McqEnBnQuiz } from '../quiz/mcq-en-bn';
import { McqBnEnQuiz } from '../quiz/mcq-bn-en';
import { SpellingQuiz } from '../quiz/spelling-quiz';
import { FillBlanksQuiz } from '../quiz/fill-in-the-blanks-quiz';
import { VerbFormQuiz } from '../quiz/verb-form-quiz';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Check, X } from 'lucide-react';
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
            
            const getNextWord = (wordList: Word[]): Word | null => {
                if (wordList.length === 0) return null;
    
                const spellingPriorityWords = wordList.filter(w => (w.wrong_count?.spelling || 0) >= 3);
                if (spellingPriorityWords.length > 0) {
                    return spellingPriorityWords.sort((a, b) => (b.wrong_count?.spelling || 0) - (a.wrong_count?.spelling || 0))[0];
                }
    
                for (const level of ['Hard', 'Medium', 'New', 'Easy']) {
                    const levelWords = wordList.filter(w => w.difficulty === level);
                    if (levelWords.length > 0) {
                        return levelWords[Math.floor(Math.random() * levelWords.length)];
                    }
                }
                return wordList[0];
            };
            
            const initialWord = getNextWord(words);
    
            setWordQueue(words);
            setCurrentWord(initialWord);
    
            if (initialWord) {
                setState('testing');
            } else {
                setState('finished');
            }
        }

        fetchAndSetWords();
    }, [difficultyFilter]);


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

        const remainingWords = wordQueue.filter(word => !newTestedWordIds.has(word.id));
        
        if (remainingWords.length > 0) {
            const getNextWord = (wordList: Word[]): Word | null => {
                if (wordList.length === 0) return null;
    
                const spellingPriorityWords = wordList.filter(w => (w.wrong_count?.spelling || 0) >= 3);
                if (spellingPriorityWords.length > 0) {
                    return spellingPriorityWords.sort((a, b) => (b.wrong_count?.spelling || 0) - (a.wrong_count?.spelling || 0))[0];
                }
    
                for (const level of ['Hard', 'Medium', 'New', 'Easy']) {
                    const levelWords = wordList.filter(w => w.difficulty === level);
                     if (levelWords.length > 0) {
                        return levelWords[Math.floor(Math.random() * levelWords.length)];
                    }
                }
                return wordList[0];
            };
            
            setCurrentWord(getNextWord(remainingWords));
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
        const currentFilter = difficultyFilter;
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
    
    const renderVerbFormFeedback = () => {
        if (typeof feedback.correctAnswer !== 'object' || typeof feedback.userAnswer !== 'object') return null;
        
        const v2Correct = feedback.correctAnswer.v2.toLowerCase() === feedback.userAnswer.v2.toLowerCase();
        const v3Correct = feedback.correctAnswer.v3.toLowerCase() === feedback.userAnswer.v3.toLowerCase();

        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <Badge variant="secondary">Present (V1)</Badge>
                            <p className="font-bold text-lg">{word.verb_forms?.v1_present?.word}</p>
                            <div className="w-6"></div>
                        </div>
                        <div className="flex justify-between items-center">
                            <Badge>Past (V2)</Badge>
                            <div className="text-center">
                                {!v2Correct && <p className="line-through text-red-500">{feedback.userAnswer.v2}</p>}
                                <p className={`font-bold text-lg ${v2Correct ? 'text-green-500' : ''}`}>{feedback.correctAnswer.v2}</p>
                            </div>
                            {v2Correct ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                        </div>
                         <div className="flex justify-between items-center">
                            <Badge>Past Participle (V3)</Badge>
                             <div className="text-center">
                                {!v3Correct && <p className="line-through text-red-500">{feedback.userAnswer.v3}</p>}
                                <p className={`font-bold text-lg ${v3Correct ? 'text-green-500' : ''}`}>{feedback.correctAnswer.v3}</p>
                            </div>
                            {v3Correct ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderDefaultFeedback = () => {
        if (typeof feedback.correctAnswer !== 'string' || typeof feedback.userAnswer !== 'string') return null;
        
        const isMeaningTest = feedback.quizType === 'mcq-en-bn';
        const questionWord = isMeaningTest ? word.word : word.meaning;
        const feedbackTitle = isMeaningTest ? 'Meaning' : 'Word';

        return (
             <div className="space-y-4">
                <p className="text-lg">For <span className="font-bold text-primary">{questionWord}</span></p>
                
                {!feedback.isCorrect && (
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                             <p className="text-sm text-muted-foreground">Your Answer</p>
                             <p className="font-semibold text-lg line-through">{feedback.userAnswer}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-500" />
                    </CardContent>
                </Card>
                )}

                <Card className="border-green-500 border-2">
                     <CardContent className="p-4 flex items-center justify-between">
                        <div>
                             <p className="text-sm text-muted-foreground">Correct {feedbackTitle}</p>
                             <p className="font-semibold text-lg">{feedback.correctAnswer}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="text-center space-y-6 p-4">
            <h2 className="text-2xl font-bold">{feedback.isCorrect ? 'Correct!' : 'Review this!'}</h2>
            
            {feedback.quizType === 'verb-form' ? renderVerbFormFeedback() : renderDefaultFeedback()}

            {word.exampleSentences && word.exampleSentences[0] && (
                 <p className="text-muted-foreground italic pt-4">e.g., "{word.exampleSentences[0]}"</p>
            )}

            <Button onClick={onNext} className="w-full md:w-1/2 mt-4">
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
