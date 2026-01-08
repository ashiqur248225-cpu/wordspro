'use client';
import { Suspense } from 'react';
import { PerformanceClient } from './performance-client';
import { PageTemplate } from '@/components/page-template';

function PerformancePageInternal() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <PerformanceClient />
    </div>
  );
}


export default function PerformancePage() {
    return (
        <Suspense fallback={
             <PageTemplate title="Loading Performance..." description="Please wait.">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </PageTemplate>
        }>
            <PerformancePageInternal />
        </Suspense>
    )
}
