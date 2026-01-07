'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Word } from '@/lib/types';
import { getWordsForQuiz, getAllWords } from '@/lib/db';
import { Button } from '@/components/ui/button';

interface McqEnBnQuizProps {
  words: Word[];
  onAnswer?: (isCorrect: boolean, userAnswer: string) => void;
}

function shuffle(array: any[]) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

export function McqEnBnQuiz({ words: initialWords, onAnswer }: McqEnBnQuizProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [words, setWords] = useState<Word[]>(initialWords);
    const [options, setOptions] = useState<string[]>([]);
    const [allWords, setAllWords] = useState<Word[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAllWords() {
            const words = await getAllWords();
            setAllWords(words);
        }
        fetchAllWords();
    }, []);

    const generateOptions = useCallback((correctWord: Word) => {
        if (allWords.length < 4) return;
        let incorrectOptions = allWords
            .filter(w => w.id !== correctWord.id)
            .map(w => w.meaning);
        
        incorrectOptions = shuffle(incorrectOptions).slice(0, 3);
        const newOptions = shuffle([correctWord.meaning, ...incorrectOptions]);
        setOptions(newOptions);
    }, [allWords]);

    useEffect(() => {
        if(words.length > 0 && allWords.length > 0) {
            generateOptions(words[currentWordIndex]);
        }
    }, [currentWordIndex, words, allWords, generateOptions]);


    const currentWord = useMemo(() => words.length > 0 ? words[currentWordIndex] : null, [words, currentWordIndex]);

    const handleOptionClick = (option: string) => {
        if (selectedAnswer) return; // Prevent changing answer
        setSelectedAnswer(option);

        const isCorrect = option === currentWord?.meaning;
        
        if (onAnswer) {
             onAnswer(isCorrect, option);
        } else {
            // Default behavior if no onAnswer provided (standalone mode)
            if (isCorrect) {
                // Handle correct answer display
            } else {
                // Handle incorrect answer display
            }

            setTimeout(() => {
                setSelectedAnswer(null);
                if (currentWordIndex < words.length - 1) {
                    setCurrentWordIndex(currentWordIndex + 1);
                } else {
                    // Quiz finished
                }
            }, 1500);
        }
    };
    
    if (!currentWord) {
        return <p>Loading quiz...</p>;
    }

    const getButtonVariant = (option: string) => {
        if (!selectedAnswer) return 'outline';
        if (option === currentWord.meaning) return 'default'; // Correct answer
        if (option === selectedAnswer) return 'destructive'; // Incorrectly selected by user
        return 'outline';
    };
     const getButtonClass = (option: string) => {
        if (!selectedAnswer) return '';
        if (option === currentWord.meaning) return 'bg-green-500 hover:bg-green-600'; // Correct answer
        if (option === selectedAnswer) return 'bg-red-500 hover:bg-red-600'; // Incorrectly selected by user
        return '';
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <p className="text-lg text-muted-foreground">What is the meaning of:</p>
                <h2 className="text-4xl font-bold my-2">{currentWord.word}</h2>
                <p className="text-md text-muted-foreground">{currentWord.partOfSpeech}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, index) => (
                    <Button
                        key={index}
                        variant={getButtonVariant(option)}
                        className={`h-auto py-4 text-lg justify-center transition-all duration-300 ${getButtonClass(option)}`}
                        onClick={() => handleOptionClick(option)}
                        disabled={!!selectedAnswer}
                    >
                        {option}
                    </Button>
                ))}
            </div>
        </div>
    );
}
