"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function submitOnboarding(prevState: unknown, formData: FormData) {
  const name = formData.get("name") as string;
  const calorieBound = Number(formData.get("calorieBound"));
  const dietaryPreference = formData.get("dietaryPreference") as string;

  if (!name || !calorieBound || !dietaryPreference) {
    return { error: "Please complete all profile fields to continue." };
  }

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
