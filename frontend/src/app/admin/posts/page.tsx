"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { postQueries } from "@/lib/queries/posts";
import { categoryQueries } from "@/lib/queries/categories";
import PostsDataTable from "@/components/admin/PostsDataTable";
import { useAuthStore } from "@/stores/authStore";

export default function ListPostsPage() {
  const { accessToken } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Read filters from URL parameters
  const filters = {
    postName: searchParams.get('postName') || "",
    categorySlug: searchParams.get('categorySlug') || "",
    pageSize: parseInt(searchParams.get('pageSize') || '20'),
    pageIndex: parseInt(searchParams.get('pageIndex') || '1'),
  };
  
  const {
    data: postsData,
    isLoading,
    isError,
    error,
  } = useQuery(postQueries.admin(accessToken || "", filters));

  // Fetch categories for the dropdown
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery(categoryQueries.list());

  const posts = postsData?.posts || [];
  const total = postsData?.total || 0;
  const currentPageIndex = postsData?.pageIndex || 1;
  const currentPageSize = postsData?.pageSize || 20;

  const updateUrlParams = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "" && value !== 0) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when filters change (except when explicitly changing page)
    if (!('pageIndex' in newFilters)) {
      params.set('pageIndex', '1');
    }
    
    router.push(`/admin/posts?${params.toString()}`);
  };

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    updateUrlParams(newFilters);
  };

  const handlePageChange = (pageIndex: number) => {
    updateUrlParams({ pageIndex });
  };

  const handleSearch = (postName: string) => {
    updateUrlParams({ postName });
  };

  return (
    <PostsDataTable 
      posts={posts} 
      isLoading={isLoading} 
      isError={isError} 
      error={error}
      filters={filters}
      categories={categories}
      categoriesLoading={categoriesLoading}
      onFiltersChange={handleFiltersChange}
      onSearch={handleSearch}
      pagination={{
        total,
        pageIndex: currentPageIndex,
        pageSize: currentPageSize,
        onPageChange: handlePageChange,
      }}
    />
  );
}
