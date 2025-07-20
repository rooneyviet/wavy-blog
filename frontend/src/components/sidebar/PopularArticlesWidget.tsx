import { Post } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface PopularArticlesWidgetProps {
  articles: Pick<Post, "slug" | "title" | "thumbnailURL" | "publishDate">[];
}

const PopularArticlesWidget: React.FC<PopularArticlesWidgetProps> = ({
  articles,
}) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Popular Articles</h3>
      <ul className="space-y-4">
        {articles.map((article) => (
          <li key={article.slug} className="flex items-center space-x-4">
            {article.thumbnailURL && (
              <Image
                src={article.thumbnailURL}
                alt={article.title}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-md"
              />
            )}
            <div>
              <Link
                href={`/post/${article.slug}`}
                className="font-semibold hover:text-pink-600"
              >
                {article.title}
              </Link>
              <p className="text-sm text-gray-500">
                {new Date(article.publishDate!).toLocaleDateString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PopularArticlesWidget;
