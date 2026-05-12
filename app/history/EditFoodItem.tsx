"use client";

import { useState } from "react";
import { updateFoodItem, deleteFoodItem } from "./actions";

export default function EditFoodItem({ item }: { item: { id: string; name: string; calories: number; servingSizeG?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null; } }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(item.name);
    const [calories, setCalories] = useState<number | string>(item.calories);
    const [servingG, setServingG] = useState<number | string>(item.servingSizeG || 100);
    const [protein, setProtein] = useState<number | string>(item.protein || 0);
    const [carbs, setCarbs] = useState<number | string>(item.carbs || 0);
    const [fat, setFat] = useState<number | string>(item.fat || 0);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        await updateFoodItem(item.id, {
            name,
            calories: Number(calories),
            servingSizeG: Number(servingG),
            protein: Number(protein),
            carbs: Number(carbs),
            fat: Number(fat)
        });
        setIsEditing(false);
        setIsLoading(false);
    };

    const handleDelete = async () => {
        if (confirm("Remove this item?")) {
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
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Calories (kcal)</label>
                        <input
                            type="number"
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={calories}
                            onChange={e => setCalories(e.target.value)}
                            placeholder="Calories"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-blue-500 font-bold uppercase ml-1">Serving (g)</label>
                        <input
                            type="number"
                            className="w-full p-2 bg-blue-50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={servingG}
                            onChange={e => setServingG(e.target.value)}
                            placeholder="Serving g"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
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
                        {isLoading ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col pr-3 flex-1 min-w-0">
                <span className="font-bold text-sm text-gray-900 capitalize leading-tight">{item.name}</span>
                <div className="flex flex-wrap gap-x-2 mt-0.5">
                    {item.servingSizeG ? <span className="text-xs text-gray-400">{item.servingSizeG}g</span> : null}
                    {(item.protein || item.carbs || item.fat) ? (
                        <span className="text-[10px] text-gray-400">
                            P {item.protein ?? 0}g · C {item.carbs ?? 0}g · F {item.fat ?? 0}g
                        </span>
                    ) : null}
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <span className="font-bold text-gray-900 mr-1">{item.calories} <span className="text-xs font-normal text-gray-400">kcal</span></span>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-blue-600 active:text-blue-700 transition-colors p-1.5 rounded-lg hover:bg-blue-50 active:bg-blue-100"
                    title="Edit item"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="text-red-400 hover:text-red-600 active:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50 active:bg-red-100 disabled:opacity-40"
                    title="Remove item"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}
