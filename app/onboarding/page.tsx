"use client";

import { useActionState, useState, useEffect } from "react";
import { submitOnboarding } from "./actions";

export default function Onboarding() {
  const [state, formAction, isPending] = useActionState(submitOnboarding, undefined);

  const [age, setAge] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [activityLevel, setActivityLevel] = useState<string>("1.2");
  const [calorieBound, setCalorieBound] = useState<number>(2000);
  const [timezone, setTimezone] = useState<string>("UTC");

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (age && heightCm && weightKg) {
      let bmr = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age);
      bmr += gender === "M" ? 5 : -161;
      const tdee = Math.round(bmr * Number(activityLevel));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCalorieBound(Math.max(500, tdee));
    }
  }, [age, heightCm, weightKg, gender, activityLevel]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-gray-50 py-10">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-md mb-6">
            👋
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Aboard!</h1>
          <p className="text-gray-500 font-medium text-sm leading-relaxed">
            Let&apos;s calculate your personalized nutrition targets.
          </p>
        </div>

        <form action={formAction} className="space-y-5 pt-4">
          <input type="hidden" name="timezone" value={timezone} />
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Display Name</label>
            <input
              type="text"
              name="name"
              placeholder="How should we refer to you?"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Age</label>
              <input type="number" name="age" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")} required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Gender</label>
              <select name="gender" value={gender} onChange={(e) => setGender(e.target.value as "M"|"F")} required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Weight (kg)</label>
              <input type="number" step="0.1" name="weightKg" value={weightKg} onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : "")} required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Height (cm)</label>
              <input type="number" step="0.1" name="heightCm" value={heightCm} onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : "")} required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Activity Level</label>
            <select name="activityLevel" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="1.2">Sedentary (Little or no exercise)</option>
              <option value="1.375">Lightly Active (1-3 days/week)</option>
              <option value="1.55">Moderately Active (3-5 days/week)</option>
              <option value="1.725">Very Active (6-7 days/week)</option>
              <option value="1.9">Extra Active (Very physical job)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Daily Calorie Target (kcal)</label>
            <p className="text-xs text-gray-500 mb-2">Auto-calculated using Mifflin-St Jeor (you can edit this)</p>
            <input
              type="number"
              name="calorieBound"
              value={calorieBound}
              onChange={(e) => setCalorieBound(Number(e.target.value))}
              required
              min={500}
              max={10000}
              className="w-full p-4 bg-blue-50 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Dietary Methodology</label>
            <select name="dietaryPreference" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Omnivore">Omnivore</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Keto">Keto</option>
            </select>
          </div>

          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100 text-center animate-in fade-in">
              {state.error}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" disabled={isPending} className="w-full py-4 text-white bg-gray-900 rounded-2xl font-bold transition-all shadow-md hover:bg-black disabled:opacity-70 flex justify-center items-center">
              {isPending ? "Saving..." : "Complete Onboarding"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
