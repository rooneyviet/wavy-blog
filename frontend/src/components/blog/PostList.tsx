"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { postQueries } from "@/lib/queries/posts";
import { Post } from "@/types";
import BlogPostCard from "./BlogPostCard";
import DataPagination from "@/components/ui/DataPagination";

export default function PostList() {
  const searchParams = useSearchParams();
  
  // Get values directly from URL params (URL is 1-based, convert to 0-based for backend)
  const urlPage = parseInt(searchParams.get('page') || '1'); // Default to page 1 in URL
  const pageIndex = urlPage - 1; // Convert to 0-based for backend
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  const { data: response } = useQuery(postQueries.list(pageSize, pageIndex));

  if (!response) {
    // This should ideally not be reached if using Suspense, but as a fallback
    return <div>No posts found.</div>;
  }

  const { posts, pageSize: responsePageSize, pageIndex: responsePageIndex, hasNextPage } = response;

  // Transform the response to match the generic pagination interface
  const paginationData = {
    items: posts,
    pageSize: responsePageSize,
    pageIndex: responsePageIndex,
    hasNextPage,
  };

  return (
    <div className="lg:col-span-2 space-y-12">
      {posts.map((post, index) => (
        <BlogPostCard
          key={post.slug}
          post={post}
          isFeatured={index % 2 === 0}
        />
      ))}
      
      <DataPagination<Post> 
        data={paginationData} 
        className="mt-8" 
      />
    </div>
  );
}
