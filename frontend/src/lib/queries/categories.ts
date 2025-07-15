import { queryOptions } from "@tanstack/react-query";
import { Category } from "@/types";

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
        if (errorWithStatus?.message?.includes('404') || errorWithStatus?.status === 404) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
};