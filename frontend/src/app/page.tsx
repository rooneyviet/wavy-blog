import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import getQueryClient from "@/lib/get-query-client";
import { postQueries } from "@/lib/queries/posts";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/sidebar/Sidebar";
import PostList from "@/components/blog/PostList";
import PostListSkeleton from "@/components/blog/PostListSkeleton";
import { Post, Author } from "@/types";

// Define a more specific type for the author prop for AboutMeWidget, matching Sidebar.tsx
interface AboutMeAuthor extends Author {
  title: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    website?: string;
  };
}

// TODO: This dummy data should be fetched from the API
const aboutMeAuthorData: AboutMeAuthor = {
  name: "Adriana Martins",
  slug: "adriana-martins",
  title: "Founder & Editor",
  bio: "Hello! My name is Adriana Martins working from Chile. I create some Ghost and Wordpress themes for different markets, also, I offer live support via our ticket system.",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDxktR3n6qAajniI0otFjnBDBjvK2zxiRH6ZinsEHE-csDY9ZzIzAauAhVOUsuxUsByzDOM7g5NfZcLemDWH3WCHkvnxOHPFIyQ9cNIN3bTGozriQYjhTXzuMwN0mRTlLTj5h6zOn5C41yG2a0mm8nPedftFaNLwsvYc1RZj4FY36qgsGEu_rQxQOqX58joQKtyFi2hP_305ScPGhTM2uiOuWvPYHsuQwGHxi3lZ9dnyHOFZVA_zcLEhCJZaHxXVr6WDUXGdsfbHWV8",
  socialLinks: {
    twitter: "#",
    facebook: "#",
    website: "#",
  },
};

// TODO: This dummy data should be fetched from the API
const popularArticlesData: Pick<
  Post,
  "slug" | "title" | "thumbnailURL" | "publishDate"
>[] = [
  {
    slug: "modern-colorful-caricatures-ai",
    title: "Modern and colorful style of caricatures created by AI",
    thumbnailURL:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgJEb0ceOInL65KT5afmFQkeFUGWLrJPu31CtEQWu484OS1N5KaPX3Fdm4IxiMnaGa2mwnvzEa8sR7zTLqciiG12oZH78ZtY08upwEZkpYD5ATSlY6Mba0sVLihDmSQY5PiMiZWQwOrFYgoFk9sfsJtd2DaGBhx7hQgQYDt8tPxFZmVdPxHnYNvX4UeznZzZSYYpI1E-iUn_nFBd4aRVaE-TZ0wtYT3ctRUPNgmdJZzk4dwo9HRrAHGWVSXL3IMsSYKaxxQs_aDgrq",
    publishDate: "2023-10-21T00:00:00.000Z",
  },
  {
    slug: "effective-remote-work-schedules",
    title: "More effective schedules in remote work",
    thumbnailURL:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiKYnXhgW96WPQA6lSgTEXK0kqbEXMe9vZL3e_tG8wPkqm6M57w1xzSkQmTiyzTLGYwtk63VGJuMR6o_cf74sqK0gYgQDA3cdhP6DkYa4kLCIatT0GS7qoKyJCaPeWrLK_AylaH4t9C_49Jt55M4TUy4OpOpriwlPJQIHDjIwOE5QU7BagWjFDJs4UQIDs1owcvDiQlMgdyHxc1SwLr6EN3H1cYVaPT3nNH1v_20fp3pdfLNTrkUSES6NM8ZrBURbFaUuoRPwym6Y2",
    publishDate: "2023-10-21T00:00:00.000Z",
  },
  {
    slug: "future-web-development-trends",
    title: "The Future of Web Development: Trends to Watch",
    thumbnailURL:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjzy8PlObq6EQ2kXiXb5SRNRDbf_76ZovS4C8NraX4l6vzRV8ScKEuyEWK6Bvcd3Z_xaFx6C5rP-SCtDwJl7tUfIxLu9RvhHGywnUiXOLykDP5ZUvW6D51YUm-tW7vcqoOlC5i8M7EHDc0ssFrs_rLsOkyUYiD2rHJyu0CA-ExPDLBjfZ7VYGxsp5vX6N-3bjZ4cd-AAzAVtEhFZXHD9tXWMcsWDSbYNGOHnVGEk_wcKsAARSAqpahPoMjsyWPr37baWXPmyMivK7T",
    publishDate: "2023-11-05T00:00:00.000Z",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const queryClient = getQueryClient();

  const params = await searchParams;
  const pageIndex = parseInt(String(params.pageIndex ?? "1"), undefined);
  const pageSize = parseInt(String(params.pageSize ?? "20"), undefined);

  await queryClient.prefetchQuery(
    postQueries.list(pageSize, pageIndex, "published")
  );
  const dehydratedState = dehydrate(queryClient);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <HydrationBoundary state={dehydratedState}>
            <Suspense fallback={<PostListSkeleton />}>
              <PostList />
            </Suspense>
          </HydrationBoundary>
          <Sidebar
            authorData={aboutMeAuthorData}
            popularArticles={popularArticlesData}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
