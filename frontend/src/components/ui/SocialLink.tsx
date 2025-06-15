import Link from "next/link";

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ href, icon, label }) => {
  return (
    <Link
      href={href}
      className="flex items-center text-gray-600 hover:text-pink-500 text-sm"
      target="_blank" // Open social links in a new tab
      rel="noopener noreferrer" // Security best practice for target="_blank"
    >
      {icon}
      <span className="ml-1">{label}</span>
    </Link>
  );
};

export default SocialLink;
