"use client";

import React from "react";
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

// Import sub-components (will be created next)
import TitleInput from "@/components/admin/posts/add/TitleInput";
import ContentEditor from "@/components/admin/posts/add/ContentEditor";
import CategorySelector from "@/components/admin/posts/add/CategorySelector";
import ThumbnailUpload from "@/components/admin/posts/add/ThumbnailUpload";

export default function AddPostPage() {
  const { title, content, selectedCategoryIds, thumbnailImage, resetForm } =
    useAddPostStore();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Actual submission logic will go here
    console.log("Submitting post:", {
      title,
      content,
      categories: selectedCategoryIds,
      thumbnail: thumbnailImage?.name || "No image",
    });
    alert("Post submitted (see console for data). Form will reset.");
    resetForm();
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
            <CardContent>
              <CategorySelector />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white subscribe-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 h-auto"
              >
                Publish Post
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}
