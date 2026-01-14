'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Word, Synonym, Antonym } from '@/lib/types';
import { getAllWords } from '@/lib/db';
import { Button } from '@/components/ui/button';

interface SynonymAntonymQuizProps {
  word: Word;
  onAnswer: (isCorrect: boolean, userAnswer: string, correctAnswer: string, quizSubtype: 'synonym' | 'antonym') => void;
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

const getWordString = (item: string | Synonym | Antonym): string => {
    return typeof item === 'string' ? item : item.word;
}

export function SynonymAntonymQuiz({ word, onAnswer }: SynonymAntonymQuizProps) {
    const [allWords, setAllWords] = useState<Word[]>([]);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const { quizType, correctAnswer, availableChoices } = useMemo(() => {
        const hasSynonyms = word.synonyms && word.synonyms.length > 0;
        const hasAntonyms = word.antonyms && word.antonyms.length > 0;
        
        let type: 'synonym' | 'antonym' = 'synonym';
        if (hasSynonyms && hasAntonyms) {
            type = Math.random() > 0.5 ? 'synonym' : 'antonym';
        } else if (hasAntonyms) {
            type = 'antonym';
        }

        const choices = type === 'synonym' ? word.synonyms! : word.antonyms!;
        const correct = getWordString(choices[Math.floor(Math.random() * choices.length)]);

        return { quizType: type, correctAnswer: correct, availableChoices: choices.map(getWordString) };
    }, [word]);


    const generateOptions = useCallback(() => {
        if (allWords.length < 4) return;

        // Get words that are NOT the correct answer, the main word, or another synonym/antonym of the main word
        const incorrectOptions = allWords
            .map(w => w.word)
            .filter(w => 
                w.toLowerCase() !== correctAnswer.toLowerCase() &&
                w.toLowerCase() !== word.word.toLowerCase() &&
                !availableChoices.some(choice => choice.toLowerCase() === w.toLowerCase())
            );
        
        const shuffledIncorrect = shuffle(incorrectOptions).slice(0, 3);
        const newOptions = shuffle([correctAnswer, ...shuffledIncorrect]);
        setOptions(newOptions);

    }, [allWords, correctAnswer, word.word, availableChoices]);

     useEffect(() => {
        async function fetchAllWords() {
            const words = await getAllWords();
            setAllWords(words);
        }
        fetchAllWords();
    }, []);

    useEffect(() => {
        if(allWords.length > 0) {
            generateOptions();
        }
    }, [allWords, generateOptions]);

    const handleOptionClick = (option: string) => {
        if (selectedAnswer) return; // Prevent changing answer
        setSelectedAnswer(option);

        const isCorrect = option.toLowerCase() === correctAnswer.toLowerCase();
        onAnswer(isCorrect, option, correctAnswer, quizType);
    };
    
    if (options.length === 0) {
        return <p>Loading quiz...</p>;
    }

    const getButtonClass = (option: string) => {
        if (!selectedAnswer) return '';
        if (option.toLowerCase() === correctAnswer.toLowerCase()) return 'bg-green-500 hover:bg-green-600';
        if (option === selectedAnswer) return 'bg-red-500 hover:bg-red-600';
        return '';
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <p className="text-lg text-muted-foreground">
                    Which is a <span className="font-bold text-primary">{quizType}</span> for:
                </p>
                <h2 className="text-4xl font-bold my-2">{word.word}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, index) => (
                    <Button
                        key={index}
                        variant="outline"
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
    