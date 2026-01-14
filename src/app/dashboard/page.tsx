'use client';
import { StatsCards } from './stats-cards';
import { ProgressChart } from './progress-chart';
import { WordReviewCard } from './word-review-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentActivity } from './recent-activity';

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-x-auto">
      <StatsCards />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <WordReviewCard difficulty="Hard" />
        <WordReviewCard difficulty="Medium" />
        <WordReviewCard difficulty="Easy" />
        <WordReviewCard difficulty="New" />
        <WordReviewCard difficulty="Learned" />
        <WordReviewCard difficulty="All" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Word Mastery</CardTitle>
            <CardDescription>
              A breakdown of words by your comfort level.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ProgressChart />
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest word updates and additions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
