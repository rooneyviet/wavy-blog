"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { postQueries } from "@/lib/queries/posts";

// Import sub-components
import TitleInput from "@/components/admin/posts/add/TitleInput";
import ContentEditor from "@/components/admin/posts/add/ContentEditor";
import CategorySelector from "@/components/admin/posts/add/CategorySelector";
import ThumbnailUpload from "@/components/admin/posts/add/ThumbnailUpload";
import StatusSelector from "@/components/admin/posts/add/StatusSelector";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params.slug as string) || "";
  const {
    title,
    content,
    selectedCategorySlug,
    status,
    setTitle,
    setContent,
    setStatus,
    selectCategorySlug,
  } = useAddPostStore();
  const { accessToken } = useAuthStore();
  const { updatePost } = usePostMutations();

  // Fixed thumbnail URL as requested
  const FIXED_THUMBNAIL_URL =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDxktR3n6qAajniI0otFjnBDBjvK2zxiRH6ZinsEHE-csDY9ZzIzAauAhVOUsuxUsByzDOM7g5NfZcLemDWH3WCHkvnxOHPFIyQ9cNIN3bTGozriQYjhTXzuMwN0mRTlLTj5h6zOn5C41yG2a0mm8nPedftFaNLwsvYc1RZj4FY36qgsGEu_rQxQOqX58joQKtyFi2hP_305ScPGhTM2uiOuWvPYHsuQwGHxi3lZ9dnyHOFZVA_zcLEhCJZaHxXVr6WDUXGdsfbHWV8";

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    ...postQueries.detail(slug),
    enabled: !!slug,
  });

  // Populate form with existing post data
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setStatus(post.status || "published");
      selectCategorySlug(post.category); // Set the category
    }
  }, [post, setTitle, setContent, setStatus, selectCategorySlug]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!accessToken) {
      alert("Please log in to update the post");
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
      const result = await updatePost.mutateAsync({
        slug,
        postData,
        accessToken,
      });
      // Navigate to the new slug if it changed
      if (result.slug !== slug) {
        router.push(`/admin/posts/${result.slug}/edit`);
      }
    } catch {
      // Error handling is already done in the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-600">Post not found</p>
          <Button onClick={() => router.push("/admin/posts")} className="mt-4">
            Back to Posts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <p className="text-gray-600">Update your post details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full border-0">
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>
                  Update the main content of your post.
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
                <CardTitle>Update</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusSelector />
                <CategorySelector />
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={updatePost.isPending}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white subscribe-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 h-auto disabled:opacity-50"
                >
                  {updatePost.isPending ? "Updating..." : "Update Post"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
