import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api/server";
import { Post } from "@/types";
import { handleUnauthorizedResponse } from "@/lib/utils/auth";

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters: string) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  admin: () => [...postKeys.all, "admin"] as const,
};

const fetchPostsAdmin = async (accessToken: string): Promise<{ posts: Post[] }> => {
  const response = await fetch("/api/posts", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Check for 401 and automatically logout
  if (handleUnauthorizedResponse(response)) {
    throw new Error("Unauthorized - logged out");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }

  return response.json();
};

export const postQueries = {
  list: (pageSize?: number, pageIndex?: number) =>
    queryOptions({
      queryKey: postKeys.list(`page-${pageIndex || 0}-size-${pageSize || 10}`),
      queryFn: () => api.getPosts(pageSize, pageIndex),
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: postKeys.detail(slug),
      queryFn: () => api.getPostBySlug(slug),
      retry: (failureCount, error: unknown) => {
        // Don't retry on 404 errors
        const errorWithStatus = error as Error & { status?: number };
        if (errorWithStatus?.message?.includes('404') || errorWithStatus?.status === 404) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
  // Add other post-related queries here
  admin: (accessToken: string) =>
    queryOptions({
      queryKey: postKeys.admin(),
      queryFn: () => fetchPostsAdmin(accessToken),
    }),
};
