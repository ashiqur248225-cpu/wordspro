
'use client';
import { Suspense, use } from 'react';
import { notFound } from 'next/navigation';

function QuizPage({ params: paramsProp }: { params: { quizType: string } | Promise<{ quizType: string }> }) {
    const params = use(paramsProp);
    if (params.quizType === 'mcq-en-bn') {
        // For now, redirect or show a coming soon message for other types
        return <div>MCQ English to Bengali Quiz will be here.</div>;
    } else {
        notFound();
    }
}

export default function Page({ params }: { params: { quizType: string } }) {
    return (
        <Suspense fallback={<div>Loading quiz...</div>}>
            <QuizPage params={params} />
        </Suspense>
    );
}
