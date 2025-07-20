"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { FolderOpen, Save } from "lucide-react";
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
import { categoryKeys } from "@/lib/queries/categories";
import { toast } from "sonner";

interface CreateCategoryData {
  name: string;
  description?: string;
}

export default function AddCategoryPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(
          errorData.error || "Failed to create category"
        ) as Error & { details?: string };
        error.details = errorData.details;
        throw error;
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Category created successfully!");
      // Redirect to edit page after successful creation
      router.push(`/admin/categories/${data.slug}/edit`);
    },
    onError: (error: Error & { details?: string }) => {
      const message = error.details
        ? `${error.message} ${error.details}`
        : error.message;
      toast.error(message || "Failed to create category");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    createCategoryMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-pink-600" />
                Create New Category
              </CardTitle>
              <CardDescription className="text-gray-600">
                Create a new category for organizing your blog posts
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
                  placeholder="e.g., Technology, Travel, Lifestyle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={createCategoryMutation.isPending}
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
                  disabled={createCategoryMutation.isPending}
                  className="border-gray-200 focus:border-pink-500 focus:ring-pink-500 resize-none"
                />
                <p className="text-xs text-gray-500">
                  Help your readers understand what this category contains
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-6">
              <div className="flex gap-3 w-full">
                <Button
                  type="submit"
                  className="flex-1 subscribe-button text-white hover:opacity-90 font-medium py-3 flex items-center justify-center gap-2"
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Category
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
