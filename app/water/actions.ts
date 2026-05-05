"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import { getDayBounds } from "@/lib/time";

export async function logWater(amountMl: number) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    await prisma.waterLog.create({
        data: {
            userId: user.id,
            amountMl
        }
    });

    revalidatePath("/");
    return { success: true };
}

export async function undoWater() {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    const { startOfDay, endOfDay } = getDayBounds(user.timezone);

    // Find the latest water log for today and delete it
    const latestLog = await prisma.waterLog.findFirst({
        where: { 
            userId: user.id,
            date: { gte: startOfDay, lte: endOfDay }
        },
        orderBy: { date: 'desc' }
    });

    if (latestLog) {
        await prisma.waterLog.delete({ where: { id: latestLog.id } });
    }

    revalidatePath("/");
    return { success: true };
}
