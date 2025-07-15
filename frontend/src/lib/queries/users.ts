import { queryOptions } from "@tanstack/react-query";
import { User } from "@/types";
import { handleUnauthorizedResponse } from "@/lib/utils/auth";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
};

const fetchUsers = async (accessToken: string): Promise<User[]> => {
  const response = await fetch("/api/users", {
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
    throw new Error(`Failed to fetch users: ${response.status}`);
  }

  return response.json();
};

export const userQueries = {
  list: (accessToken: string) =>
    queryOptions({
      queryKey: userKeys.lists(),
      queryFn: () => fetchUsers(accessToken),
      //enabled: !!accessToken,
    }),
};
