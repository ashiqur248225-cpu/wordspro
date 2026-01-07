'use client';
import { Suspense } from 'react';
import { LearningClient } from './learning-client';
import { PageTemplate } from '@/components/page-template';

function ExamPage() {
  return (
    <PageTemplate
      title="Exam Session"
      description="Test your vocabulary with various quiz types."
    >
      <LearningClient />
    </PageTemplate>
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
