'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getAllWords } from '@/lib/db';
import type { Word } from '@/lib/types';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import { AlertCircle, CheckCircle, Target, BookOpen, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PerformanceStats {
    totalExams: number;
    totalCorrect: number;
    totalWrong: number;
    overallAccuracy: number;
    errorDistribution: { name: string; value: number }[];
    mostMistakenWords: Word[];
    performanceOverTime: { date: string; accuracy: number }[];
}

const COLORS = ['hsl(var(--chart-5))', 'hsl(var(--chart-3))'];

const errorChartConfig = {
	'Spelling Errors': {
		label: 'Spelling',
		color: 'hsl(var(--chart-5))',
	},
	'Meaning Errors': {
		label: 'Meaning',
		color: 'hsl(var(--chart-3))',
	},
};

const accuracyChartConfig = {
    accuracy: { label: 'Accuracy', color: 'hsl(var(--chart-1))' },
};


export function PerformanceClient() {
    const [stats, setStats] = useState<PerformanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchPerformanceData() {
            try {
                const words = await getAllWords();
                
                let totalExams = 0;
                let totalCorrect = 0;
                let totalWrong = 0;
                let spellingErrors = 0;
                let meaningErrors = 0;
                
                const dailyPerformance: { [key: string]: { correct: number; total: number } } = {};

                words.forEach(word => {
                    const exams = word.total_exams || 0;
                    totalExams += exams;
                    totalCorrect += word.correct_count || 0;
                    
                    const wrongs = (word.wrong_count?.spelling || 0) + (word.wrong_count?.meaning || 0);
                    totalWrong += wrongs;

                    spellingErrors += word.wrong_count?.spelling || 0;
                    meaningErrors += word.wrong_count?.meaning || 0;

                    // For performance over time, we'd need historical exam data.
                    // Let's simulate with `updatedAt` for now, assuming updates relate to exams.
                     if (exams > 0) {
                        const date = new Date(word.updatedAt).toLocaleDateString();
                        if (!dailyPerformance[date]) {
                            dailyPerformance[date] = { correct: 0, total: 0 };
                        }
                        dailyPerformance[date].correct += word.correct_count || 0;
                        dailyPerformance[date].total += exams;
                    }
                });

                const overallAccuracy = totalExams > 0 ? (totalCorrect / totalExams) * 100 : 0;
                
                const errorDistribution = [
                    { name: 'Spelling Errors', value: spellingErrors },
                    { name: 'Meaning Errors', value: meaningErrors },
                ];

                const mostMistakenWords = words
                    .filter(w => (w.wrong_count?.spelling || 0) + (w.wrong_count?.meaning || 0) > 0)
                    .sort((a, b) => {
                        const wrongsA = (a.wrong_count?.spelling || 0) + (a.wrong_count?.meaning || 0);
                        const wrongsB = (b.wrong_count?.spelling || 0) + (b.wrong_count?.meaning || 0);
                        return wrongsB - wrongsA;
                    })
                    .slice(0, 10);
                
                const performanceOverTime = Object.entries(dailyPerformance)
                    .map(([date, data]) => ({
                        date,
                        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
                    }))
                    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setStats({
                    totalExams,
                    totalCorrect,
                    totalWrong,
                    overallAccuracy,
                    errorDistribution,
                    mostMistakenWords,
                    performanceOverTime,
                });
            } catch (error) {
                console.error("Failed to fetch performance data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchPerformanceData();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4">
                <div className="h-24 w-full bg-muted animate-pulse rounded-lg"></div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="h-64 w-full bg-muted animate-pulse rounded-lg"></div>
                    <div className="h-64 w-full bg-muted animate-pulse rounded-lg"></div>
                </div>
                 <div className="h-80 w-full bg-muted animate-pulse rounded-lg mt-4"></div>
            </div>
        )
    }

    if (!stats || stats.totalExams === 0) {
        return (
            <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Exam Data</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        You haven't taken any exams yet. Start learning to see your performance.
                    </p>
                     <Button asChild>
                        <Link href="/learn">Start Exam</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalExams}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Correct Answers</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCorrect}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wrong Answers</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalWrong}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.overallAccuracy.toFixed(2)}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Error Type Distribution</CardTitle>
                        <CardDescription>Breakdown of your mistakes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={errorChartConfig} className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.errorDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {stats.errorDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip
                                        cursor={{fill: 'hsl(var(--muted))'}}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Performance Over Time</CardTitle>
                        <CardDescription>Your accuracy trend.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={accuracyChartConfig} className="h-[250px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.performanceOverTime}>
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                                    <Bar dataKey="accuracy" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Most Mistaken Words</CardTitle>
                    <CardDescription>Words you might want to review.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Word</TableHead>
                                <TableHead>Part of Speech</TableHead>
                                <TableHead className="text-center">Total Wrongs</TableHead>
                                <TableHead className="text-center">Spelling Errors</TableHead>
                                <TableHead className="text-center">Meaning Errors</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.mostMistakenWords.map(word => {
                                const totalWrongs = (word.wrong_count?.spelling || 0) + (word.wrong_count?.meaning || 0);
                                return (
                                    <TableRow 
                                        key={word.id}
                                        onClick={() => router.push(`/words/${word.id}`)}
                                        className="cursor-pointer"
                                    >
                                        <TableCell className="font-medium">
                                            <Link href={`/words/${word.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                                               {word.word}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{word.partOfSpeech}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-red-500">{totalWrongs}</TableCell>
                                        <TableCell className="text-center">{word.wrong_count?.spelling || 0}</TableCell>
                                        <TableCell className="text-center">{word.wrong_count?.meaning || 0}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="justify-end">
                    <Button asChild variant="link" className="text-primary">
                        <Link href="/performance/mistakes">
                            View all mistaken words <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
