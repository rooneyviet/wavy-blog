"use server";

import { z } from "zod";
import { api } from "@/lib/api/server";
import { FormState } from "@/types";
import { forwardCookiesFromResponse } from "@/lib/utils/cookies";
import { cookies } from "next/headers";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, "Password is required."),
});

export async function login(_prevState: FormState | undefined, formData: FormData): Promise<FormState> {
  console.log("[LOGIN_ACTION] Starting login process");
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    console.log("[LOGIN_ACTION] Validation failed:", validatedFields.error.errors);
    return {
      error: validatedFields.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    const { email, password } = validatedFields.data;
    console.log("[LOGIN_ACTION] Attempting login for email:", email);
    const { data, response } = await api.loginWithResponse(email, password);
    const { access_token, user } = data;

    console.log("[LOGIN_ACTION] Login successful, user:", user.username);

    // Forward cookies from backend to browser
    await forwardCookiesFromResponse(response, "[LOGIN_ACTION]");

    console.log("[LOGIN_ACTION] Login process completed successfully");
    return { user, access_token };
  } catch (error: unknown) {
    console.error("[LOGIN_ACTION] Login failed:", error);
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred during login.",
    };
  }
}

/**
 * Server action for logout - removes refresh token cookie
 */
export async function logout(): Promise<{ success: boolean }> {
  console.log("[LOGOUT_ACTION] Starting logout process");
  
  try {
    const cookieStore = await cookies();
    
    // Remove the refresh_token cookie
    cookieStore.set("refresh_token", "", {
      path: "/",
      expires: new Date(0), // Set expiry to past date
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    
    console.log("[LOGOUT_ACTION] Refresh token cookie removed");
    return { success: true };
  } catch (error) {
    console.error("[LOGOUT_ACTION] Error during logout:", error);
    return { success: false };
  }
}
