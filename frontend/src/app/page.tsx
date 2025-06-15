import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BlogPostCard from "@/components/blog/BlogPostCard";
import Pagination from "@/components/blog/Pagination";
import Sidebar from "@/components/sidebar/Sidebar";
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

// Sample Data
const sampleAuthor: Author = {
  name: "Adriana Martins",
  slug: "adriana-martins",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCwx6fRcrJcvDAulDfM4v6SkYmLmYMGFoy4f8oa9bNZ6LMdnsdlganpw7UrfMNOzGWvBq6NLqO9fmrcX50mtADQIh4dpA5WAY74C5cmavujebQVlqH3YFXYfhqP6t4UPU6rA5uygnpcZLQKidWZcCR6Q1y-h35lVa0aqBgc7CyUWqhTHVpSWZ3g-ezXNjIuLYOzYR-c3UX3FOfT6t-TXviBvX-IVbi6C3ycCPoNedZjZWhOq3GX2mS5m6SUUMg0YIbecrRsRVf_evNd",
};

const sampleAuthorJohn: Author = {
  name: "John Doe",
  slug: "john-doe",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDruqQOJzOHt_xmxUGs-Enaqz4txX9nOmd5bkx0B9rYn4rVNF6NRtbhaai4Sd14Y2PQWgVlvYCGRquyp2Jr_HvJsWl9SvmShIZU1Y9OvcuTYkw4uxS4AZ7Lo3ECyivXw7CYt6wT7NxLahcSzlWb5KNGGW-mTEhdOMGwid5ly8-eGir3kN-vt__b01SBtg8rhnq8HgPFr_jdJ070X8V55Ei-Ei6Y1n9a_qlTB84tkkFgQ0aKbF_j9sfJOnP0Z0sL9bQCyDNcz5UP2ynN",
};

const sampleAuthorJane: Author = {
  name: "Jane Smith",
  slug: "jane-smith",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCyd_nkbCHqdZLzYXmuqsKPdGSZ_lXXxBapu5JVRaZMsjP_sM9_loLzf6XnC7mHLM3S8ogCLpbuSqAi7tDNio182OA0WtM72atnOE2jZWB9mcl-I86d_V0y4agTkNFK1IIzv3AiFEXwhoY3iMbUAcF2IghxSskwfZQoKJaInqhl-69ImWuTFUmmNJtfdGqP0P6HX4cG087mCgvkCm7bJ8W8Vw_EvJK99hcuBHKVeiOeKSOKoRtks2mdIiC-X_vMxPiez75iAiUVAXkZ",
};

const samplePosts: Post[] = [
  {
    id: "1",
    slug: "modern-colorful-caricatures-ai",
    title: "Modern and colorful style of caricatures created by AI",
    excerpt:
      "Caricatures have long been a beloved form of art and satire. With the advent of artificial intelligence (AI), the world...",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDR5l9GFdHjklxQjBkBA_i9i7Y4pU2xZfITv710N4cTCzFp8YdwF5_2S2AH7BlkZ7n3uor9_YAIY8hsAzYywmu1BQXPt5lmKGNYS3pOs5D5CfX0YMF9u9KJHIxjGpUMqHBelN7-G37UyDfEKbqNZz6_vKWOHBK12mIfbizhr-VTGL_inEFEpKNxlHBzsjvT1X8tHcz-ARrhBggpWLFaYGoMmR0oofRp-XWD2UIQTK5KBlceDNPU_yO8PtwuyPPiQr-bvogtuOOxhhVX",
    publishDate: "2023-10-21T00:00:00.000Z",
    author: sampleAuthor,
    readTimeMinutes: 1,
  },
  {
    id: "2",
    slug: "effective-remote-work-schedules",
    title: "More effective schedules in remote work",
    excerpt:
      "Remote work has become increasingly prevalent, requiring individuals to adapt and develop more efficient schedules to maintain productivity and work-life...",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuoLQle3YpwWk9zq3dB6fqm8u3qZr0SaLAongK9Q31UReSRm48e5oMtv_46l6-QvzYw-1Dejs93pKyFvZFLB68NscrUbIMpA8iemrvjLWbaSPhGeY1WCt132_87AdRxQQ1q4_Je68wzEvDWyaIhauWXEAnbvUK3wRkIxpQ1tDEz-CU4JXBm83qDiIE-fWEI1xkOA-N02P0RpMMIiFCYXt2szyaWDbXyM0DDN7CsTgzJd0-Ablyu_hyajPdQ3TiNWAEvRlPrqwh67-s",
    publishDate: "2023-10-21T00:00:00.000Z",
    author: sampleAuthor,
    readTimeMinutes: 1,
  },
  {
    id: "3",
    slug: "future-web-development-trends",
    title: "The Future of Web Development: Trends to Watch",
    excerpt:
      "Web development is an ever-evolving field. Stay ahead of the curve by learning about the latest trends and technologies shaping the future...",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBmCxByFeX-r_hwAb6Xa4yQYp6avuEqsTSkymQtF16V2HB9ErOFRhBQB7ZxUNLfvUZ03eWgYLXVnn3_HjiaTXhsbQPOGsIzN0V9c8S45sSnW_ygQ2UO7CpzHMox73aLNkPm26L-5JB9sKYJnKypbmvie3X2iAErY78GV5V-IvDqwPKRNDTqQLosASRS5t5zuJYZQDltn-szNVrPZ-tIYdp-ZXfp381zejAChztJKcd7dEmIsbykib9HNkIijH6RXpvbdGfG-GcOukXS",
    publishDate: "2023-11-05T00:00:00.000Z",
    author: sampleAuthorJohn,
    readTimeMinutes: 3,
  },
  {
    id: "4",
    slug: "mindfulness-productivity-balance",
    title: "Mindfulness and Productivity: Finding Balance",
    excerpt:
      "Discover how incorporating mindfulness practices into your daily routine can significantly boost your productivity and overall well-being...",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnUsOpTaq91YHg5ZlPWcymYg_gxQMJo8y69KLQFj-TuOFAZry7bRCTVBdD856Rjo5KNo1d3dRJOIuML2-FezDEZ4wPbvzce6FM5dLKmn7yNPkynj6b7XsW0UciRGERj_3UK3ZPFbxggoSu0JukgCsKjP8iKNkNNxDdfO0ErWM_tiAx0gYiC2Xy_N0PfDyz7VONtJr6g7a9l4cTrQP4Dc9CBBcMynbwZO8ytQbjL7K3AyUCJEIDL0silDRApDZ1wgYVMiKg0OMk5-_A",
    publishDate: "2023-11-12T00:00:00.000Z",
    author: sampleAuthorJane,
    readTimeMinutes: 2,
  },
];

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

const popularArticlesData: Pick<
  Post,
  "slug" | "title" | "imageUrl" | "publishDate"
>[] = [
  {
    slug: "modern-colorful-caricatures-ai",
    title: "Modern and colorful style of caricatures created by AI",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgJEb0ceOInL65KT5afmFQkeFUGWLrJPu31CtEQWu484OS1N5KaPX3Fdm4IxiMnaGa2mwnvzEa8sR7zTLqciiG12oZH78ZtY08upwEZkpYD5ATSlY6Mba0sVLihDmSQY5PiMiZWQwOrFYgoFk9sfsJtd2DaGBhx7hQgQYDt8tPxFZmVdPxHnYNvX4UeznZzZSYYpI1E-iUn_nFBd4aRVaE-TZ0wtYT3ctRUPNgmdJZzk4dwo9HRrAHGWVSXL3IMsSYKaxxQs_aDgrq",
    publishDate: "2023-10-21T00:00:00.000Z",
  },
  {
    slug: "effective-remote-work-schedules",
    title: "More effective schedules in remote work",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiKYnXhgW96WPQA6lSgTEXK0kqbEXMe9vZL3e_tG8wPkqm6M57w1xzSkQmTiyzTLGYwtk63VGJuMR6o_cf74sqK0gYgQDA3cdhP6DkYa4kLCIatT0GS7qoKyJCaPeWrLK_AylaH4t9C_49Jt55M4TUy4OpOpriwlPJQIHDjIwOE5QU7BagWjFDJs4UQIDs1owcvDiQlMgdyHxc1SwLr6EN3H1cYVaPT3nNH1v_20fp3pdfLNTrkUSES6NM8ZrBURbFaUuoRPwym6Y2",
    publishDate: "2023-10-21T00:00:00.000Z",
  },
  {
    slug: "future-web-development-trends",
    title: "The Future of Web Development: Trends to Watch",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjzy8PlObq6EQ2kXiXb5SRNRDbf_76ZovS4C8NraX4l6vzRV8ScKEuyEWK6Bvcd3Z_xaFx6C5rP-SCtDwJl7tUfIxLu9RvhHGywnUiXOLykDP5ZUvW6D51YUm-tW7vcqoOlC5i8M7EHDc0ssFrs_rLsOkyUYiD2rHJyu0CA-ExPDLBjfZ7VYGxsp5vX6N-3bjZ4cd-AAzAVtEhFZXHD9tXWMcsWDSbYNGOHnVGEk_wcKsAARSAqpahPoMjsyWPr37baWXPmyMivK7T",
    publishDate: "2023-11-05T00:00:00.000Z",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {samplePosts.map((post, index) => (
              <BlogPostCard
                key={post.id}
                post={post}
                isFeatured={index % 2 === 0}
              />
            ))}
            <Pagination currentPage={1} totalPages={8} basePath="/blog/page" />
          </div>
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
