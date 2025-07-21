"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { postQueries } from "@/lib/queries/posts";
import { Post } from "@/types";
import BlogPostCard from "./BlogPostCard";
import DataPagination from "@/components/ui/DataPagination";

export default function PostList() {
  const searchParams = useSearchParams();
  
  // Get values directly from URL params (1-based indexing)
  const pageIndex = parseInt(searchParams.get('page') || '1'); // Default to page 1
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const { data: response } = useQuery(postQueries.list(pageSize, pageIndex, "published"));

  if (!response) {
    // This should ideally not be reached if using Suspense, but as a fallback
    return (
      <div className="lg:col-span-2 space-y-12">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts found.</p>
        </div>
      </div>
    );
  }

  const { posts, pageSize: responsePageSize, pageIndex: responsePageIndex, total } = response;

  // Transform the response to match the generic pagination interface
  const paginationData = {
    items: posts,
    pageSize: responsePageSize,
    pageIndex: responsePageIndex,
    total,
  };

  return (
    <div className="lg:col-span-2 space-y-12">
      {posts.length > 0 ? (
        <>
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
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts found.</p>
        </div>
      )}
    </div>
  );
}
