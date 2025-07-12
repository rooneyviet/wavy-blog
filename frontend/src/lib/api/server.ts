import { Post, User, LoginResponse } from "@/types";

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

export const api = {
  getPosts: (): Promise<Post[]> => fetchFromServer("/posts"),
  getPostBySlug: (slug: string): Promise<Post> => fetchFromServer(`/posts/${slug}`),
  login: (
    email: string,
    password: string
  ): Promise<LoginResponse> =>
    fetchFromServer("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getUserByUsername: (username: string, accessToken: string): Promise<User> =>
    fetchFromServer(`/users/${username}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  // Add other server-side API calls here as needed
};
