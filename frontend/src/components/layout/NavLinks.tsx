import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";

interface NavLinkItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  dropdown?: boolean;
}

const navLinks: NavLinkItem[] = [
  { href: "#", label: "Home" },
  { href: "#", label: "Header Styles", dropdown: true },
  { href: "#", label: "Post Features", dropdown: true },
  { href: "#", label: "Features", dropdown: true },
  { href: "#", label: "Contact" },
  { href: "#", label: "Search", icon: <Search className="h-5 w-5 mr-1" /> }, // Adjusted size to match reference.html text-lg
];

const NavLinks = () => {
  return (
    <div className="hidden md:flex items-center space-x-6">
      {navLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className="text-gray-600 hover:text-pink-500 flex items-center"
        >
          {link.icon}
          {link.label}
          {link.dropdown && <ChevronDown className="h-4 w-4 ml-1" />}{" "}
          {/* Adjusted size to match reference.html text-xs */}
        </Link>
      ))}
    </div>
  );
};

export default NavLinks;
