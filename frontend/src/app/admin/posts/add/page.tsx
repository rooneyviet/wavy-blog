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
import { FileText, Save } from "lucide-react";

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
  const FIXED_THUMBNAIL_URL =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDxktR3n6qAajniI0otFjnBDBjvK2zxiRH6ZinsEHE-csDY9ZzIzAauAhVOUsuxUsByzDOM7g5NfZcLemDWH3WCHkvnxOHPFIyQ9cNIN3bTGozriQYjhTXzuMwN0mRTlLTj5h6zOn5C41yG2a0mm8nPedftFaNLwsvYc1RZj4FY36qgsGEu_rQxQOqX58joQKtyFi2hP_305ScPGhTM2uiOuWvPYHsuQwGHxi3lZ9dnyHOFZVA_zcLEhCJZaHxXVr6WDUXGdsfbHWV8";

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
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-600" />
                  Create New Post
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Write and publish a new blog post
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <TitleInput />
                <ThumbnailUpload />
                <ContentEditor />
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar (Right) */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Save className="w-5 h-5 text-pink-600" />
                  Publish Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <StatusSelector />
                <CategorySelector />
              </CardContent>
              <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-6">
                <div className="w-full space-y-3">
                  <Button
                    type="submit"
                    disabled={createPost.isPending}
                    className="w-full subscribe-button text-white hover:opacity-90 font-medium py-3 flex items-center justify-center gap-2"
                  >
                    {createPost.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Publish Post
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Your post will be{" "}
                    {status === "published"
                      ? "published immediately"
                      : "saved as draft"}
                  </p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
