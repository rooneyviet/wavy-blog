import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/server";
import { Post } from "@/types";
import { handleUnauthorizedResponse } from "@/lib/utils/auth";
import { toast } from "sonner";

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

interface CreatePostData {
  title: string;
  content: string;
  categorySlug: string;
  thumbnailURL?: string;
  status?: "published" | "draft";
}

const createPost = async (postData: CreatePostData, accessToken: string): Promise<Post> => {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || "Failed to create post") as Error & { details?: string };
    error.details = errorData.details;
    throw error;
  }

  return response.json();
};

interface UpdatePostData {
  title: string;
  content: string;
  categorySlug: string;
  thumbnailURL?: string;
  status?: "published" | "draft";
}

const updatePost = async (slug: string, postData: UpdatePostData, accessToken: string): Promise<Post> => {
  const response = await fetch(`/api/posts/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || "Failed to update post") as Error & { details?: string };
    error.details = errorData.details;
    throw error;
  }

  return response.json();
};

export const postQueries = {
  list: (pageSize?: number, pageIndex?: number, status?: string) =>
    queryOptions({
      queryKey: postKeys.list(`page-${pageIndex || 0}-size-${pageSize || 10}-status-${status || 'all'}`),
      queryFn: () => api.getPosts(pageSize, pageIndex, status),
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

const deletePost = async (slug: string, accessToken: string): Promise<void> => {
  const response = await fetch(`/api/posts/${slug}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || "Failed to delete post") as Error & { details?: string };
    error.details = errorData.details;
    throw error;
  }
};

const deletePostBatch = async (slugs: string[], accessToken: string): Promise<void> => {
  const response = await fetch("/api/posts", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ slugs }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || "Failed to delete posts") as Error & { details?: string };
    error.details = errorData.details;
    throw error;
  }
};

export const usePostMutations = () => {
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: ({ postData, accessToken }: { postData: CreatePostData; accessToken: string }) =>
      createPost(postData, accessToken),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.admin() });
      toast.success("Post created successfully");
      return data;
    },
    onError: (error: Error & { details?: string }) => {
      const description = error.details ? `${error.message} ${error.details}` : error.message;
      toast.error("Failed to create post", {
        description,
      });
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: ({ slug, accessToken }: { slug: string; accessToken: string }) =>
      deletePost(slug, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.admin() });
      toast.success("Post deleted successfully");
    },
    onError: (error: Error & { details?: string }) => {
      const description = error.details ? `${error.message} ${error.details}` : error.message;
      toast.error("Failed to delete post", {
        description,
      });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: ({ slugs, accessToken }: { slugs: string[]; accessToken: string }) =>
      deletePostBatch(slugs, accessToken),
    onSuccess: (_, { slugs }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.admin() });
      toast.success(`${slugs.length} posts deleted successfully`);
    },
    onError: (error: Error & { details?: string }) => {
      const description = error.details ? `${error.message} ${error.details}` : error.message;
      toast.error("Failed to delete posts", {
        description,
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ slug, postData, accessToken }: { slug: string; postData: UpdatePostData; accessToken: string }) =>
      updatePost(slug, postData, accessToken),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.admin() });
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.slug) });
      toast.success("Post updated successfully");
      return data;
    },
    onError: (error: Error & { details?: string }) => {
      const description = error.details ? `${error.message} ${error.details}` : error.message;
      toast.error("Failed to update post", {
        description,
      });
    },
  });

  return {
    createPost: createPostMutation,
    updatePost: updatePostMutation,
    deleteOne: deleteOneMutation,
    deleteMany: deleteManyMutation,
  };
};
