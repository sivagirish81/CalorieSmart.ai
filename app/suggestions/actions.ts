"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function generateSuggestions() {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysMeals = await prisma.mealLog.findMany({
        where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } },
        include: { items: true }
    });

    let consumed = 0;
    todaysMeals.forEach((log: any) => {
        log.items.forEach((item: any) => {
            consumed += item.calories;
        });
    });

    const limit = user.calorieBound;
    const remaining = Math.max(0, limit - consumed);

    if (remaining <= 0) {
       return { remaining, suggestionText: "You have reached your limit for today. Make sure to hydrate!", customFoods: [] };
    }

    if (remaining < 150) {
       return { remaining, suggestionText: "You are very near your limit! Consider a small snack like an apple, cucumber slices, or a handful of almonds (approx 50-80 kcal).", customFoods: [] };
    }

    const prompts = {
       "Omnivore": `You have ${remaining} calories remaining. Consider a balanced meal like grilled chicken breast with vegetables, or a tuna sandwich to hit your macros while staying under ${remaining} kcal.`,
       "Vegetarian": `You have ${remaining} calories remaining. Consider a meal like lentil soup with a side salad, or tofu stir-fry to get good protein while staying under ${remaining} kcal.`,
       "Vegan": `You have ${remaining} calories remaining. A black bean bowl with quinoa and avocado would be great, just portion it to fit within ${remaining} kcal.`,
       "Keto": `You have ${remaining} calories remaining. Salmon with asparagus, or a cobb salad with eggs and bacon, keeps carbs low while staying under ${remaining} kcal.`
    };

    let suggestionText = (prompts as any)[user.dietaryPreference] || `You have ${remaining} calories remaining!`;

    const customFoods = await prisma.customFood.findMany({
        where: { userId: user.id, calories: { lte: remaining } },
        orderBy: { calories: 'desc' },
        take: 3
    });

    return { remaining, suggestionText, customFoods };
}
