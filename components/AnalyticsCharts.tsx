"use client";

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AnalyticsCharts({ dailyData, macroData }: { 
    dailyData: { date: string, calories: number, limit: number }[],
    macroData: { name: string, protein: number, carbs: number, fat: number }[]
}) {
    return (
        <div className="space-y-8">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-lg shadow-blue-900/5">
                <h3 className="font-bold text-gray-900 mb-6">30-Day Calorie Trend</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyData}>
                            <defs>
                                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                dy={10}
                                minTickGap={20}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                dx={-10}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="calories" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCalories)" />
                            <Area type="monotone" dataKey="limit" stroke="#d1d5db" strokeDasharray="5 5" strokeWidth={2} fill="none" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-lg shadow-blue-900/5">
                <h3 className="font-bold text-gray-900 mb-6">Macro Averages</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={macroData} layout="vertical" barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 'bold' }} width={80} />
                            <Tooltip 
                                cursor={{fill: '#f3f4f6'}}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} />
                            <Bar dataKey="protein" name="Protein (g)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="carbs" name="Carbs (g)" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="fat" name="Fat (g)" stackId="a" fill="#eab308" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
