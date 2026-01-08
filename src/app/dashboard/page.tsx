import { StatsCards } from './stats-cards';
import { ProgressChart } from './progress-chart';
import { WordReviewCard } from './word-review-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <WordReviewCard difficulty="Hard" />
        <WordReviewCard difficulty="Medium" />
        <WordReviewCard difficulty="Easy" />
        <WordReviewCard difficulty="New" />
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
              You've mastered 5 words this week. Keep going!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity feed */}
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
