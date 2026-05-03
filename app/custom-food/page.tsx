"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { addCustomFood, getMyCustomFoods, logCustomFood, toggleFavorite } from "./actions";

export default function CustomFoodPage() {
    const [foods, setFoods] = useState<Array<{ id: string, name: string, calories: number, isFavorite: boolean }>>([]);
    const [loading, setLoading] = useState(true);
    
    const [name, setName] = useState("");
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");
    const [carbs, setCarbs] = useState("");
    const [fat, setFat] = useState("");
    const [serving, setServing] = useState("");

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getMyCustomFoods();
        setFoods(data);
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !calories) return;
        setIsSaving(true);
        try {
            await addCustomFood({
                name,
                calories: parseInt(calories),
                protein: protein ? parseFloat(protein) : undefined,
                carbs: carbs ? parseFloat(carbs) : undefined,
                fat: fat ? parseFloat(fat) : undefined,
                servingSizeG: serving ? parseFloat(serving) : undefined,
            });
            setName("");
            setCalories(""); setProtein(""); setCarbs(""); setFat(""); setServing("");
            await loadData();
        } catch {
            alert("Error adding food");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLog = async (id: string) => {
        if (!confirm("Add this item to your Lunch log?")) return;
        try {
            await logCustomFood(id, "Lunch");
            alert("Logged to Lunch successfully!");
        } catch {
            alert("Error logging food");
        }
    };

    const handleToggleFavorite = async (id: string, currentStatus: boolean) => {
        try {
            await toggleFavorite(id, !currentStatus);
            setFoods(foods.map(f => f.id === id ? { ...f, isFavorite: !currentStatus } : f));
        } catch {
            alert("Error updating favorite status");
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white px-4 pt-12 pb-6 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors p-2 -ml-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div className="flex flex-col items-end">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Custom Foods</h1>
                </div>
            </header>

            <div className="p-4 max-w-lg mx-auto w-full space-y-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-lg mb-4 text-gray-900">Add New Food</h2>
                    <form onSubmit={handleAdd} className="flex flex-col gap-3">
                        <input type="text" placeholder="Food Name *" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                        <input type="number" placeholder="Calories (kcal) *" value={calories} onChange={e => setCalories(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                        
                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" placeholder="Protein (g)" value={protein} onChange={e => setProtein(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            <input type="number" placeholder="Carbs (g)" value={carbs} onChange={e => setCarbs(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            <input type="number" placeholder="Fat (g)" value={fat} onChange={e => setFat(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                        <input type="number" placeholder="Serving Size (g) Optional" value={serving} onChange={e => setServing(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        
                        <button disabled={isSaving} type="submit" className="mt-2 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                            {isSaving ? "Saving..." : "Save Custom Food"}
                        </button>
                    </form>
                </div>

                <div className="space-y-4">
                    <h2 className="font-bold text-lg text-gray-900 ml-1">Your Library</h2>
                    {loading ? <p className="text-gray-500 ml-1">Loading...</p> : foods.length === 0 ? <p className="text-gray-500 text-sm ml-1">No custom foods yet.</p> : (
                        foods.map(food => (
                             <div key={food.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div>
                                    <p className="font-bold text-gray-900 flex items-center gap-2">
                                        {food.name}
                                        <button onClick={() => handleToggleFavorite(food.id, food.isFavorite)} className={`text-xl transition-colors ${food.isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-300 hover:text-red-400'}`}>
                                            ♥
                                        </button>
                                    </p>
                                    <p className="text-xs text-gray-500">{food.calories} kcal</p>
                                </div>
                                <button onClick={() => handleLog(food.id)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-200 transition-colors">
                                    Log
                                </button>
                             </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
