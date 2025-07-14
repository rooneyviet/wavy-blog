import { queryOptions } from "@tanstack/react-query";
import { User } from "@/types";

export const authKeys = {
  all: ["auth"] as const,
  refresh: () => [...authKeys.all, "refresh"] as const,
};

const refreshAuth = async (): Promise<User> => {
  const response = await fetch("/api/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Refresh failed with status: ${response.status}`);
  }

  const data = await response.json();
  return data.user;
};

export const authQueries = {
  refresh: () =>
    queryOptions({
      queryKey: authKeys.refresh(),
      queryFn: refreshAuth,
      retry: false, // Don't retry auth failures
      staleTime: 0, // Always check auth status
    }),
};