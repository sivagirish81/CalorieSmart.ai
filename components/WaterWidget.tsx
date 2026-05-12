"use client";

import { useState, useRef } from "react";
import { logWater, undoWater } from "@/app/water/actions";

export default function WaterWidget({ currentMl, goalMl }: { currentMl: number, goalMl: number }) {
    const [water, setWater] = useState(currentMl);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const GLASS_ML = 250;
    const currentGlasses = Math.floor(water / GLASS_ML);
    const goalGlasses = Math.ceil(goalMl / GLASS_ML);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handlePointerDown = () => {
        timerRef.current = setTimeout(async () => {
            if (water >= GLASS_ML) {
                setWater(w => w - GLASS_ML);
                setIsUpdating(true);
                await undoWater();
                setIsUpdating(false);
            }
            timerRef.current = null;
        }, 500);
    };

    const handlePointerUp = async () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            
            setWater(w => w + GLASS_ML);
            setIsUpdating(true);
            await logWater(GLASS_ML);
            setIsUpdating(false);
        }
    };

    const handlePointerLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    return (
        <div 
            className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 shadow-sm select-none cursor-pointer hover:bg-blue-50 transition-colors"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
        >
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <span>💧</span> Hydration
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">Tap to log 250ml • Hold to undo</p>
                </div>
                <div className="text-right">
                    <span className="text-xl font-black text-blue-600">{currentGlasses}</span>
                    <span className="text-sm font-bold text-gray-400"> / {goalGlasses}</span>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.max(goalGlasses, currentGlasses) }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-8 h-10 rounded-b-xl rounded-t-sm border-2 transition-all duration-300 ${
                            i < currentGlasses 
                                ? "bg-blue-400 border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)] scale-105" 
                                : "bg-white border-blue-100"
                        } ${isUpdating && i === currentGlasses - 1 ? "animate-pulse" : ""}`}
                    />
                ))}
            </div>
        </div>
    );
}
