"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserProfile, updateProfile } from "./actions";

export default function Profile() {
    const [name, setName] = useState("");
    const [calorieBound, setCalorieBound] = useState(2000);
    const [dietaryPreference, setDietaryPreference] = useState("Omnivore");
    const [proteinGoalG, setProteinGoalG] = useState(150);
    const [carbsGoalG, setCarbsGoalG] = useState(200);
    const [fatGoalG, setFatGoalG] = useState(65);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [startWeight, setStartWeight] = useState<number | null>(null);
    const [currentWeight, setCurrentWeight] = useState<number | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await getUserProfile();
            setName(profile.name || "");
            setCalorieBound(profile.calorieBound);
            setDietaryPreference(profile.dietaryPreference);
            if (profile.proteinGoalG) setProteinGoalG(profile.proteinGoalG);
            if (profile.carbsGoalG) setCarbsGoalG(profile.carbsGoalG);
            if (profile.fatGoalG) setFatGoalG(profile.fatGoalG);
            
            if (profile.weightLogs && profile.weightLogs.length > 0) {
                setStartWeight(profile.weightLogs[0].weightKg);
                setCurrentWeight(profile.weightLogs[profile.weightLogs.length - 1].weightKg);
            } else if (profile.weightKg) {
                setStartWeight(profile.weightKg);
                setCurrentWeight(profile.weightKg);
            }
            
            setIsLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await updateProfile({ 
            name, 
            calorieBound, 
            dietaryPreference,
            proteinGoalG,
            carbsGoalG,
            fatGoalG
        });
        setIsSaving(false);
        if (res.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
                <svg className="animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <p className="text-sm font-semibold text-gray-500">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Dietary Profile</h1>
            </header>

            {currentWeight && startWeight && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-semibold text-gray-500">Weight Trend</p>
                        <p className="text-2xl font-bold text-gray-900">{currentWeight} kg</p>
                    </div>
                    <div className="text-right">
                        {currentWeight !== startWeight && (
                            <span className="text-lg font-bold text-gray-400 line-through mr-2">{startWeight} kg</span>
                        )}
                        <span className={`text-3xl font-black ${currentWeight < startWeight ? 'text-green-500' : currentWeight > startWeight ? 'text-red-500' : 'text-gray-500'}`}>
                            {currentWeight < startWeight ? '↓' : currentWeight > startWeight ? '↑' : '→'}
                        </span>
                    </div>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 pb-10">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Display Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-inner"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Daily Calorie Goal (kcal)</label>
                    <input
                        type="number"
                        value={calorieBound}
                        onChange={(e) => setCalorieBound(Number(e.target.value))}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-inner"
                        min="500"
                        max="10000"
                        required
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Protein (g)</label>
                        <input
                            type="number"
                            value={proteinGoalG}
                            onChange={(e) => setProteinGoalG(Number(e.target.value))}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-inner"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Carbs (g)</label>
                        <input
                            type="number"
                            value={carbsGoalG}
                            onChange={(e) => setCarbsGoalG(Number(e.target.value))}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-inner"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Fat (g)</label>
                        <input
                            type="number"
                            value={fatGoalG}
                            onChange={(e) => setFatGoalG(Number(e.target.value))}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-inner"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Dietary Preference</label>
                    <div className="grid grid-cols-2 gap-3">
                        {["Omnivore", "Vegetarian", "Vegan", "Keto"].map((diet) => (
                            <button
                                key={diet}
                                type="button"
                                onClick={() => setDietaryPreference(diet)}
                                className={`p-4 rounded-xl font-bold border transition-all active:scale-95 ${
                                    dietaryPreference === diet 
                                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {diet}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        type="submit"
                        disabled={isSaving || saveSuccess}
                        className={`w-full py-4 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] ${
                            saveSuccess ? 'bg-green-500 shadow-green-200' : 'bg-gray-900 hover:bg-gray-800'
                        } disabled:opacity-75`}
                    >
                        {isSaving ? "Saving..." : saveSuccess ? "✓ Profile Updated!" : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
}
