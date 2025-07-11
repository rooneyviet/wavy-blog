import AboutMeWidget from "./AboutMeWidget";
import PopularArticlesWidget from "./PopularArticlesWidget";
import { Post, Author } from "@/types";

interface AboutMeAuthor extends Author {
  title: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    website?: string;
  };
}

interface SidebarProps {
  authorData: AboutMeAuthor;
  popularArticles: Pick<
    Post,
    "slug" | "title" | "thumbnailURL" | "publishDate"
  >[];
}

const Sidebar: React.FC<SidebarProps> = ({ authorData, popularArticles }) => {
  return (
    <aside className="space-y-12">
      <AboutMeWidget author={authorData} />
      <PopularArticlesWidget articles={popularArticles} />
    </aside>
  );
};

export default Sidebar;
