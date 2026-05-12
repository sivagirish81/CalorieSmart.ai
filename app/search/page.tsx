"use client";

import { Suspense, useEffect, useState } from "react";
import { analyzeMeal, saveMealLog } from "./actions";
import { ParsedFoodItem } from "@/lib/nutrition/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

interface SearchResult {
    success: boolean;
    data?: ParsedFoodItem[];
    error?: string;
    totalCalories?: number;
    source?: string;
}

export function SearchContent() {
    const searchParams = useSearchParams();
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [saved, setSaved] = useState(false);
    
    // Phase 4 Requirement: Meal Type Selector
    const [mealType, setMealType] = useState("Lunch");
    const [overrideDate, setOverrideDate] = useState("");
    const [overrideTime, setOverrideTime] = useState("");
    const [editedData, setEditedData] = useState<ParsedFoodItem[] | null>(null);
    // Store per-gram base values for proportional serving-size scaling
    const [baseData, setBaseData] = useState<ParsedFoodItem[] | null>(null);

    useEffect(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        setOverrideTime(`${hours}:${mins}`);
    }, []);

    const handleMealTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setMealType(val);
        if (val === "Breakfast") setOverrideTime("08:00");
        else if (val === "Lunch") setOverrideTime("13:00");
        else if (val === "Dinner") setOverrideTime("19:00");
        else if (val === "Snack") {
            const now = new Date();
            setOverrideTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        }
    };

    useEffect(() => {
        const d = searchParams.get("date");
        if (d) {
            const parsed = new Date(d);
            if (!isNaN(parsed.getTime())) {
                const year = parsed.getFullYear();
                const month = String(parsed.getMonth() + 1).padStart(2, '0');
                const day = String(parsed.getDate()).padStart(2, '0');
                setOverrideDate(`${year}-${month}-${day}`);
            }
        } else {
            // Default to today when no date query param
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            setOverrideDate(`${year}-${month}-${day}`);
        }
    }, [searchParams]);

    const updateItemServing = (idx: number, newServing: number) => {
        if (!baseData || newServing <= 0) return;
        const base = baseData[idx];
        const ratio = newServing / base.serving_size_g;
        setEditedData(prev => {
            if (!prev) return prev;
            const updated = [...prev];
            updated[idx] = {
                ...updated[idx],
                serving_size_g: newServing,
                nutrition: {
                    calories: Math.round(base.nutrition.calories * ratio * 10) / 10,
                    protein_g: Math.round(base.nutrition.protein_g * ratio * 10) / 10,
                    carbohydrates_total_g: Math.round(base.nutrition.carbohydrates_total_g * ratio * 10) / 10,
                    fat_total_g: Math.round(base.nutrition.fat_total_g * ratio * 10) / 10,
                }
            };
            return updated;
        });
    };

    const updateItemField = (idx: number, field: keyof ParsedFoodItem['nutrition'], value: number) => {
        setEditedData(prev => {
            if (!prev) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], nutrition: { ...updated[idx].nutrition, [field]: value } };
            return updated;
        });
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);
        setSaved(false);
        setEditedData(null);
        setBaseData(null);

        try {
            const res = await analyzeMeal(query);
            setResult(res);
            if (res.data) {
                const deepCopy = res.data.map(item => ({
                    ...item,
                    nutrition: { ...item.nutrition }
                }));
                setEditedData(deepCopy);
                setBaseData(res.data.map(item => ({
                    ...item,
                    nutrition: { ...item.nutrition }
                })));
            }
        } catch {
            setResult({ success: false, error: "Network error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editedData) return;
        setIsSaving(true);
        try {
            const finalDate = overrideDate ? overrideDate : undefined;
            const finalTime = overrideTime ? overrideTime : undefined;
            const res = await saveMealLog(editedData, mealType, finalDate, finalTime);
            if (res.success) {
                setSaved(true);
                // Celebrate the log with a quick confetti burst
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#2563eb', '#10b981', '#f59e0b'] });
            } else {
                alert(res.error);
            }
        } catch {
            alert("Failed to save meal configuration.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white/70 backdrop-blur-xl px-4 pt-12 pb-6 shadow-sm border-b border-white/50 flex items-center justify-between sticky top-0 z-10">
                <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors p-2 -ml-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div className="flex flex-col items-end">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Food Oracle AI</h1>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">NLP Search</span>
                </div>
            </header>

            <div className="p-4 max-w-lg mx-auto w-full space-y-6">
                <div className="bg-white/60 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-blue-900/5 border border-white mt-2 hover:-translate-y-0.5 transition-transform duration-300">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3">
                        <label className="text-sm font-bold text-gray-700 ml-1">What did you eat?</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., 2 eggs and a slice of toast"
                                className="w-full pl-5 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 shadow-inner placeholder-gray-400"
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* State: Data Rendered */}
                {result?.success && editedData && (
                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-5 shadow-lg shadow-blue-900/5 border border-white animate-in slide-in-from-bottom-2 fade-in duration-300">

                        {/* Source Indicator */}
                        <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <span className="bg-green-100 text-green-700 p-1.5 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                </span>
                                Extraction Yield
                            </h2>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-gray-900 tracking-tighter">
                                    {Math.round(editedData.reduce((s, i) => s + i.nutrition.calories, 0))}
                                </span>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">KCAL TOTAL</span>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs py-2 px-3 rounded-lg mb-4 flex items-center gap-2 font-medium">
                            <span className="text-lg">⚠️</span>
                            Estimated — adjust serving size or macros before logging.
                        </div>

                        <div className="space-y-4">
                            {editedData.map((item, index) => (
                                <div key={index} className="p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white hover:border-blue-200 transition-all shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="font-bold text-gray-900 capitalize tracking-tight">{item.name}</p>
                                        <div className="flex items-baseline gap-1">
                                            <input
                                                type="number"
                                                value={Math.round(item.nutrition.calories)}
                                                onChange={e => updateItemField(index, 'calories', parseFloat(e.target.value) || 0)}
                                                className="w-16 text-right font-black text-lg text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                                            />
                                            <span className="text-xs font-medium text-gray-400">kcal</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Serving g</label>
                                            <input
                                                type="number"
                                                value={item.serving_size_g}
                                                onChange={e => updateItemServing(index, parseFloat(e.target.value) || 1)}
                                                className="w-full text-sm font-semibold text-gray-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Protein</label>
                                            <input
                                                type="number"
                                                value={item.nutrition.protein_g}
                                                onChange={e => updateItemField(index, 'protein_g', parseFloat(e.target.value) || 0)}
                                                className="w-full text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">Carbs</label>
                                            <input
                                                type="number"
                                                value={item.nutrition.carbohydrates_total_g}
                                                onChange={e => updateItemField(index, 'carbohydrates_total_g', parseFloat(e.target.value) || 0)}
                                                className="w-full text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">Fat</label>
                                            <input
                                                type="number"
                                                value={item.nutrition.fat_total_g}
                                                onChange={e => updateItemField(index, 'fat_total_g', parseFloat(e.target.value) || 0)}
                                                className="w-full text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            {/* Phase 4 Requirement: Meal Type Selector */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Meal Type</label>
                                    <select 
                                        value={mealType} 
                                        onChange={handleMealTypeChange}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 appearance-none font-medium cursor-pointer shadow-inner"
                                    >
                                        <option value="Breakfast">Breakfast</option>
                                        <option value="Lunch">Lunch</option>
                                        <option value="Dinner">Dinner</option>
                                        <option value="Snack">Snack</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Date</label>
                                    <input 
                                        type="date"
                                        value={overrideDate}
                                        onChange={e => setOverrideDate(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium cursor-pointer shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Time</label>
                                    <input 
                                        type="time"
                                        value={overrideTime}
                                        onChange={e => setOverrideTime(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium cursor-pointer shadow-inner"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving || saved || !editedData}
                                className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-md flex justify-center items-center gap-2 hover:-translate-y-1 hover:shadow-lg ${saved ? 'bg-gradient-to-r from-emerald-500 to-green-600 scale-[0.98]' : 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 active:scale-[0.98]'} disabled:opacity-80`}
                            >
                                {isSaving ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : saved ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        Added to Daily Log!
                                    </>
                                ) : (
                                    `Add to Daily Log`
                                )}
                            </button>
                            
                            {/* Phase 3 Requirement: Source Tag */}
                            <div className="flex justify-center mt-6">
                                <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                                    DATA: {result.source || "Unknown Generator"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* State: Error Rendering */}
                {result && !result.success && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm font-semibold border border-red-100 animate-in fade-in">
                        {result.error}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8"><p className="text-gray-500 font-bold">Loading NLP System...</p></div>}>
            <SearchContent />
        </Suspense>
    );
}
