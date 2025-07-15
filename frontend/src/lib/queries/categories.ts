import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Category } from "@/types";
import { toast } from "sonner";

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (slug: string) => [...categoryKeys.details(), slug] as const,
};

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch("/api/categories", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  return response.json();
};

const fetchCategoryBySlug = async (slug: string): Promise<Category> => {
  const response = await fetch(`/api/categories/${slug}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.status}`);
  }

  return response.json();
};

const deleteCategoryBatch = async (
  slugs: string[],
  accessToken: string
): Promise<void> => {
  const response = await fetch("/api/categories", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ slugs }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || "Failed to delete categories"
    ) as Error & { details?: string };
    error.details = errorData.details;
    throw error;
  }
};

export const categoryQueries = {
  list: () =>
    queryOptions({
      queryKey: categoryKeys.lists(),
      queryFn: fetchCategories,
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: categoryKeys.detail(slug),
      queryFn: () => fetchCategoryBySlug(slug),
      retry: (failureCount, error: unknown) => {
        // Don't retry on 404 errors
        const errorWithStatus = error as Error & { status?: number };
        if (
          errorWithStatus?.message?.includes("404") ||
          errorWithStatus?.status === 404
        ) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
};

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();

  const deleteManyMutation = useMutation({
    mutationFn: ({
      slugs,
      accessToken,
    }: {
      slugs: string[];
      accessToken: string;
    }) => deleteCategoryBatch(slugs, accessToken),
    onSuccess: (_, { slugs }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success(`${slugs.length} categories deleted successfully`);
    },
    onError: (error: Error & { details?: string }) => {
      const description = error.details
        ? `${error.message} ${error.details}`
        : error.message;
      toast.error("Failed to delete categories", {
        description,
      });
    },
  });

  return {
    deleteMany: deleteManyMutation,
  };
};
