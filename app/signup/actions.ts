"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function registerAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "Please fill out all required fields." };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "A user already exists with this email address. Please log in." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user with default Profile data
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        calorieBound: 2000,
        dietaryPreference: "Omnivore"
      }
    });
  } catch (error) {
    console.error("Registration error", error);
    return { error: "Failed to create your account due to a database error." };
  }

  // Automatically log the user in using the credentials they just provided!
  try {
    await signIn("credentials", formData, { redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registration succeeded, but auto-login failed. Please proceed to Login." };
    }
    // Let NEXT_REDIRECT bubble up so Next.js handles the routing properly
    throw error;
  }
}
