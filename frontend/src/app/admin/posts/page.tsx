import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import getQueryClient from "@/lib/get-query-client";
import { postQueries } from "@/lib/queries/posts";
import PostsDataTable from "@/components/admin/PostsDataTable";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default async function ListPostsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(postQueries.list());
  const dehydratedState = dehydrate(queryClient);

  // Get the posts data from the query client
  const postsData = queryClient.getQueryData(postQueries.list().queryKey);
  const posts = postsData?.posts || [];

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <PostsDataTable posts={posts} />
      </Suspense>
    </HydrationBoundary>
  );
}
