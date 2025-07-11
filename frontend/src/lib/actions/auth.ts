"use server";

import { z } from "zod";
import { api } from "@/lib/api/server";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, "Password is required."),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    const { email, password } = validatedFields.data;
    const { access_token, user } = await api.login(email, password);

    // The server action's only job is to call the backend and return the result.
    // The client will handle storing the token and user data.
    return { user, access_token };
  } catch (error: any) {
    return {
      error: error.message || "An unexpected error occurred during login.",
    };
  }
}
