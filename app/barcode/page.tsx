"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { saveMealLog } from "@/app/search/actions";
import { ParsedFoodItem } from "@/lib/nutrition/types";
import type { BrowserMultiFormatReader } from "@zxing/library";

type OFFProduct = {
    product_name: string;
    nutriments: {
        "energy-kcal_100g"?: number;
        proteins_100g?: number;
        carbohydrates_100g?: number;
        fat_100g?: number;
    };
};

export default function BarcodePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scannedCode, setScannedCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<OFFProduct | null>(null);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [mealType, setMealType] = useState("Lunch");

    const startScanner = async () => {
        setError("");
        setProduct(null);
        setScannedCode("");
        setSaved(false);
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
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
            const data = await res.json();
            if (data.status === 1 && data.product) {
                setProduct(data.product);
            } else {
                setError("Product not found in database. Try another item.");
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
        const item: ParsedFoodItem = {
            name: product.product_name || "Scanned Product",
            serving_size_g: 100,
            nutrition: {
                calories: n["energy-kcal_100g"] || 0,
                protein_g: n.proteins_100g || 0,
                carbohydrates_total_g: n.carbohydrates_100g || 0,
                fat_total_g: n.fat_100g || 0,
            }
        };
        try {
            await saveMealLog([item], mealType);
            setSaved(true);
        } catch {
            setError("Failed to save to your log. Please try again.");
        }
    };

    useEffect(() => {
        return () => { readerRef.current?.reset(); };
    }, []);

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
                            {/* Targeting reticle */}
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

                {product && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h2 className="font-black text-xl text-gray-900">{product.product_name}</h2>
                        <p className="text-xs text-gray-400 font-medium">Nutrition per 100g · Barcode: {scannedCode}</p>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Calories", val: `${product.nutriments["energy-kcal_100g"] || 0} kcal`, color: "bg-orange-50 text-orange-800" },
                                { label: "Protein", val: `${product.nutriments.proteins_100g || 0}g`, color: "bg-blue-50 text-blue-800" },
                                { label: "Carbs", val: `${product.nutriments.carbohydrates_100g || 0}g`, color: "bg-yellow-50 text-yellow-800" },
                                { label: "Fat", val: `${product.nutriments.fat_100g || 0}g`, color: "bg-red-50 text-red-800" },
                            ].map(({ label, val, color }) => (
                                <div key={label} className={`${color} rounded-2xl p-4`}>
                                    <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
                                    <p className="text-xl font-black">{val}</p>
                                </div>
                            ))}
                        </div>

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
                            disabled={saved}
                            className={`w-full py-4 font-bold rounded-2xl transition-all ${saved ? "bg-green-500 text-white" : "bg-gray-900 text-white hover:bg-black"}`}
                        >
                            {saved ? "✓ Logged!" : "Add to Daily Log"}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
