"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", formData, { redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Email or Password" };
        default:
          return { error: "Something went wrong! Please try again." };
      }
    }
    // NEXT_REDIRECT throws a standard error, so we must let it bubble up
    throw error;
  }
}
