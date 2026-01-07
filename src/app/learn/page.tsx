import Link from 'next/link';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, SpellCheck, Replace, FileQuestion } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const quizTypes = [
  {
    title: 'MCQ (English to Bengali)',
    description: 'Choose the correct Bengali meaning for the English word.',
    icon: FileQuestion,
    comingSoon: true,
  },
  {
    title: 'MCQ (Bengali to English)',
    description: 'Choose the correct English word for the Bengali meaning.',
    icon: FileQuestion,
    comingSoon: true,
  },
  {
    title: 'Spelling Test',
    description: 'Listen to the word and spell it correctly.',
    icon: SpellCheck,
    comingSoon: true,
  },
  {
    title: 'Fill-in-the-Blanks',
    description: 'Complete the sentence with the correct word.',
    icon: Replace,
    comingSoon: true,
  },
];

export default function LearnPage() {
    const heroImage = PlaceHolderImages.find(p => p.id === 'quiz-background');
  return (
    <PageTemplate
      title="Learning Sessions"
      description="Engage in quizzes to master your vocabulary."
    >
      <div className="relative w-full h-64 rounded-lg overflow-hidden mb-8">
        {heroImage && 
            <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                className="object-cover" 
                data-ai-hint={heroImage.imageHint}
            />
        }
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-3xl font-bold text-white">Ready for a challenge?</h2>
            <p className="text-lg text-white/90 mt-2 mb-4">Our smart revision system prioritizes words you find difficult.</p>
            <Button size="lg" disabled>
                Start Smart Session <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-white/70 mt-2">Coming Soon!</p>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold mb-4">Or, choose a specific quiz type:</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quizTypes.map((quiz) => (
          <Card key={quiz.title}>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <quiz.icon className="w-8 h-8 text-primary" />
                <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
              <Button className="w-full" disabled>
                Start Quiz
                {quiz.comingSoon && <span className="ml-2 text-xs">(Soon)</span>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageTemplate>
  );
}
