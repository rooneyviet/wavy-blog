import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api/server";

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters: string) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
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
};
