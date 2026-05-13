"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { saveMealLog } from "@/app/search/actions";
import { ParsedFoodItem } from "@/lib/nutrition/types";
import type { BrowserMultiFormatReader as BrowserMultiFormatReaderType } from "@zxing/library";

type OFFProduct = {
    product_name: string;
    nutriments: {
        "energy-kcal_100g"?: number;
        proteins_100g?: number;
        carbohydrates_100g?: number;
        fat_100g?: number;
    };
    serving_size?: string;
};

function toTodayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function toNowTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function BarcodePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReaderType | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scannedCode, setScannedCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<OFFProduct | null>(null);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [mealType, setMealType] = useState("Lunch");
    const [servingG, setServingG] = useState(100);
    const [overrideDate, setOverrideDate] = useState(toTodayStr());
    const [overrideTime, setOverrideTime] = useState(toNowTime());

    useEffect(() => {
        setOverrideTime(toNowTime());
        return () => { readerRef.current?.reset(); };
    }, []);

    const startScanner = async () => {
        setError("");
        setProduct(null);
        setScannedCode("");
        setSaved(false);
        setServingG(100);
        setScanning(true);

        const { BrowserMultiFormatReader } = await import("@zxing/library");
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        try {
            await reader.decodeFromVideoDevice(null, videoRef.current!, async (result) => {
                if (result) {
                    const code = result.getText();
                    reader.reset();
                    setScanning(false);
                    setScannedCode(code);
                    await lookupBarcode(code);
                }
            });
        } catch {
            setError("Camera access denied. Please allow camera permissions and try again.");
            setScanning(false);
        }
    };

    const stopScanner = () => {
        readerRef.current?.reset();
        setScanning(false);
    };

    const lookupBarcode = async (code: string) => {
        setLoading(true);
        try {
            // Try Open Food Facts first
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
            const data = await res.json();
            if (data.status === 1 && data.product) {
                setProduct(data.product);
                // Auto-set serving size from product if available
                const servingSizeStr = data.product.serving_size as string | undefined;
                if (servingSizeStr) {
                    const match = servingSizeStr.match(/(\d+(?:\.\d+)?)\s*g/i);
                    if (match) setServingG(parseFloat(match[1]));
                }
            } else {
                setError("Product not found in Open Food Facts database. Try scanning again or search by name.");
            }
        } catch {
            setError("Network error looking up product.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!product) return;
        const n = product.nutriments;
        const ratio = servingG / 100;
        const item: ParsedFoodItem = {
            name: product.product_name || "Scanned Product",
            serving_size_g: servingG,
            nutrition: {
                calories: Math.round((n["energy-kcal_100g"] || 0) * ratio),
                protein_g: Math.round((n.proteins_100g || 0) * ratio * 10) / 10,
                carbohydrates_total_g: Math.round((n.carbohydrates_100g || 0) * ratio * 10) / 10,
                fat_total_g: Math.round((n.fat_100g || 0) * ratio * 10) / 10,
            }
        };
        try {
            const finalDate = overrideDate || undefined;
            const finalTime = overrideTime || undefined;
            await saveMealLog([item], mealType, finalDate, finalTime);
            setSaved(true);
        } catch {
            setError("Failed to save to your log. Please try again.");
        }
    };

    // Computed scaled values for display
    const ratio = servingG / 100;
    const scaledNutrition = product ? {
        calories: Math.round((product.nutriments["energy-kcal_100g"] || 0) * ratio),
        protein: Math.round((product.nutriments.proteins_100g || 0) * ratio * 10) / 10,
        carbs: Math.round((product.nutriments.carbohydrates_100g || 0) * ratio * 10) / 10,
        fat: Math.round((product.nutriments.fat_100g || 0) * ratio * 10) / 10,
    } : null;

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-4 pt-12 pb-6 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <Link href="/" className="text-gray-400 hover:text-gray-900 p-2 -ml-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">🔍 Barcode Scanner</h1>
            </header>

            <div className="p-4 max-w-lg mx-auto space-y-5">
                {/* Scanner viewfinder */}
                <div className="bg-black rounded-3xl overflow-hidden relative aspect-video">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    {scanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-56 h-32 border-2 border-white rounded-xl relative">
                                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-lg -translate-x-0.5 -translate-y-0.5" />
                                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-lg translate-x-0.5 -translate-y-0.5" />
                                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-lg -translate-x-0.5 translate-y-0.5" />
                                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-lg translate-x-0.5 translate-y-0.5" />
                                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400/70 animate-pulse" />
                            </div>
                            <p className="text-white text-sm font-bold mt-4 bg-black/40 px-4 py-2 rounded-full">Point at a barcode</p>
                        </div>
                    )}
                    {!scanning && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <p className="text-gray-400 font-medium text-sm">Camera inactive</p>
                        </div>
                    )}
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                            <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            <p className="text-gray-400 text-sm mt-3">Looking up {scannedCode}...</p>
                        </div>
                    )}
                </div>

                {!scanning ? (
                    <button
                        onClick={startScanner}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all"
                    >
                        Start Scanner
                    </button>
                ) : (
                    <button
                        onClick={stopScanner}
                        className="w-full py-4 bg-gray-200 text-gray-700 font-bold rounded-2xl"
                    >
                        Cancel
                    </button>
                )}

                {error && <p className="text-red-600 text-sm font-semibold text-center bg-red-50 p-3 rounded-xl">{error}</p>}

                {product && scaledNutrition && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h2 className="font-black text-xl text-gray-900">{product.product_name}</h2>
                        <p className="text-xs text-gray-400 font-medium">Barcode: {scannedCode} · Open Food Facts database</p>

                        {/* Serving size scaler */}
                        <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-blue-800">Serving Size</label>
                                <span className="text-xs text-blue-500 font-medium">Base values per 100g</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={10}
                                    max={500}
                                    step={5}
                                    value={servingG}
                                    onChange={e => setServingG(parseFloat(e.target.value))}
                                    className="flex-1 accent-blue-600"
                                />
                                <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-xl px-3 py-2">
                                    <input
                                        type="number"
                                        value={servingG}
                                        onChange={e => setServingG(Math.max(1, parseFloat(e.target.value) || 1))}
                                        className="w-14 text-right font-black text-gray-900 focus:outline-none"
                                    />
                                    <span className="text-xs text-gray-400 font-bold">g</span>
                                </div>
                            </div>
                        </div>

                        {/* Scaled nutrition */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Calories", val: `${scaledNutrition.calories} kcal`, color: "bg-orange-50 text-orange-800" },
                                { label: "Protein", val: `${scaledNutrition.protein}g`, color: "bg-blue-50 text-blue-800" },
                                { label: "Carbs", val: `${scaledNutrition.carbs}g`, color: "bg-yellow-50 text-yellow-800" },
                                { label: "Fat", val: `${scaledNutrition.fat}g`, color: "bg-red-50 text-red-800" },
                            ].map(({ label, val, color }) => (
                                <div key={label} className={`${color} rounded-2xl p-4`}>
                                    <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
                                    <p className="text-xl font-black">{val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Meal type + date/time */}
                        <div className="space-y-3">
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
                            disabled={saved}
                            className={`w-full py-4 font-bold rounded-2xl transition-all ${saved ? "bg-green-500 text-white" : "bg-gray-900 text-white hover:bg-black"}`}
                        >
                            {saved ? `✓ Logged ${scaledNutrition.calories} kcal!` : `Add ${scaledNutrition.calories} kcal to Daily Log`}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
