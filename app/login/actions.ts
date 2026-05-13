"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", formData, { redirectTo: "/?login=1" });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Email or Password" };
        default:
          return { error: "Something went wrong! Please try again." };
      }
    }
    throw error;
  }
}
