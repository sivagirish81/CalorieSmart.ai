"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function addCustomFood(data: { name: string; calories: number; protein?: number; carbs?: number; fat?: number; servingSizeG?: number }) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    await prisma.customFood.create({
        data: {
            userId: user.id,
            name: data.name,
            calories: data.calories,
            protein: data.protein || null,
            carbs: data.carbs || null,
            fat: data.fat || null,
            servingSizeG: data.servingSizeG || null,
        }
    });

    return { success: true };
}

export async function getMyCustomFoods() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) return [];

    const foods = await prisma.customFood.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
    });

    return foods;
}

export async function logCustomFood(foodId: string, mealType: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    const food = await prisma.customFood.findUnique({ where: { id: foodId } });
    if (!food || food.userId !== user.id) throw new Error("Food not found or unauthorized");

    await prisma.mealLog.create({
        data: {
            userId: user.id,
            type: mealType,
            items: {
                create: {
                    name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fat: food.fat,
                    servingSizeG: food.servingSizeG,
                }
            }
        }
    });

    return { success: true };
}
