"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function MacroChart({ protein, carbs, fat }: { protein: number, carbs: number, fat: number }) {
    const data = [
      { name: 'Protein', value: Math.round(protein), color: '#ef4444' }, // Red
      { name: 'Carbs', value: Math.round(carbs), color: '#3b82f6' }, // Blue
      { name: 'Fat', value: Math.round(fat), color: '#eab308' }, // Yellow
    ].filter(i => i.value > 0);

    if (data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-10 my-4">
                 <h2 className="text-sm font-semibold text-gray-600 mb-2">Today&apos;s Macros</h2>
                 <p className="text-gray-400 text-xs">Log some food to see your macro breakdown!</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Today&apos;s Macro Split</h2>
            <div className="w-full flex items-center justify-between">
                <div className="w-1/2 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={68}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col justify-center gap-4 pl-4">
                    {data.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <p className="text-sm font-bold text-gray-900">{entry.name}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-500">{entry.value}g</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
