import Image from "next/image";
import Link from "next/link";
import { Post } from "@/types";
import { Waves } from "lucide-react";

interface PopularArticlesWidgetProps {
  articles: Pick<Post, "slug" | "title" | "imageUrl" | "publishDate">[]; // Only need a subset of Post props
}

const PopularArticlesWidget: React.FC<PopularArticlesWidgetProps> = ({
  articles,
}) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg relative">
      <div className="absolute -top-4 -left-3">
        <Waves className="h-12 w-12 text-pink-400 opacity-70 transform rotate-12" />{" "}
        {/* Matched text-5xl */}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Popular Articles
      </h3>
      <div className="space-y-6">
        {articles.map((article) => (
          <div key={article.slug} className="flex items-start space-x-4">
            {article.imageUrl && (
              <div className="w-20 h-20 relative flex-shrink-0">
                {" "}
                {/* Added relative and flex-shrink-0 */}
                <Image
                  src={article.imageUrl}
                  alt={article.title || "Article thumbnail"}
                  layout="fill" // Use fill for responsive images within a sized container
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-700 hover:text-pink-500 text-sm leading-tight">
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(article.publishDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularArticlesWidget;
