'use client';
import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { McqEnBnQuiz } from '@/app/quiz/mcq-en-bn';
import { PageTemplate } from '@/components/page-template';
import type { Word } from '@/lib/types';

function QuizPage({ params: paramsProp, words: wordsProp }: { params: { quizType: string } | Promise<{ quizType: string }>, words: Word[] | Promise<Word[]> }) {
    const params = use(paramsProp);
    const words = use(wordsProp);

    if (params.quizType === 'mcq-en-bn') {
        return <McqEnBnQuiz words={words} />;
    } else {
        // For now, other quiz types are not implemented
        return (
            <PageTemplate
                title={`${params.quizType} Quiz`}
                description="This quiz type is coming soon!"
            >
                <div className="text-center text-muted-foreground">
                    <p>Stay tuned! We are working on bringing this quiz to you.</p>
                </div>
            </PageTemplate>
        )
    }
}

export default function Page({ params }: { params: { quizType: string } }) {
    const searchParams = useSearchParams();
    // This is a placeholder for the actual word fetching logic that will be in LearningClient
    const words: Word[] = [];

    return (
        <Suspense fallback={
            <PageTemplate title="Loading Quiz..." description="Please wait while we prepare your questions.">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </PageTemplate>
        }>
            <QuizPage params={params} words={words} />
        </Suspense>
    );
}
