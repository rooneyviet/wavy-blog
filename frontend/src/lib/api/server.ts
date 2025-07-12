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
      throw new Error(
        errorBody.message || "An error occurred while fetching data."
      );
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch from server:", error);
    throw error;
  }
}

export const api = {
  getPosts: (): Promise<Post[]> => fetchFromServer("/posts"),
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
