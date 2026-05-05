"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import Groq from "groq-sdk";
import { getDayBounds } from "@/lib/time";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function processSuggestionChat(userInput?: string, currentLocalTime?: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User missing");

    const { startOfDay, endOfDay } = getDayBounds(user.timezone);

    const todaysMeals = await prisma.mealLog.findMany({
        where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } },
        include: { items: true }
    });

    let consumed = 0;
    todaysMeals.forEach(log => log.items.forEach(item => { consumed += item.calories; }));

    const todaysExercise = await prisma.exerciseLog.findMany({
        where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } }
    });
    const burned = todaysExercise.reduce((s, l) => s + l.caloriesBurned, 0);
    const remaining = Math.max(0, user.calorieBound - consumed + burned);

    const customFoods = await prisma.customFood.findMany({
        where: { userId: user.id, calories: { lte: remaining } },
        orderBy: { calories: 'desc' },
        take: 3
    });

    // Build context string for Groq
    const hour = currentLocalTime ? parseInt(currentLocalTime.split(":")[0]) : new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const mealsLogged = todaysMeals.map(log =>
        log.items.map(item => `${item.name} (${item.calories} kcal)`).join(", ")
    ).join("; ") || "nothing logged yet";

    const systemPrompt = `You are a friendly, concise nutrition coach inside a calorie tracking app. 
The user's daily calorie limit is ${user.calorieBound} kcal. 
They follow a ${user.dietaryPreference || "omnivore"} diet.
Protein goal: ${user.proteinGoalG || "not set"}g, Carbs goal: ${user.carbsGoalG || "not set"}g, Fat goal: ${user.fatGoalG || "not set"}g.
Today (${timeOfDay}): consumed ${consumed} kcal, burned ${burned} kcal through exercise, ${remaining} kcal remaining.
Meals logged today: ${mealsLogged}.
Keep responses under 3 sentences. Be specific, practical, and encouraging. Never suggest water tracking.`;

    const messages = userInput
        ? [{ role: "user" as const, content: userInput }]
        : [{ role: "user" as const, content: `Give me a meal suggestion for this ${timeOfDay} based on my remaining calories and diet preference.` }];

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 150,
        temperature: 0.7,
    });

    const suggestionText = completion.choices[0]?.message?.content || "I couldn't generate a suggestion right now. Try again!";

    return {
        remaining,
        suggestionText,
        customFoods: customFoods.map(f => ({ ...f, createdAt: f.createdAt.toISOString() })),
        promptForInput: true
    };
}
