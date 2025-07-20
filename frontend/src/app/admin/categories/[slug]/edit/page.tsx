"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { FolderOpen, Save, ArrowLeft, Trash2, Eye } from "lucide-react";
import Link from "next/link";
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Category not found
            </p>
            <p className="text-gray-600">
              {error instanceof Error
                ? error.message
                : "Unknown error occurred"}
            </p>
          </div>
          <Link href="/admin/categories">
            <Button className="subscribe-button text-white hover:opacity-90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4"></div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Posts
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-pink-600" />
                Edit Category
              </CardTitle>
              <CardDescription className="text-gray-600">
                Update the information for this category
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Category Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter category name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={updateCategoryMutation.isPending}
                  className="border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500">
                  Choose a clear, descriptive name for your category
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what type of content belongs in this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={updateCategoryMutation.isPending}
                  className="border-gray-200 focus:border-pink-500 focus:ring-pink-500 resize-none"
                />
                <p className="text-xs text-gray-500">
                  Help your readers understand what this category contains
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="slug"
                  className="text-sm font-medium text-gray-700"
                >
                  Category Slug
                </Label>
                <Input
                  id="slug"
                  type="text"
                  value={category?.slug || ""}
                  disabled
                  className="bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">
                  The slug cannot be changed after creation
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-6">
              <div className="flex gap-3 w-full">
                <Button
                  type="submit"
                  className="flex-1 subscribe-button text-white hover:opacity-90 font-medium py-3 flex items-center justify-center gap-2"
                  disabled={updateCategoryMutation.isPending}
                >
                  {updateCategoryMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Category
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
