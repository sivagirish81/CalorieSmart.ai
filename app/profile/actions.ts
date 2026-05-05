"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getUserProfile() {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ 
        where: { email: session.user.email },
        select: {
            name: true, calorieBound: true, dietaryPreference: true,
            proteinGoalG: true, carbsGoalG: true, fatGoalG: true,
            weightKg: true, weightLogs: { orderBy: { date: 'asc' } }
        }
    });
    if (!user) throw new Error("User record clearly missing");

    return {
      ...user,
      weightLogs: user.weightLogs.map(log => ({
        ...log,
        date: log.date.toISOString()
      }))
    };
  } catch (error) {
    console.error("Failed to fetch profile", error);
    throw new Error("Unable to fetch user profile");
  }
}

export async function updateProfile(data: { 
  name: string; 
  calorieBound: number; 
  dietaryPreference: string;
  proteinGoalG?: number;
  carbsGoalG?: number;
  fatGoalG?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User not found in system");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        calorieBound: data.calorieBound,
        dietaryPreference: data.dietaryPreference,
        ...(data.proteinGoalG !== undefined && { proteinGoalG: data.proteinGoalG }),
        ...(data.carbsGoalG !== undefined && { carbsGoalG: data.carbsGoalG }),
        ...(data.fatGoalG !== undefined && { fatGoalG: data.fatGoalG }),
      }
    });

    // Revalidate the home page so the progress bar updates instantly
    revalidatePath("/");
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update profile", error);
    return { success: false, error: "Failed to save profile." };
  }
}
