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

    const weightKg = user.weightKg || 70;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `You are an exercise calorie calculator. Output ONLY a JSON object, no explanations, no markdown, no reasoning.

User weight: ${weightKg}kg
Formula: calories = MET × weight_kg × duration_hours

MET values: running=9.8, jogging=7, walking=3.5, cycling=7.5, swimming=8, HIIT=10, yoga=3, weightlifting=5, dancing=6, CrossFit=10, basketball=8, tennis=7, hiking=6, elliptical=5, rowing=7, pilates=3.5, stair_climbing=4, push_ups=3.8, pull_ups=5, sit_ups=3.5, burpees=8, jumping_jacks=6.

Distance → duration: running ~6 min/km, walking ~12 min/km, cycling ~3 min/km.

Count-based → estimated duration (always give a best estimate, never error on these):
- Stairs/steps: 1 flight (~12 steps) ≈ 1 min at MET 4. "20 steps" ≈ 2 min.
- Push-ups: every 10 reps ≈ 1 min at MET 3.8
- Pull-ups: every 5 reps ≈ 1 min at MET 5
- Sit-ups / crunches: every 15 reps ≈ 1 min at MET 3.5
- Burpees: every 5 reps ≈ 1 min at MET 8
- Jumping jacks: every 20 reps ≈ 1 min at MET 6
- Walking steps (pedometer): 1000 steps ≈ 10 min walking at MET 3.5
- Laps (pool): 1 lap (50m) ≈ 2 min swimming at MET 8
- Laps (track): 1 lap (400m) ≈ 3 min jogging at MET 7

IMPORTANT: Always return a valid result. Even if the input is vague or count-based, make a reasonable best estimate. Only return an error if the input is completely unrelated to physical activity.

Output format (JSON only):
{"activityName":"Stair Climbing","durationMin":2,"caloriesBurned":9}

Only if input is completely unrelated to exercise:
{"error":"Please describe a physical activity, e.g. 'ran 30 min', 'climbed 3 flights of stairs', '50 push-ups'."}`
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
        return { success: false, error: "AI could not parse your exercise. Try: 'ran 30 min', '50 push-ups', 'climbed 3 flights of stairs'." };
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
