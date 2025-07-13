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
    const { data, response } = await api.loginWithResponse(email, password);
    const { access_token, user } = data;

    // Forward cookies from backend to browser
    const setCookieHeaders = response.headers.getSetCookie();
    const cookieStore = await cookies();
    
    setCookieHeaders.forEach((cookieHeader) => {
      // Parse the Set-Cookie header
      const [cookiePart, ...attributeParts] = cookieHeader.split(';');
      const [name, value] = cookiePart.split('=');
      
      if (name?.trim() === 'refresh_token') {
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

        // Set the cookie in NextJS
        cookieStore.set(name.trim(), value, {
          maxAge: attributes.maxAge || 1209600, // 14 days default
          path: attributes.path || '/',
          httpOnly: attributes.httpOnly || true,
          secure: attributes.secure || false,
          sameSite: attributes.sameSite || 'strict'
        });
      }
    });

    return { user, access_token };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred during login.",
    };
  }
}
