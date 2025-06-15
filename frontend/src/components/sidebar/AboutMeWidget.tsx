import Image from "next/image";
import { Waves, Twitter, Facebook, Globe } from "lucide-react"; // Using Globe for generic website
import SocialLink from "@/components/ui/SocialLink"; // Re-using SocialLink

interface AboutMeWidgetProps {
  author: {
    name: string;
    title: string;
    bio: string;
    imageUrl?: string; // Made optional to match Author type
    socialLinks: {
      twitter?: string;
      facebook?: string;
      website?: string;
    };
  };
}

const AboutMeWidget: React.FC<AboutMeWidgetProps> = ({ author }) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg relative">
      <div className="absolute -top-4 -left-3">
        <Waves className="h-12 w-12 text-pink-400 opacity-70 transform rotate-12" />{" "}
        {/* Matched text-5xl */}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">About Me</h3>
      <div className="flex items-center mb-4">
        {author.imageUrl && ( // Conditionally render Image if imageUrl exists
          <Image
            src={author.imageUrl}
            alt={`${author.name}, ${author.title}`}
            width={64} // Corresponds to w-16
            height={64} // Corresponds to h-16
            className="rounded-full mr-4"
          />
        )}
        <div className={!author.imageUrl ? "ml-0" : ""}>
          {" "}
          {/* Adjust margin if no image */}
          <h4 className="font-semibold text-gray-700">{author.name}</h4>
          <p className="text-sm text-gray-500">{author.title}</p>
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-6">{author.bio}</p>
      <div className="flex space-x-4 text-sm">
        {author.socialLinks.twitter && (
          <SocialLink
            href={author.socialLinks.twitter}
            icon={<Twitter className="h-4 w-4" />} // Matched w-4 h-4
            label="Twitter"
          />
        )}
        {author.socialLinks.facebook && (
          <SocialLink
            href={author.socialLinks.facebook}
            icon={<Facebook className="h-4 w-4" />} // Matched w-4 h-4
            label="Facebook"
          />
        )}
        {author.socialLinks.website && (
          <SocialLink
            href={author.socialLinks.website}
            icon={<Globe className="h-4 w-4" />} // Matched text-base (approx h-4 w-4)
            label="Website"
          />
        )}
      </div>
    </div>
  );
};

export default AboutMeWidget;
