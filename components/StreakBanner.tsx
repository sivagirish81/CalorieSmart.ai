"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function StreakBanner({ streak }: { streak: number }) {
    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#2563eb', '#10b981', '#f59e0b']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#2563eb', '#10b981', '#f59e0b']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    useEffect(() => {
        if (streak > 0) {
            const todayStr = new Date().toISOString().split("T")[0];
            const lastFired = localStorage.getItem("lastConfettiFired");
            
            if (lastFired !== todayStr) {
                triggerConfetti();
                localStorage.setItem("lastConfettiFired", todayStr);
            }
        }
    }, [streak]);

    if (streak <= 0) return null;

    return (
        <div className="bg-amber-100 border border-amber-200 text-amber-900 px-5 py-4 rounded-3xl flex justify-between items-center shadow-sm">
            <div>
                <p className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                    <span>🔥</span> {streak}-Day Streak!
                </p>
                <p className="text-xs font-medium mt-1 opacity-80">You are doing a fantastic job meeting your calorie goals consecutively.</p>
            </div>
            <button 
                onClick={triggerConfetti} 
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm whitespace-nowrap"
            >
                🎊 Replay 
            </button>
        </div>
    );
}
