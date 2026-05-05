"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightChart({ data }: { data: { date: string, weight: number }[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-lg shadow-blue-900/5 text-center">
                <p className="text-gray-500 font-semibold mb-2">No weight data available yet.</p>
                <p className="text-sm text-gray-400">Log your weight above to start seeing trends!</p>
            </div>
        );
    }

    const minWeight = Math.min(...data.map(d => d.weight)) - 2;
    const maxWeight = Math.max(...data.map(d => d.weight)) + 2;

    return (
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-lg shadow-blue-900/5">
            <h3 className="font-bold text-gray-900 mb-6">Weight Trend</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            dy={10}
                        />
                        <YAxis 
                            domain={[minWeight, maxWeight]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            dx={-10}
                            tickFormatter={(value) => `${value.toFixed(1)}kg`}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
