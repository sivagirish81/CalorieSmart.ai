"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { analyzePhoto } from "./actions";
import { saveMealLog } from "@/app/search/actions";
import { ParsedFoodItem } from "@/lib/nutrition/types";

type FoodItem = {
    name: string; calories: number; protein_g: number;
    carbohydrates_total_g: number; fat_total_g: number; serving_size_g: number;
};

function toTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function toNowTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function PhotoLogPage() {
    const [preview, setPreview] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState("image/jpeg");
    const [baseItems, setBaseItems] = useState<FoodItem[] | null>(null);
    const [items, setItems] = useState<FoodItem[] | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mealType, setMealType] = useState("Lunch");
    const [overrideDate, setOverrideDate] = useState(toTodayStr());
    const [overrideTime, setOverrideTime] = useState(toNowTime());
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    // Keep overrideTime current on mount
    useEffect(() => {
        setOverrideTime(toNowTime());
    }, []);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMimeType("image/jpeg");
        setItems(null);
        setBaseItems(null);
        setSaved(false);

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            const MAX = 1024;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
                if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
                else { width = Math.round((width * MAX) / height); height = MAX; }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.85);
            setPreview(compressed);
            URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
    };

    const handleAnalyze = async () => {
        if (!preview) return;
        setAnalyzing(true);
        setError("");
        try {
            const base64 = preview.split(",")[1];
            const result = await analyzePhoto(base64, mimeType);
            setBaseItems(result.map(i => ({ ...i })));
            setItems(result.map(i => ({ ...i })));
        } catch (e) {
            console.error(e);
            setError("Could not analyze the image. Try a clearer photo.");
        } finally {
            setAnalyzing(false);
        }
    };

    const updateServing = (idx: number, newServing: number) => {
        if (!baseItems || newServing <= 0) return;
        const base = baseItems[idx];
        const ratio = newServing / base.serving_size_g;
        setItems(prev => {
            if (!prev) return prev;
            const updated = [...prev];
            updated[idx] = {
                ...updated[idx],
                serving_size_g: newServing,
                calories: Math.round(base.calories * ratio),
                protein_g: Math.round(base.protein_g * ratio * 10) / 10,
                carbohydrates_total_g: Math.round(base.carbohydrates_total_g * ratio * 10) / 10,
                fat_total_g: Math.round(base.fat_total_g * ratio * 10) / 10,
            };
            return updated;
        });
    };

    const updateField = (idx: number, field: keyof Omit<FoodItem, 'name'>, value: number) => {
        setItems(prev => {
            if (!prev) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            return updated;
        });
    };

    const handleSave = async () => {
        if (!items) return;
        setSaving(true);
        try {
            const parsedItems: ParsedFoodItem[] = items.map(item => ({
                name: item.name,
                serving_size_g: item.serving_size_g,
                nutrition: {
                    calories: item.calories,
                    protein_g: item.protein_g,
                    carbohydrates_total_g: item.carbohydrates_total_g,
                    fat_total_g: item.fat_total_g,
                }
            }));
            const finalDate = overrideDate || undefined;
            const finalTime = overrideTime || undefined;
            await saveMealLog(parsedItems, mealType, finalDate, finalTime);
            setSaved(true);
        } catch (e) {
            console.error(e);
            setError("Failed to save meal.");
        } finally {
            setSaving(false);
        }
    };

    const totalCal = items?.reduce((s, i) => s + i.calories, 0) || 0;

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-4 pt-12 pb-6 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors p-2 -ml-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">📸 Photo Log</h1>
            </header>

            <div className="p-4 max-w-lg mx-auto space-y-5">
                {/* Upload area */}
                <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-blue-200 rounded-3xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-white"
                >
                    {preview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={preview} alt="Food" className="mx-auto rounded-2xl max-h-64 object-cover" />
                    ) : (
                        <>
                            <div className="text-5xl mb-3">🍽️</div>
                            <p className="font-bold text-gray-700">Tap to upload a photo of your meal</p>
                            <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP supported</p>
                        </>
                    )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

                {preview && !items && (
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl disabled:opacity-60 flex justify-center items-center gap-2"
                    >
                        {analyzing ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Analyzing with AI...
                            </>
                        ) : "Analyze Photo"}
                    </button>
                )}

                {error && <p className="text-red-600 text-sm font-semibold text-center bg-red-50 p-3 rounded-xl">{error}</p>}

                {items && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <h2 className="font-bold text-gray-900">Detected Foods</h2>
                            <span className="text-2xl font-black text-gray-900">{totalCal} <span className="text-sm text-gray-400">kcal</span></span>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs py-2 px-3 rounded-lg flex items-center gap-2 font-medium">
                            <span>⚠️</span> Adjust serving size or macros before saving
                        </div>

                        {items.map((item, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-2xl space-y-2">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-gray-900 capitalize">{item.name}</p>
                                    <div className="flex items-baseline gap-1">
                                        <input
                                            type="number"
                                            value={item.calories}
                                            onChange={e => updateField(i, 'calories', parseFloat(e.target.value) || 0)}
                                            className="w-16 text-right font-black text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                                        />
                                        <span className="text-xs text-gray-400">kcal</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Serving g</label>
                                        <input
                                            type="number"
                                            value={item.serving_size_g}
                                            onChange={e => updateServing(i, parseFloat(e.target.value) || 1)}
                                            className="w-full text-sm font-semibold text-gray-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-blue-400 uppercase">Protein</label>
                                        <input
                                            type="number"
                                            value={item.protein_g}
                                            onChange={e => updateField(i, 'protein_g', parseFloat(e.target.value) || 0)}
                                            className="w-full text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-amber-400 uppercase">Carbs</label>
                                        <input
                                            type="number"
                                            value={item.carbohydrates_total_g}
                                            onChange={e => updateField(i, 'carbohydrates_total_g', parseFloat(e.target.value) || 0)}
                                            className="w-full text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-rose-400 uppercase">Fat</label>
                                        <input
                                            type="number"
                                            value={item.fat_total_g}
                                            onChange={e => updateField(i, 'fat_total_g', parseFloat(e.target.value) || 0)}
                                            className="w-full text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Meal Type</label>
                                <select
                                    value={mealType}
                                    onChange={e => setMealType(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                >
                                    <option>Breakfast</option>
                                    <option>Lunch</option>
                                    <option>Dinner</option>
                                    <option>Snack</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Date</label>
                                    <input
                                        type="date"
                                        value={overrideDate}
                                        onChange={e => setOverrideDate(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Time</label>
                                    <input
                                        type="time"
                                        value={overrideTime}
                                        onChange={e => setOverrideTime(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving || saved}
                            className={`w-full py-4 font-bold rounded-2xl transition-all ${saved ? "bg-green-500 text-white" : "bg-gray-900 text-white hover:bg-black"} disabled:opacity-60`}
                        >
                            {saving ? "Saving..." : saved ? "✓ Logged!" : "Add to Daily Log"}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
