"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { logExercise, getTodaysExercises, deleteExercise, updateExercise } from "./actions";

type ExerciseLog = {
    id: string;
    activityName: string;
    durationMin: number;
    caloriesBurned: number;
    date: string;
};

function EditExerciseRow({ log, onSave, onCancel }: {
    log: ExerciseLog;
    onSave: (id: string, patch: { activityName: string; durationMin: number; caloriesBurned: number }) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(log.activityName);
    const [duration, setDuration] = useState(log.durationMin);
    const [calories, setCalories] = useState(log.caloriesBurned);

    return (
        <div className="space-y-3 p-4 bg-orange-50 rounded-2xl border border-orange-200">
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Activity</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Minutes</label>
                    <input
                        type="number"
                        value={duration}
                        onChange={e => setDuration(Number(e.target.value))}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Calories Burned</label>
                    <input
                        type="number"
                        value={calories}
                        onChange={e => setCalories(Number(e.target.value))}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => onSave(log.id, { activityName: name, durationMin: duration, caloriesBurned: calories })}
                    className="flex-1 py-2 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors"
                >
                    Save
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default function ExercisePage() {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ activityName: string; durationMin: number; caloriesBurned: number } | null>(null);
    const [error, setError] = useState("");
    const [logs, setLogs] = useState<ExerciseLog[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchLogs = async () => {
        const data = await getTodaysExercises();
        setLogs(data as ExerciseLog[]);
    };

    useEffect(() => { fetchLogs(); }, []);

    const handleLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setResult(null);

        const res = await logExercise(input);
        if (res.success) {
            setResult({
                activityName: res.activityName as string,
                durationMin: res.durationMin as number,
                caloriesBurned: res.caloriesBurned as number
            });
            setInput("");
            fetchLogs();
        } else {
            setError(res.error || "Failed to log exercise.");
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        await deleteExercise(id);
        setLogs(prev => prev.filter(l => l.id !== id));
    };

    const handleSaveEdit = async (id: string, patch: { activityName: string; durationMin: number; caloriesBurned: number }) => {
        await updateExercise(id, patch);
        setLogs(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
        setEditingId(null);
    };

    const totalBurned = logs.reduce((s, l) => s + l.caloriesBurned, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white/50 backdrop-blur-md rounded-full hover:bg-white/80 transition-all border border-white shadow-sm hover:-translate-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m15 18-6-6 6-6"/></svg>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Exercise</h1>
                    <p className="text-sm text-gray-500 font-medium">AI-powered calorie burn tracking</p>
                </div>
            </header>

            {/* Log Form */}
            <form onSubmit={handleLog} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-lg shadow-orange-900/5">
                <p className="text-sm font-semibold text-gray-500 mb-4">Describe what you did — AI parses it using your body weight for accurate burn estimates.</p>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="e.g. 'Did a CrossFit class for 45 mins' or 'walked the dog for an hour'"
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium text-gray-700 min-h-[100px] resize-none"
                    required
                />
                {error && <p className="text-red-500 text-sm font-bold mt-2">{error}</p>}
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-full mt-4 bg-orange-500 text-white font-bold py-4 rounded-2xl hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            AI is calculating...
                        </>
                    ) : "Log Activity"}
                </button>
            </form>

            {/* Latest result flash */}
            {result && (
                <div className="bg-orange-50 border border-orange-200 p-5 rounded-3xl animate-in slide-in-from-bottom-2 flex justify-between items-center">
                    <div>
                        <p className="text-orange-800 font-bold text-lg">{result.activityName}</p>
                        <p className="text-orange-600/80 text-sm font-semibold">{result.durationMin} minutes</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-orange-600">-{result.caloriesBurned}</p>
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">Kcal Burned</p>
                    </div>
                </div>
            )}

            {/* Today's Exercise Log */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Today&apos;s Activity</h2>
                    {totalBurned > 0 && (
                        <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                            -{totalBurned} kcal total
                        </span>
                    )}
                </div>

                {logs.length === 0 ? (
                    <div className="p-10 text-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-inner">
                        <div className="text-4xl mb-3 opacity-50">🏃</div>
                        <p className="text-gray-500 text-sm font-semibold">No activity logged today.</p>
                        <p className="text-gray-400 text-xs mt-1">Log your first workout above!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map(log => (
                            <div key={log.id}>
                                {editingId === log.id ? (
                                    <EditExerciseRow
                                        log={log}
                                        onSave={handleSaveEdit}
                                        onCancel={() => setEditingId(null)}
                                    />
                                ) : (
                                    <div className="flex justify-between items-center p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-lg">🏃</div>
                                            <div>
                                                <p className="font-bold text-gray-900">{log.activityName}</p>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {log.durationMin} min · {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-1">
                                                <p className="font-black text-orange-600">-{log.caloriesBurned}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">kcal</p>
                                            </div>
                                            <button
                                                onClick={() => setEditingId(log.id)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
