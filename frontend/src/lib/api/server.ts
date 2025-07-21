import { Post, User, LoginResponse, PaginatedPostsResponse } from "@/types";

const API_BASE_URL = process.env.INTERNAL_API_URL || "http://api-backend:8080";

async function fetchFromServer<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      // In a real app, you'd want more robust error handling
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(
        errorBody.message || `HTTP ${response.status}: ${response.statusText}`
      ) as Error & { status: number };
      // Add status code to error for better handling
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch from server:", error);
    throw error;
  }
}

// New function that returns both data and response for cookie handling
async function fetchFromServerWithResponse<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; response: Response }> {
  const url = `${API_BASE_URL}/api${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(
        errorBody.message || `HTTP ${response.status}: ${response.statusText}`
      ) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return { data, response };
  } catch (error) {
    console.error("Failed to fetch from server:", error);
    throw error;
  }
}

async function fetchFromServerWithCookies<T>(
  path: string,
  cookieHeader: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api${path}`;
  console.log(`[API] Making request to: ${url}`);
  console.log(`[API] Cookie header being sent: ${cookieHeader}`);
  console.log(`[API] Request options:`, JSON.stringify(options, null, 2));
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        ...options.headers,
      },
    });

    console.log(`[API] Response status: ${response.status} ${response.statusText}`);
    console.log(`[API] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error(`[API] API Error: ${response.status} ${response.statusText}`);
      const errorBody = await response.json().catch(() => ({}));
      console.error(`[API] Error body:`, errorBody);
      const error = new Error(
        errorBody.message || `HTTP ${response.status}: ${response.statusText}`
      ) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    console.log(`[API] Response data:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("[API] Failed to fetch from server:", error);
    throw error;
  }
}

export const api = {
  getPosts: (
    pageSize?: number,
    pageIndex?: number,
    status?: string
  ): Promise<PaginatedPostsResponse> => {
    const params = new URLSearchParams();
    if (pageSize) params.append("pageSize", pageSize.toString());
    // pageIndex is 1-based now - use 1 as default instead of undefined
    if (pageIndex !== undefined)
      params.append("pageIndex", pageIndex.toString());
    if (status) params.append("status", status);

    const query = params.toString();
    return fetchFromServer(`/posts${query ? `?${query}` : ""}`);
  },
  getPostBySlug: (slug: string): Promise<Post> =>
    fetchFromServer(`/posts/${slug}`),
  login: (email: string, password: string): Promise<LoginResponse> =>
    fetchFromServer("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  loginWithResponse: (email: string, password: string) =>
    fetchFromServerWithResponse<LoginResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  refresh: (): Promise<LoginResponse> =>
    fetchFromServer("/users/refresh", {
      method: "POST",
    }),
  refreshWithCookies: (cookieHeader: string): Promise<LoginResponse> =>
    fetchFromServerWithCookies("/users/refresh", cookieHeader, {
      method: "POST",
    }),
  getUserByUsername: (username: string, accessToken: string): Promise<User> =>
    fetchFromServer(`/users/${username}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  // Add other server-side API calls here as needed
};
