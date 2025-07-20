import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.INTERNAL_API_URL || "http://api-backend:8080";

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    
    // Build API URL with query parameters
    const apiUrl = new URL(`${API_BASE_URL}/api/posts`);
    if (status) {
      apiUrl.searchParams.append("status", status);
    }
    
    // Pass through pagination parameters
    const pageSize = searchParams.get("pageSize");
    const pageIndex = searchParams.get("pageIndex");
    if (pageSize) apiUrl.searchParams.append("pageSize", pageSize);
    if (pageIndex) apiUrl.searchParams.append("pageIndex", pageIndex);
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if provided (for admin requests)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headers.Authorization = authHeader;
    }

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch posts" },
        { status: response.status }
      );
    }

    const posts = await response.json();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to create post", details: errorData.details },
        { status: response.status }
      );
    }

    const post = await response.json();
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to delete posts", details: errorData.details },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}