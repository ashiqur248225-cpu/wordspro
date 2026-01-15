'use client';
import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAllWords } from '@/lib/db';
import type { Word, WordDifficulty } from '@/lib/types';
import { PageTemplate } from '@/components/page-template';
import { FlashCard } from './flashcard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function FlashcardClientInternal() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const difficultyFilter = searchParams.get('difficulty');
  const posFilter = searchParams.get('pos');
  const searchTerm = searchParams.get('q');

  useEffect(() => {
    async function fetchAndFilterWords() {
      setLoading(true);
      try {
        let allWords = await getAllWords();

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            allWords = allWords.filter(word => {
                if (word.word.toLowerCase().includes(lowercasedFilter)) return true;
                if (word.meaning.toLowerCase().includes(lowercasedFilter)) return true;
                return false;
            });
        }

        if (difficultyFilter && difficultyFilter !== 'All') {
            const today = new Date().toDateString();
            allWords = allWords.filter(word => {
                if (difficultyFilter === "Today's") return new Date(word.createdAt).toDateString() === today;
                if (difficultyFilter === "Learned") return word.difficulty === 'Learned';
                return word.difficulty === difficultyFilter;
            });
        }

        if (posFilter && posFilter !== 'All') {
            allWords = allWords.filter(word => word.partOfSpeech === posFilter);
        }
        
        setWords(shuffleArray(allWords));
        setCurrentIndex(0);
      } catch (error) {
        console.error("Failed to fetch words for flashcards:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAndFilterWords();
  }, [difficultyFilter, posFilter, searchTerm]);

  const handleNext = () => {
    setCurrentIndex(prev => (prev < words.length - 1 ? prev + 1 : prev));
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
  };
  
  const handleShuffle = () => {
    setWords(shuffleArray(words));
    setCurrentIndex(0);
  }

  const currentWord = words[currentIndex];
  
  const title = useMemo(() => {
    let base = "Flash Cards";
    const filters = [
        difficultyFilter && difficultyFilter !== 'All' ? difficultyFilter : null,
        posFilter && posFilter !== 'All' ? posFilter : null,
        searchTerm ? `"${searchTerm}"` : null
    ].filter(Boolean);
    if(filters.length > 0) {
        base += ` (${filters.join(', ')})`;
    }
    return base;
  }, [difficultyFilter, posFilter, searchTerm]);


  if (loading) {
    return (
      <PageTemplate title="Loading Flash Cards..." description="Getting your cards ready.">
        <div className="flex items-center justify-center h-[500px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </PageTemplate>
    );
  }
  
  if (words.length === 0) {
     return (
       <PageTemplate title="No Words Found" description="There are no words matching your filter criteria.">
          <div className="flex flex-col items-center justify-center text-center h-[400px] border-2 border-dashed rounded-lg">
              <p className="text-lg font-semibold">No cards to show.</p>
              <p className="text-muted-foreground">Try adjusting your filters on the Words page or add more words.</p>
              <Button asChild variant="link" className="mt-4">
                  <a href="/words">Back to Words List</a>
              </Button>
          </div>
       </PageTemplate>
    )
  }

  return (
    <PageTemplate title={title} description={`Card ${currentIndex + 1} of ${words.length}`}>
      <div className="flex flex-col items-center gap-6">
        <FlashCard word={currentWord} />
        
        <div className="flex items-center justify-center gap-4 w-full max-w-lg">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
           <Button variant="outline" size="icon" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleNext} disabled={currentIndex === words.length - 1} className="w-full sm:w-auto">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageTemplate>
  );
}


export function FlashcardClient() {
    return (
        <Suspense fallback={
             <PageTemplate title="Loading Flash Cards..." description="Getting your cards ready.">
                <div className="flex items-center justify-center h-[500px]">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
            </PageTemplate>
        }>
            <FlashcardClientInternal />
        </Suspense>
    )
}
