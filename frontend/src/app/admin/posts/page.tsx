"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { postQueries } from "@/lib/queries/posts";
import PostsDataTable from "@/components/admin/PostsDataTable";
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

  return <PostsDataTable posts={posts} isLoading={isLoading} isError={isError} error={error} />;
}
