"use client";

import { useState } from "react";
import Link from "next/link";

export default function Search() {
    const [query, setQuery] = useState("");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Log Meal</h1>
            </header>

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., a slice of pizza and a salad"
                    className="w-full p-4 pr-12 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex gap-3">
                    <span className="text-xl">💡</span>
                    <div>
                        <p className="text-sm font-semibold text-blue-900">Try natural language</p>
                        <p className="text-xs text-blue-700">"I had two eggs and a piece of toast for breakfast"</p>
                    </div>
                </div>
            </div>

            {/* Mock Results Container (Placeholder) */}
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                    🥗
                </div>
                <p className="text-sm font-medium">Search for food to see breakdown</p>
            </div>
        </div>
    );
}
