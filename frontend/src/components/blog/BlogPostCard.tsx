import Image from "next/image";
import Link from "next/link";
import { Post } from "@/types";
import { Clock } from "lucide-react"; // Assuming lucide-react for icons
import { Button } from "@/components/ui/button";

interface BlogPostCardProps {
  post: Post;
  isFeatured?: boolean; // To handle the alternating background for the text content part
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, isFeatured }) => {
  return (
    <article className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
      {post.imageUrl && (
        <div className="md:w-2/5 relative h-64 md:h-auto">
          {" "}
          {/* Added relative and height for Image */}
          <Image
            src={post.imageUrl}
            alt={post.title || "Blog post image"}
            layout="fill" // Changed to fill for better responsiveness within the container
            objectFit="cover" // Ensures the image covers the div
            className="w-full h-full" // Removed object-cover from here as it's on Image
          />
        </div>
      )}
      <div className={`md:w-3/5 p-8 ${isFeatured ? "bg-pink-50/50" : ""}`}>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          <Link href={`/blog/${post.slug}`} className="hover:text-pink-500">
            {post.title}
          </Link>
        </h2>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          {post.author.imageUrl && (
            <Image
              src={post.author.imageUrl}
              alt={post.author.name}
              width={32} // Corresponds to w-8
              height={32} // Corresponds to h-8
              className="rounded-full mr-3"
            />
          )}
          <span>
            By{" "}
            <Link
              href={`/author/${post.author.slug}`}
              className="text-pink-500 font-medium hover:underline"
            >
              {post.author.name}
            </Link>
          </span>
          <span className="mx-2">—</span> {/* Corrected em-dash */}
          <span>
            {new Date(post.publishDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <p className="text-gray-600 mb-6 leading-relaxed">{post.excerpt}</p>
        <div className="flex justify-between items-center">
          <Button
            asChild
            className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors"
          >
            <Link href={`/blog/${post.slug}`}>Read More</Link>
          </Button>
          {post.readTimeMinutes && (
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />{" "}
              {/* Adjusted size to match reference.html text-base */}
              <span>{post.readTimeMinutes} min read</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default BlogPostCard;
