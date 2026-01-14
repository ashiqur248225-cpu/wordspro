import { Suspense } from 'react';
import { WordsClientPage } from './words-client-page';

export default function WordsPage() {
  return (
    <Suspense fallback={<div>Loading words...</div>}>
      <WordsClientPage />
    </Suspense>
  );
}
