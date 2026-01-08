'use client';
import { Suspense } from 'react';
import { LearningClient } from './learning-client';
import { PageTemplate } from '@/components/page-template';

function ExamPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <LearningClient />
    </div>
  );
}


export default function LearnPage() {
    return (
        <Suspense fallback={
             <PageTemplate title="Loading Exam..." description="Please wait.">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </PageTemplate>
        }>
            <ExamPage />
        </Suspense>
    )
}
