"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function deleteMealLog(id: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");
    
    const log = await prisma.mealLog.findUnique({ where: { id }});
    if (!log || log.userId !== user.id) return { success: false, error: "Unauthorized" };

    await prisma.mealLog.delete({ where: { id } });
    revalidatePath("/history");
    return { success: true };
}
