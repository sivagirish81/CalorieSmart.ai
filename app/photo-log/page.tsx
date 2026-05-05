"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { analyzePhoto, savePhotoMealLog } from "./actions";

type FoodItem = {
    name: string; calories: number; protein_g: number;
    carbohydrates_total_g: number; fat_total_g: number; serving_size_g: number;
};

export default function PhotoLogPage() {
    const [preview, setPreview] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState("image/jpeg");
    const [items, setItems] = useState<FoodItem[] | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mealType, setMealType] = useState("Lunch");
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMimeType("image/jpeg"); // always compress to jpeg
        setItems(null);
        setSaved(false);

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            // Resize to max 1024px on longest side
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
            // Quality 0.85 keeps it sharp but well under 1MB
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
            // Strip the data URL prefix to get raw base64
            const base64 = preview.split(",")[1];
            const result = await analyzePhoto(base64, mimeType);
            setItems(result);
        } catch (e) {
            console.error(e);
            setError("Could not analyze the image. Try a clearer photo.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!items) return;
        setSaving(true);
        try {
            await savePhotoMealLog(items, mealType);
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
                            <span>⚠️</span> AI estimates — verify before saving
                        </div>

                        {items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                <div>
                                    <p className="font-bold text-gray-900 capitalize">{item.name}</p>
                                    <p className="text-xs text-gray-400">{item.serving_size_g}g · P:{item.protein_g}g C:{item.carbohydrates_total_g}g F:{item.fat_total_g}g</p>
                                </div>
                                <p className="font-black text-gray-900">{item.calories} kcal</p>
                            </div>
                        ))}

                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-bold text-gray-700">Meal Type</label>
                            <select
                                value={mealType}
                                onChange={e => setMealType(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            >
                                <option>Breakfast</option>
                                <option>Lunch</option>
                                <option>Dinner</option>
                                <option>Snack</option>
                            </select>
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
