"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function analyzePhoto(base64Image: string, mimeType: string) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

    const prompt = `Analyze this food image. For each food item you see, estimate the nutrition.
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "items": [
    {
      "name": "food name",
      "calories": 250,
      "protein_g": 10,
      "carbohydrates_total_g": 30,
      "fat_total_g": 8,
      "serving_size_g": 150
    }
  ]
}`;

    const result = await model.generateContent([
        { inlineData: { data: base64Image, mimeType } },
        prompt
    ]);

    const text = result.response.text().trim();
    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.items as Array<{
        name: string;
        calories: number;
        protein_g: number;
        carbohydrates_total_g: number;
        fat_total_g: number;
        serving_size_g: number;
    }>;
}

export async function savePhotoMealLog(items: Array<{
    name: string; calories: number; protein_g: number;
    carbohydrates_total_g: number; fat_total_g: number; serving_size_g: number;
}>, mealType: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User not found");

    await prisma.mealLog.create({
        data: {
            userId: user.id,
            type: mealType,
            items: {
                create: items.map(item => ({
                    name: item.name,
                    calories: item.calories,
                    protein: item.protein_g,
                    carbs: item.carbohydrates_total_g,
                    fat: item.fat_total_g,
                    servingSizeG: item.serving_size_g,
                }))
            }
        }
    });

    revalidatePath("/");
    return { success: true };
}
