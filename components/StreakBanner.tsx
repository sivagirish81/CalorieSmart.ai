"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export default function StreakBanner({ achieved }: { achieved: boolean }) {
    const [showBanner, setShowBanner] = useState(false);

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
        if (achieved) {
            const todayStr = new Date().toISOString().split("T")[0];
            const lastFired = localStorage.getItem("lastConfettiFired");
            
            if (lastFired !== todayStr) {
                // First time today achieving this
                triggerConfetti();
                localStorage.setItem("lastConfettiFired", todayStr);
            }
        }
    }, [achieved]);

    if (!achieved) return null;

    return (
        <div className="bg-amber-100 border border-amber-200 text-amber-900 px-5 py-4 rounded-3xl flex justify-between items-center shadow-sm">
            <div>
                <p className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                    <span>🔥</span> Streak Active!
                </p>
                <p className="text-xs font-medium mt-1 opacity-80">You are doing a fantastic job meeting your calorie goals for 3+ consecutive days.</p>
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
