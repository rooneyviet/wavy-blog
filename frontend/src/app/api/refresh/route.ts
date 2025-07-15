import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.INTERNAL_API_URL || "http://api-backend:8080";

export async function POST(request: NextRequest) {
  console.log("[API ROUTE] /api/refresh called");

  try {
    // Try to get refresh token from cookies first, then from request body
    const cookieStore = await cookies();
    let refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      console.log(
        "[API ROUTE] No refresh token in cookies, trying request body"
      );
      const body = await request.json().catch(() => ({}));
      refreshToken = body.refreshToken;
    } else {
      console.log("[API ROUTE] Found refresh token in cookies");
    }

    if (!refreshToken) {
      console.log(
        "[API ROUTE] No refresh token found in cookies or request body"
      );
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      );
    }

    console.log("[API ROUTE] Found refresh token:", refreshToken);

    console.log("[API ROUTE] Making request to backend with refresh token");

    // Call backend refresh endpoint
    const backendResponse = await fetch(`${API_BASE_URL}/api/users/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    console.log("[API ROUTE] Backend response status:", backendResponse.status);

    if (!backendResponse.ok) {
      console.log("[API ROUTE] Backend refresh failed");
      return NextResponse.json(
        { error: "Refresh failed" },
        { status: backendResponse.status }
      );
    }

    const responseData = await backendResponse.json();
    console.log("[API ROUTE] Backend refresh successful");

    const setCookieHeaders = backendResponse.headers.getSetCookie();
    const response = NextResponse.json(responseData);

    // Set each cookie header individually
    setCookieHeaders.forEach((cookie) => {
      response.headers.append("Set-Cookie", cookie);
    });

    return response;
  } catch (error) {
    console.error("[API ROUTE] Error in refresh route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
