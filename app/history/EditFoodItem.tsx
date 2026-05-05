"use client";

import { useState } from "react";
import { updateFoodItem, deleteFoodItem } from "./actions";

export default function EditFoodItem({ item }: { item: { id: string; name: string; calories: number; servingSizeG?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null; } }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(item.name);
    const [calories, setCalories] = useState<number | string>(item.calories);
    const [protein, setProtein] = useState<number | string>(item.protein || 0);
    const [carbs, setCarbs] = useState<number | string>(item.carbs || 0);
    const [fat, setFat] = useState<number | string>(item.fat || 0);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        await updateFoodItem(item.id, { 
            name, 
            calories: Number(calories),
            protein: Number(protein),
            carbs: Number(carbs),
            fat: Number(fat)
        });
        setIsEditing(false);
        setIsLoading(false);
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this item?")) {
            setIsLoading(true);
            await deleteFoodItem(item.id);
            setIsLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-blue-200 shadow-sm w-full animate-in fade-in">
                <input 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Food name"
                />
                <div className="grid grid-cols-4 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Kcal</label>
                        <input 
                            type="number"
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={calories}
                            onChange={e => setCalories(e.target.value)}
                            placeholder="Calories"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Protein (g)</label>
                        <input 
                            type="number"
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={protein}
                            onChange={e => setProtein(e.target.value)}
                            placeholder="Protein"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Carbs (g)</label>
                        <input 
                            type="number"
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={carbs}
                            onChange={e => setCarbs(e.target.value)}
                            placeholder="Carbs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Fat (g)</label>
                        <input 
                            type="number"
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={fat}
                            onChange={e => setFat(e.target.value)}
                            placeholder="Fat"
                        />
                    </div>
                </div>
                <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-300 text-sm">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 text-sm">
                        {isLoading ? "..." : "Save"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-center w-full group">
            <div className="flex flex-col pr-4">
                <span className="font-bold text-sm text-gray-900 capitalize leading-tight flex items-center gap-2">
                    {item.name}
                    <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        ✎
                    </button>
                </span>
                {item.servingSizeG && <span className="text-xs text-gray-500 mt-1 font-medium">{item.servingSizeG}g serving</span>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-gray-900 text-lg">{item.calories} <span className="text-xs font-normal text-gray-400">kcal</span></span>
                <button onClick={handleDelete} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                    ✖
                </button>
            </div>
        </div>
    );
}
