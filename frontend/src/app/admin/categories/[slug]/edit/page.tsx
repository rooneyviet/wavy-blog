"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { categoryKeys, categoryQueries } from "@/lib/queries/categories";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

interface UpdateCategoryData {
  name: string;
  description?: string;
}

export default function EditCategoryPage() {
  const params = useParams();
  const slug = (params.slug as string) || "";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  // Fetch category data
  const {
    data: category,
    isLoading,
    isError,
    error,
  } = useQuery(categoryQueries.detail(slug));

  // Pre-fill form when category data is loaded
  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
    }
  }, [category]);

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: UpdateCategoryData) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/categories/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(
          errorData.error || "Failed to update category"
        ) as Error & { details?: string };
        error.details = errorData.details;
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Category updated successfully!");
      // Stay on the edit page after successful update
    },
    onError: (error: Error & { details?: string }) => {
      const message = error.details
        ? `${error.message} ${error.details}`
        : error.message;
      toast.error(message || "Failed to update category");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    updateCategoryMutation.mutate({
      name: name.trim(),
      description: description.trim(),
    });
  };

  const handleReset = () => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading category..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load category</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <Button
            onClick={() => router.push("/admin/categories")}
            className="mt-4"
            variant="outline"
          >
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full border-0">
          <CardHeader>
            <CardTitle>Edit Category</CardTitle>
            <CardDescription>
              Update the category information for {category?.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={updateCategoryMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter category description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={updateCategoryMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Provide a brief description of what this category is for.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Category Slug</Label>
              <Input
                id="slug"
                type="text"
                value={category?.slug || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                The slug cannot be changed after creation.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 subscribe-button text-white hover:opacity-90"
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending
                ? "Updating..."
                : "Update Category"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={updateCategoryMutation.isPending}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/categories")}
              disabled={updateCategoryMutation.isPending}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
