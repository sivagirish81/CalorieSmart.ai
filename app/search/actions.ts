"use server";

import { getNutritionProvider } from "@/lib/nutrition";
import { ParsedFoodItem } from "@/lib/nutrition/types";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface AnalyzeMealResponse {
  success: boolean;
  data?: ParsedFoodItem[];
  error?: string;
  totalCalories?: number;
  source?: string;
}

interface CacheEntry {
  data: AnalyzeMealResponse;
  timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function analyzeMeal(query: string): Promise<AnalyzeMealResponse> {
  try {
    if (!query || query.trim() === "") {
      return { success: false, error: "Please enter a valid meal description." };
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    const cachedEntry = searchCache.get(normalizedQuery);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS)) {
      return cachedEntry.data;
    }

    const provider = getNutritionProvider();
    const items = await provider.parseNaturalLanguage(query);
    const totalCalories = items.reduce((sum, item) => sum + item.nutrition.calories, 0);

    const activeSource = process.env.NUTRITION_SOURCE === "API" ? "Live Remote API"
                       : process.env.NUTRITION_SOURCE === "LOCAL" ? "Local SQLite Database"
                       : process.env.NUTRITION_SOURCE === "HYBRID" ? "Hybrid AI Engine"
                       : "Local Mock Provider";

    const payload = {
      success: true,
      data: items,
      totalCalories,
      source: activeSource
    };

    searchCache.set(normalizedQuery, { data: payload, timestamp: Date.now() });

    return payload;
  } catch (error: unknown) {
    console.error("Error analyzing meal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong. Please try again."
    };
  }
}

export async function saveMealLog(items: ParsedFoodItem[], type: string, overrideDate?: string, overrideTime?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!items || items.length === 0) {
      return { success: false, error: "No items to save." };
    }

    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized. Please log in.");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User record missing in the system.");

    await prisma.mealLog.create({
      data: {
        userId: user.id,
        type: type,
        date: (() => {
            const now = new Date();
            const dateStr = overrideDate ? overrideDate : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
            let timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            if (overrideTime) {
                timeStr = `${overrideTime}:00`;
            }
            return new Date(`${dateStr}T${timeStr}`);
        })(),
        items: {
          create: items.map(item => ({
            name: item.name,
            calories: item.nutrition.calories,
            protein: item.nutrition.protein_g,
            carbs: item.nutrition.carbohydrates_total_g,
            fat: item.nutrition.fat_total_g,
            servingSizeG: item.serving_size_g,
          }))
        }
      }
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const loggedDateStr = overrideDate || todayStr;
    const isPastDate = loggedDateStr < todayStr;

    if (isPastDate) {
      const { recalculateStreakFromHistory } = await import("@/lib/streak");
      await recalculateStreakFromHistory(user.id);
    } else {
      const { updateStreak } = await import("@/lib/streak");
      await updateStreak(user.id);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error saving meal log:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save meal to the database." };
  }
}
