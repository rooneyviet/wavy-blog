"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { postQueries } from "@/lib/queries/posts";
import PostsDataTable from "@/components/admin/PostsDataTable";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useAuthStore } from "@/stores/authStore";

export default function ListPostsPage() {
  const { accessToken } = useAuthStore();
  
  const {
    data: postsData,
    isLoading,
    isError,
    error,
  } = useQuery(postQueries.admin(accessToken || ""));

  const posts = postsData?.posts || [];

  if (isLoading) {
    return (
      <TableSkeleton 
        columns={["", "Title", "Author", "Category", "Publish Date", "Status", ""]} 
        rows={5}
        title="Posts"
      />
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load posts</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return <PostsDataTable posts={posts} />;
}
