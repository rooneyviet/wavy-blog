/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, Save, ArrowLeft, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
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
      setStatus(post.status);
      selectCategorySlug(post.category);
    }
  }, [post]);

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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Post not found
            </p>
            <p className="text-gray-600">
              The post you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
          </div>
          <Link href="/admin/posts">
            <Button className="subscribe-button text-white hover:opacity-90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Posts
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
          <Link href={`/blog/${post.slug}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </Link>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-600" />
                  Edit Post
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Update your post content and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 space-y-6">
                <TitleInput />
                <ThumbnailUpload />
                <ContentEditor />
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar (Right) */}
          <div className="space-y-6">
            {/* Update Settings */}
            <Card className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Save className="w-5 h-5 text-pink-600" />
                  Update Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 space-y-4">
                <StatusSelector />
                <CategorySelector />
              </CardContent>
              <CardFooter className="bg-gray-50/50 border-t border-gray-100 px-6">
                <div className="w-full space-y-3">
                  <Button
                    type="submit"
                    disabled={updatePost.isPending}
                    className="w-full subscribe-button text-white hover:opacity-90 font-medium py-3 flex items-center justify-center gap-2"
                  >
                    {updatePost.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Post
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Changes will be{" "}
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
