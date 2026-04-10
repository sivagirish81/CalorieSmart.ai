"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateSuggestions } from "./actions";

export default function SuggestionsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        generateSuggestions().then(res => {
            setData(res);
            setLoading(false);
        }).catch(e => {
            alert("Error loading suggestions");
            setLoading(false);
        });
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white px-4 pt-12 pb-6 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors p-2 -ml-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div className="flex flex-col items-end">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Smart Suggestions</h1>
                </div>
            </header>

            <div className="p-4 max-w-lg mx-auto w-full space-y-6">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                ) : data && (
                    <>
                        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm">
                            <p className="text-sm font-bold text-green-800 uppercase tracking-wide mb-2">Remaining Calories</p>
                            <p className="text-4xl font-black text-green-900 mb-4">{data.remaining} <span className="text-lg text-green-700">kcal</span></p>
                            <p className="text-green-800 leading-relaxed font-medium">{data.suggestionText}</p>
                        </div>

                        {data.customFoods && data.customFoods.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="font-bold text-lg text-gray-900 ml-1">Fits your macros right now</h2>
                                <div className="space-y-3">
                                    {data.customFoods.map((food: any) => (
                                        <div key={food.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                            <div>
                                                <p className="font-bold text-gray-900">{food.name}</p>
                                                <p className="text-xs text-gray-500">{food.calories} kcal</p>
                                            </div>
                                            <Link href="/custom-food" className="px-4 py-2 bg-blue-100 text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-200 transition-colors">
                                                Go log
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
