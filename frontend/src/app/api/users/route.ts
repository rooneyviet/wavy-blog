import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.INTERNAL_API_URL || "http://api-backend:8080";

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const role = searchParams.get("role");
    const pageSize = searchParams.get("pageSize");
    const pageIndex = searchParams.get("pageIndex");

    // Build query parameters for backend API
    const params = new URLSearchParams();
    if (username) params.append("username", username);
    if (role) params.append("role", role);
    if (pageSize) params.append("pageSize", pageSize);
    if (pageIndex) params.append("pageIndex", pageIndex);

    const url = params.toString() 
      ? `${API_BASE_URL}/api/users?${params.toString()}` 
      : `${API_BASE_URL}/api/users`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch users" },
        { status: response.status }
      );
    }

    const users = await response.json();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}