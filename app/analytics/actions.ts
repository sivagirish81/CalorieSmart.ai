"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import Groq from "groq-sdk";
import { getDayBounds } from "@/lib/time";

export async function getWeeklySummary(): Promise<string> {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy_key" });
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User not found");

    const d7 = new Date();
    d7.setDate(d7.getDate() - 6);
    const { startOfDay: sevenDaysAgo } = getDayBounds(user.timezone, d7);

    const meals = await prisma.mealLog.findMany({
        where: { userId: user.id, date: { gte: sevenDaysAgo } },
        include: { items: true }
    });

    if (meals.length === 0) return "You haven't logged enough meals this week to generate a summary. Start logging and check back!";

    // Aggregate per day
    const dailyTotals: Record<string, number> = {};
    meals.forEach(log => {
        const day = log.date.toLocaleDateString("en-US", { weekday: "short", timeZone: user.timezone });
        const cal = log.items.reduce((s, i) => s + i.calories, 0);
        dailyTotals[day] = (dailyTotals[day] || 0) + cal;
    });

    const summaryLines = Object.entries(dailyTotals)
        .map(([day, cal]) => `${day}: ${cal} kcal`)
        .join(", ");

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `You are a friendly nutrition coach. Write a 3-4 sentence weekly summary. Be honest but encouraging. Do not use bullet points.`
            },
            {
                role: "user",
                content: `My calorie goal is ${user.calorieBound} kcal/day. Here are my last 7 days: ${summaryLines}. Give me a brief coaching summary of my week.`
            }
        ],
        max_tokens: 120,
        temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "Keep logging your meals for better insights!";
}
