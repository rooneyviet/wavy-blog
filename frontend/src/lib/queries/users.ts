import { queryOptions } from "@tanstack/react-query";
import { User } from "@/types";

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
