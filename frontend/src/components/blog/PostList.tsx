"use client";

import { useQuery } from "@tanstack/react-query";
import { postQueries } from "@/lib/queries/posts";
import BlogPostCard from "./BlogPostCard";
import Pagination from "./Pagination";

export default function PostList() {
  const { data: posts } = useQuery(postQueries.list());

  if (!posts) {
    // This should ideally not be reached if using Suspense, but as a fallback
    return <div>No posts found.</div>;
  }

  return (
    <div className="lg:col-span-2 space-y-12">
      {posts.map((post, index) => (
        <BlogPostCard
          key={post.slug}
          post={post}
          isFeatured={index % 2 === 0}
        />
      ))}
      <Pagination currentPage={1} totalPages={8} basePath="/blog/page" />
    </div>
  );
}
