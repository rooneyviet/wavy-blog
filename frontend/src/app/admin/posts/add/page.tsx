"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { useAddPostStore } from "@/stores/addPostStore";
import { usePostMutations } from "@/lib/queries/posts";
import { useAuthStore } from "@/stores/authStore";

// Import sub-components (will be created next)
import TitleInput from "@/components/admin/posts/add/TitleInput";
import ContentEditor from "@/components/admin/posts/add/ContentEditor";
import CategorySelector from "@/components/admin/posts/add/CategorySelector";
import ThumbnailUpload from "@/components/admin/posts/add/ThumbnailUpload";
import StatusSelector from "@/components/admin/posts/add/StatusSelector";

export default function AddPostPage() {
  const { title, content, selectedCategorySlug, status, resetForm } =
    useAddPostStore();
  const { accessToken } = useAuthStore();
  const { createPost } = usePostMutations();
  const router = useRouter();

  // Fixed thumbnail URL as requested
  const FIXED_THUMBNAIL_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuDxktR3n6qAajniI0otFjnBDBjvK2zxiRH6ZinsEHE-csDY9ZzIzAauAhVOUsuxUsByzDOM7g5NfZcLemDWH3WCHkvnxOHPFIyQ9cNIN3bTGozriQYjhTXzuMwN0mRTlLTj5h6zOn5C41yG2a0mm8nPedftFaNLwsvYc1RZj4FY36qgsGEu_rQxQOqX58joQKtyFi2hP_305ScPGhTM2uiOuWvPYHsuQwGHxi3lZ9dnyHOFZVA_zcLEhCJZaHxXVr6WDUXGdsfbHWV8";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!accessToken) {
      alert("Please log in to create a post");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!content.trim()) {
      alert("Please enter content");
      return;
    }

    if (!selectedCategorySlug) {
      alert("Please select a category");
      return;
    }

    const postData = {
      title: title.trim(),
      content: content.trim(),
      categorySlug: selectedCategorySlug,
      thumbnailURL: FIXED_THUMBNAIL_URL,
      status,
    };

    try {
      const result = await createPost.mutateAsync({ postData, accessToken });
      resetForm();
      // Redirect to edit page after successful creation
      router.push(`/admin/posts/${result.slug}/edit`);
    } catch {
      // Error handling is already done in the mutation
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full border-0">
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
              <CardDescription>
                Fill in the main content of your post.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TitleInput />
              <ThumbnailUpload />
              <ContentEditor />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full border-0">
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusSelector />
              <CategorySelector />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={createPost.isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white subscribe-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 h-auto disabled:opacity-50"
              >
                {createPost.isPending ? "Creating..." : "Publish Post"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}
