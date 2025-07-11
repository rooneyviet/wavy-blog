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
  list: () =>
    queryOptions({
      queryKey: postKeys.lists(),
      queryFn: () => api.getPosts(),
    }),
  // Add other post-related queries here
};
