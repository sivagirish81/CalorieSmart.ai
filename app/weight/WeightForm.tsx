"use client";

import { useState } from "react";
import { logWeight } from "./actions";

export default function WeightForm({ initialWeight }: { initialWeight: number }) {
    const [weight, setWeight] = useState(initialWeight || 70);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const [date, setDate] = useState(`${yyyy}-${mm}-${dd}`);
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMsg("");
        
        await logWeight(Number(weight), date);
        
        setIsLoading(false);
        setSuccessMsg("Weight logged successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    return (
        <form onSubmit={handleSave} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-lg shadow-blue-900/5 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Log Your Weight</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Weight (kg)</label>
                    <input 
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={e => setWeight(Number(e.target.value))}
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                    <input 
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-gray-700"
                        required
                    />
                </div>
            </div>
            
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
                {isLoading ? "Saving..." : "Save Weight"}
            </button>
            {successMsg && <p className="mt-4 text-green-600 font-bold text-center text-sm">{successMsg}</p>}
        </form>
    );
}
