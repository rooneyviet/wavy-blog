import { cookies } from "next/headers";

/**
 * Forward cookies from a backend response to the browser
 * Parses Set-Cookie headers and applies them using Next.js cookies()
 */
export async function forwardCookiesFromResponse(response: Response, logPrefix = "[COOKIE_UTILS]") {
  const setCookieHeaders = response.headers.getSetCookie();
  console.log(`${logPrefix} Set-Cookie headers from backend:`, setCookieHeaders);
  
  const cookieStore = await cookies();
  
  setCookieHeaders.forEach((cookieHeader) => {
    console.log(`${logPrefix} Processing cookie header:`, cookieHeader);
    
    // Parse the Set-Cookie header
    const [cookiePart, ...attributeParts] = cookieHeader.split(';');
    const [name, value] = cookiePart.split('=');
    
    if (name?.trim() === 'refresh_token') {
      console.log(`${logPrefix} Found refresh_token cookie, value:`, value);
      
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

      console.log(`${logPrefix} Cookie attributes:`, attributes);

      // Set the cookie in NextJS
      cookieStore.set(name.trim(), value, {
        maxAge: attributes.maxAge || 1209600, // 14 days default
        path: attributes.path || '/',
        httpOnly: attributes.httpOnly || true,
        secure: attributes.secure || false,
        sameSite: attributes.sameSite || 'strict'
      });

      console.log(`${logPrefix} Cookie set in NextJS with attributes:`, {
        maxAge: attributes.maxAge || 1209600,
        path: attributes.path || '/',
        httpOnly: attributes.httpOnly || true,
        secure: attributes.secure || false,
        sameSite: attributes.sameSite || 'strict'
      });
    }
  });
}