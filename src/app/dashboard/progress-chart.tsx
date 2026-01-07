'use client';
import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { getAllWords } from '@/lib/db';
import type { Word } from '@/lib/types';
import { ChartTooltipContent, ChartContainer } from '@/components/ui/chart';

export function ProgressChart() {
    const [chartData, setChartData] = useState([
        { name: 'New', count: 0, fill: 'hsl(var(--chart-3))' },
        { name: 'Easy', count: 0, fill: 'hsl(var(--chart-2))' },
        { name: 'Medium', count: 0, fill: 'hsl(var(--chart-4))' },
        { name: 'Hard', count: 0, fill: 'hsl(var(--chart-5))' },
    ]);

    useEffect(() => {
        async function fetchData() {
            try {
                const words: Word[] = await getAllWords();
                const counts = words.reduce((acc, word) => {
                    acc[word.difficulty] = (acc[word.difficulty] || 0) + 1;
                    return acc;
                }, {} as Record<Word['difficulty'], number>);

                setChartData([
                    { name: 'New', count: counts.New || 0, fill: 'hsl(var(--chart-3))' },
                    { name: 'Easy', count: counts.Easy || 0, fill: 'hsl(var(--chart-2))' },
                    { name: 'Medium', count: counts.Medium || 0, fill: 'hsl(var(--chart-4))' },
                    { name: 'Hard', count: counts.Hard || 0, fill: 'hsl(var(--chart-5))' },
                ]);
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            }
        }
        fetchData();
    }, []);

    const chartConfig = {
        count: {
            label: "Words",
        },
        New: {
            color: 'hsl(var(--chart-3))'
        },
        Easy: {
            color: 'hsl(var(--chart-2))'
        },
        Medium: {
            color: 'hsl(var(--chart-4))'
        },
        Hard: {
            color: 'hsl(var(--chart-5))'
        },
    };

    return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        cursor={{fill: 'hsl(var(--muted))'}}
                        content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
