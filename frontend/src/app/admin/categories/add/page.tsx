"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
        const error = new Error(errorData.error || "Failed to create category") as Error & { details?: string };
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
      const message = error.details ? `${error.message} ${error.details}` : error.message;
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

  const handleReset = () => {
    setName("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full border-0">
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
            <CardDescription>
              Create a new category for organizing your blog posts.
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
                disabled={createCategoryMutation.isPending}
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
                disabled={createCategoryMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Provide a brief description of what this category is for.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 subscribe-button text-white hover:opacity-90"
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={createCategoryMutation.isPending}
            >
              Reset
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}