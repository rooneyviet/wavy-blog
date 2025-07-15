import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import getQueryClient from "@/lib/get-query-client";
import { postQueries } from "@/lib/queries/posts";
import { api } from "@/lib/api/server";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PostDetail from "@/components/blog/detail/PostDetail";
import SimplePostSkeleton from "@/components/blog/detail/SimplePostSkeleton";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  try {
    const post = await api.getPostBySlug(slug);
    
    const displayDate = post.publishDate || post.createdAt;
    
    return {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160) + "...",
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160) + "...",
        type: "article",
        publishedTime: displayDate,
        authors: post.author ? [post.author.name] : [],
        images: post.thumbnailURL ? [
          {
            url: post.thumbnailURL,
            width: 1200,
            height: 630,
            alt: post.title,
          }
        ] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160) + "...",
        images: post.thumbnailURL ? [post.thumbnailURL] : [],
      },
    };
  } catch {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const queryClient = getQueryClient();

  // Try to prefetch the post data, but don't fail the entire page if it errors
  // Let the client-side query handle the error gracefully
  try {
    await queryClient.prefetchQuery(postQueries.detail(slug));
  } catch (error) {
    // Log the error but don't block the page rendering
    console.warn(`Failed to prefetch post ${slug}:`, error);
    // Don't call notFound() here - let the client handle it
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-pink-50">
        <HydrationBoundary state={dehydratedState}>
          <Suspense fallback={<SimplePostSkeleton />}>
            <PostDetail slug={slug} />
          </Suspense>
        </HydrationBoundary>
      </main>
      <Footer />
    </>
  );
}


