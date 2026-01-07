
'use client';

import Link from 'next/link';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, SpellCheck, Replace, FileQuestion } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const quizTypes = [
  {
    id: 'mcq-en-bn',
    title: 'MCQ (English to Bengali)',
    description: 'Choose the correct Bengali meaning for the English word.',
    icon: FileQuestion,
  },
  {
    id: 'mcq-bn-en',
    title: 'MCQ (Bengali to English)',
    description: 'Choose the correct English word for the Bengali meaning.',
    icon: FileQuestion,
    comingSoon: true,
  },
  {
    id: 'spelling',
    title: 'Spelling Test',
    description: 'Listen to the word and spell it correctly.',
    icon: SpellCheck,
    comingSoon: true,
  },
  {
    id: 'fill-blanks',
    title: 'Fill-in-the-Blanks',
    description: 'Complete the sentence with the correct word.',
    icon: Replace,
    comingSoon: true,
  },
];

function LearnPageContent() {
  const searchParams = useSearchParams();
  const wordIdsParam = searchParams.get('wordIds');
  const wordIds = wordIdsParam ? JSON.parse(wordIdsParam) : [];
  const quizTypeParam = searchParams.get('quizType');

  // If a specific quiz type is passed via URL, redirect to it directly
  if (quizTypeParam && wordIds.length > 0) {
      const quizUrl = `/quiz/${quizTypeParam}?wordIds=${JSON.stringify(wordIds)}`;
       // This is a client component, so we can use window.location for redirection
       if (typeof window !== 'undefined') {
        window.location.href = quizUrl;
        return <PageTemplate title="Redirecting..." description="Please wait while we start your quiz."></PageTemplate>;
      }
  }


  return (
    <PageTemplate
      title="Learning Sessions"
      description="Engage in quizzes to master your vocabulary."
    >
      {wordIds.length > 0 && (
        <div className="mb-6 p-4 bg-secondary rounded-lg">
            <h3 className="font-semibold text-lg">Custom Quiz Session</h3>
            <p className="text-muted-foreground">You are about to start a quiz with a selected set of <span className="font-bold text-primary">{wordIds.length}</span> words. Choose a quiz type below to begin.</p>
        </div>
      )}
      <h3 className="text-2xl font-bold mb-4">Choose a quiz type:</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quizTypes.map((quiz) => (
          <Card key={quiz.title}>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <quiz.icon className="w-8 h-8 text-primary" />
                <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
              <Button className="w-full" asChild disabled={quiz.comingSoon}>
                <Link href={wordIds.length > 0 ? `/quiz/${quiz.id}?wordIds=${JSON.stringify(wordIds)}` : `/quiz/${quiz.id}`}>
                    Start Quiz
                    {quiz.comingSoon && <span className="ml-2 text-xs">(Soon)</span>}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageTemplate>
  );
}


export default function LearnPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LearnPageContent />
        </Suspense>
    )
}

    