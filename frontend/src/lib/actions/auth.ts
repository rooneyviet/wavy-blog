"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { api } from "@/lib/api/server";
import { FormState } from "@/types";

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
    const setCookieHeaders = response.headers.getSetCookie();
    console.log("[LOGIN_ACTION] Set-Cookie headers from backend:", setCookieHeaders);
    const cookieStore = await cookies();
    
    setCookieHeaders.forEach((cookieHeader) => {
      console.log("[LOGIN_ACTION] Processing cookie header:", cookieHeader);
      // Parse the Set-Cookie header
      const [cookiePart, ...attributeParts] = cookieHeader.split(';');
      const [name, value] = cookiePart.split('=');
      
      if (name?.trim() === 'refresh_token') {
        console.log("[LOGIN_ACTION] Found refresh_token cookie, value:", value);
        // Parse cookie attributes
        const attributes: {
          maxAge?: number;
          path?: string;
          httpOnly?: boolean;
          secure?: boolean;
          sameSite?: 'strict' | 'lax' | 'none';
        } = {};
        attributeParts.forEach(attr => {
          const [key, val] = attr.trim().split('=');
          if (key.toLowerCase() === 'max-age') {
            attributes.maxAge = parseInt(val);
          } else if (key.toLowerCase() === 'path') {
            attributes.path = val;
          } else if (key.toLowerCase() === 'httponly') {
            attributes.httpOnly = true;
          } else if (key.toLowerCase() === 'secure') {
            attributes.secure = true;
          } else if (key.toLowerCase() === 'samesite') {
            const sameSiteValue = val?.toLowerCase();
            if (sameSiteValue === 'strict' || sameSiteValue === 'lax' || sameSiteValue === 'none') {
              attributes.sameSite = sameSiteValue;
            }
          }
        });

        console.log("[LOGIN_ACTION] Cookie attributes:", attributes);

        // Set the cookie in NextJS
        cookieStore.set(name.trim(), value, {
          maxAge: attributes.maxAge || 1209600, // 14 days default
          path: attributes.path || '/',
          httpOnly: attributes.httpOnly || true,
          secure: attributes.secure || false,
          sameSite: attributes.sameSite || 'strict'
        });

        console.log("[LOGIN_ACTION] Cookie set in NextJS with attributes:", {
          maxAge: attributes.maxAge || 1209600,
          path: attributes.path || '/',
          httpOnly: attributes.httpOnly || true,
          secure: attributes.secure || false,
          sameSite: attributes.sameSite || 'strict'
        });
      }
    });

    console.log("[LOGIN_ACTION] Login process completed successfully");
    return { user, access_token };
  } catch (error: unknown) {
    console.error("[LOGIN_ACTION] Login failed:", error);
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred during login.",
    };
  }
}
