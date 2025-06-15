import Link from "next/link";
import { Waves } from "lucide-react";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center">
      <Waves className="text-pink-500 h-10 w-10 mr-1" />
      <h1 className="wavy-text">
        wavy<span className="text-pink-500">.</span>
      </h1>
    </Link>
  );
};

export default Logo;
