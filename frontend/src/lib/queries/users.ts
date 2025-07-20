import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";
import { handleUnauthorizedResponse } from "@/lib/utils/auth";
import { toast } from "sonner";

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

const deleteUser = async (username: string, accessToken: string): Promise<void> => {
  const response = await fetch(`/api/users/${username}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || "Failed to delete user") as Error & { details?: string };
    error.details = errorData.details;
    throw error;
  }
};

export const userQueries = {
  list: (accessToken: string) =>
    queryOptions({
      queryKey: userKeys.lists(),
      queryFn: () => fetchUsers(accessToken),
      //enabled: !!accessToken,
    }),
};

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const deleteOneMutation = useMutation({
    mutationFn: ({ username, accessToken }: { username: string; accessToken: string }) =>
      deleteUser(username, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User deleted successfully");
    },
    onError: (error: Error & { details?: string }) => {
      const description = error.details ? `${error.message} ${error.details}` : error.message;
      toast.error("Failed to delete user", {
        description,
      });
    },
  });

  return {
    deleteOne: deleteOneMutation,
  };
};
