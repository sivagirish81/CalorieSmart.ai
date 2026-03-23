"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getUserProfile() {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User record clearly missing");

    return user;
  } catch (error) {
    console.error("Failed to fetch profile", error);
    throw new Error("Unable to fetch user profile");
  }
}

export async function updateProfile(data: { name: string; calorieBound: number; dietaryPreference: string }) {
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
        dietaryPreference: data.dietaryPreference
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
