"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import { getDayBounds } from "@/lib/time";

export async function logWeight(weightKg: number, dateStr: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    const date = new Date(dateStr);
    
    // Check if a log exists for this date, if so update it, else create
    const { startOfDay, endOfDay } = getDayBounds(user.timezone, new Date(date));

    const existing = await prisma.weightLog.findFirst({
        where: {
            userId: user.id,
            date: { gte: startOfDay, lte: endOfDay }
        }
    });

    if (existing) {
        await prisma.weightLog.update({
            where: { id: existing.id },
            data: { weightKg }
        });
    } else {
        await prisma.weightLog.create({
            data: { userId: user.id, weightKg, date }
        });
    }

    // Update user's current weight in the profile
    await prisma.user.update({
        where: { id: user.id },
        data: { weightKg }
    });

    revalidatePath("/weight");
    revalidatePath("/profile");
    return { success: true };
}
