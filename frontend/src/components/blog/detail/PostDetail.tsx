"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { postQueries } from "@/lib/queries/posts";
import { Clock, Calendar, User, ArrowLeft } from "lucide-react";

interface PostDetailProps {
  slug: string;
}

const PostDetail: React.FC<PostDetailProps> = ({ slug }) => {
  const { data: post, isLoading, error, isError } = useQuery(postQueries.detail(slug));

  if (isLoading) {
    return null; // Let the parent Suspense handle the loading
  }

  // Only show error if we actually have an error and it's a real 404 or network issue
  if (isError && error) {
    console.error('Post fetch error:', error);
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">
            The post you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // If we don't have a post but no error, keep loading
  if (!post) {
    return null; // Let the parent Suspense handle the loading
  }

  const displayDate = post.publishDate || post.createdAt;

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Navigation */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-pink-600 hover:text-pink-700 px-2 py-1 rounded transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
          {(post.author || post.authorName) && (
            <div className="flex items-center">
              {post.author?.imageUrl && (
                <Image
                  src={post.author.imageUrl}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full mr-3"
                />
              )}
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>
                  By{" "}
                  {post.author ? (
                    <Link
                      href={`/author/${post.author.slug}`}
                      className="text-pink-600 font-medium hover:underline"
                    >
                      {post.author.name}
                    </Link>
                  ) : (
                    <span className="text-pink-600 font-medium">
                      {post.authorName}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {new Date(displayDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {post.readTimeMinutes && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{post.readTimeMinutes} min read</span>
            </div>
          )}

          {post.category && (
            <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-medium">
              {post.category}
            </span>
          )}
        </div>
      </header>

      {/* Featured Image */}
      {post.thumbnailURL && (
        <div className="relative h-64 md:h-96 mb-8 rounded-xl overflow-hidden">
          <Image
            src={post.thumbnailURL}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Post Content */}
      <div className="prose prose-lg max-w-none">
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </div>
    </article>
  );
};

export default PostDetail;