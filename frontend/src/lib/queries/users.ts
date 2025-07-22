import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, PaginatedUsersResponse } from "@/types";
import { handleUnauthorizedResponse } from "@/lib/utils/auth";
import { toast } from "sonner";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
};

const fetchUsers = async (
  accessToken: string,
  options: {
    username?: string;
    role?: string;
    pageSize?: number;
    pageIndex?: number;
  } = {}
): Promise<PaginatedUsersResponse> => {
  const params = new URLSearchParams();
  if (options.username) params.append("username", options.username);
  if (options.role) params.append("role", options.role);
  if (options.pageSize) params.append("pageSize", options.pageSize.toString());
  if (options.pageIndex) params.append("pageIndex", options.pageIndex.toString());

  const url = params.toString() ? `/api/users?${params.toString()}` : "/api/users";
  const response = await fetch(url, {
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
  list: (accessToken: string, options: {
    username?: string;
    role?: string;
    pageSize?: number;
    pageIndex?: number;
  } = {}) =>
    queryOptions({
      queryKey: userKeys.list(
        `page-${options.pageIndex || 1}-size-${options.pageSize || 20}-username-${options.username || ""}-role-${options.role || ""}`
      ),
      queryFn: () => fetchUsers(accessToken, options),
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
