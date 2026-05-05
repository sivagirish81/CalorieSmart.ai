"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function submitOnboarding(prevState: unknown, formData: FormData) {
  const name = formData.get("name") as string;
  const calorieBound = Number(formData.get("calorieBound"));
  const dietaryPreference = formData.get("dietaryPreference") as string;
  
  const age = formData.get("age") ? Number(formData.get("age")) : null;
  const heightCm = formData.get("heightCm") ? Number(formData.get("heightCm")) : null;
  const weightKg = formData.get("weightKg") ? Number(formData.get("weightKg")) : null;
  const gender = formData.get("gender") as string | null;
  const activityLevel = formData.get("activityLevel") as string | null;
  const timezone = (formData.get("timezone") as string) || "UTC";

  if (!name || !calorieBound || !dietaryPreference) {
    return { error: "Please complete all profile fields to continue." };
  }

  // Calculate default macros: 30% protein, 40% carbs, 30% fat
  const proteinGoalG = Math.round((calorieBound * 0.3) / 4);
  const carbsGoalG = Math.round((calorieBound * 0.4) / 4);
  const fatGoalG = Math.round((calorieBound * 0.3) / 9);

  try {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized session." };

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) return { error: "Critical error mapping user record." };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        calorieBound,
        dietaryPreference,
        age,
        heightCm,
        weightKg,
        gender,
        activityLevel,
        proteinGoalG,
        carbsGoalG,
        fatGoalG,
        timezone,
        onboardingComplete: true,
      }
    });
  } catch (error) {
    console.error("Onboarding saving error:", error);
    return { error: "Failed to calibrate your profile context. Try again." };
  }

  // Next.js explicitly requires redirects to occur strictly outside the try/catch logic boundary
  redirect("/");
}
