"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getDayBounds } from "@/lib/time";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function logExercise(input: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    const weightKg = user.weightKg || 70; // fallback to 70kg if not set

    // Use Groq to parse the exercise description
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `You are an exercise calorie calculator. Output ONLY a JSON object, no explanations, no markdown, no reasoning.

User weight: ${weightKg}kg
Formula: calories = MET × weight_kg × duration_hours

MET values: running=9.8, jogging=7, walking=3.5, cycling=7.5, swimming=8, HIIT=10, yoga=3, weightlifting=5, dancing=6, CrossFit=10, basketball=8, tennis=7, hiking=6, elliptical=5, rowing=7, pilates=3.5.

If given distance instead of time, estimate duration using typical pace (running ~6 min/km, walking ~12 min/km, cycling ~3 min/km).

Output format (JSON only):
{"activityName":"Running","durationMin":30,"caloriesBurned":245}

If activity or duration cannot be determined:
{"error":"Please describe what you did and for how long, e.g. ran for 30 minutes."}`
            },
            {
                role: "user",
                content: input
            }
        ],
        max_tokens: 60,
        temperature: 0,
        response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    console.log("[Exercise AI] Raw Groq response:", raw);

    // Extract the first JSON object from the response, regardless of surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error("[Exercise AI] No JSON found in response:", raw);
        return { success: false, error: "AI could not parse your exercise. Try: 'ran 30 minutes' or 'swam for 1 hour'." };
    }

    let parsed: { activityName?: string; durationMin?: number; caloriesBurned?: number; error?: string };
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch {
        console.error("[Exercise AI] JSON.parse failed on:", jsonMatch[0]);
        return { success: false, error: "AI response was malformed. Please try again." };
    }

    if (parsed.error) return { success: false, error: parsed.error };
    if (!parsed.activityName || !parsed.durationMin || !parsed.caloriesBurned) {
        return { success: false, error: "Could not extract exercise details. Please include what you did and for how long." };
    }

    await prisma.exerciseLog.create({
        data: {
            userId: user.id,
            activityName: parsed.activityName,
            durationMin: parsed.durationMin,
            caloriesBurned: Math.round(parsed.caloriesBurned),
        }
    });

    revalidatePath("/");
    revalidatePath("/exercise");
    return {
        success: true,
        activityName: parsed.activityName,
        durationMin: parsed.durationMin,
        caloriesBurned: Math.round(parsed.caloriesBurned)
    };
}

export async function getTodaysExercises() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) return [];

    const { startOfDay, endOfDay } = getDayBounds(user.timezone);

    const logs = await prisma.exerciseLog.findMany({
        where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } },
        orderBy: { date: 'desc' }
    });

    return logs.map(l => ({ ...l, date: l.date.toISOString() }));
}

export async function deleteExercise(id: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    const log = await prisma.exerciseLog.findUnique({ where: { id } });
    if (!log || log.userId !== user.id) return { success: false, error: "Unauthorized" };

    await prisma.exerciseLog.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/exercise");
    return { success: true };
}

export async function updateExercise(id: string, patch: { activityName?: string; durationMin?: number; caloriesBurned?: number }) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    const log = await prisma.exerciseLog.findUnique({ where: { id } });
    if (!log || log.userId !== user.id) return { success: false, error: "Unauthorized" };

    await prisma.exerciseLog.update({ where: { id }, data: patch });
    revalidatePath("/");
    revalidatePath("/exercise");
    return { success: true };
}
