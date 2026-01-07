
'use client';
import { Suspense, use } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { McqEnBnQuiz } from '@/app/quiz/mcq-en-bn';
import { PageTemplate } from '@/components/page-template';

function QuizPage({ params: paramsProp }: { params: { quizType: string } | Promise<{ quizType: string }> }) {
    const params = use(paramsProp);
    const searchParams = useSearchParams();
    const wordIdsParam = searchParams.get('wordIds');
    const wordIds = wordIdsParam ? JSON.parse(wordIdsParam) : [];

    if (params.quizType === 'mcq-en-bn') {
        return <McqEnBnQuiz wordIds={wordIds} />;
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
    return (
        <Suspense fallback={
            <PageTemplate title="Loading Quiz..." description="Please wait while we prepare your questions.">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </PageTemplate>
        }>
            <QuizPage params={params} />
        </Suspense>
    );
}
