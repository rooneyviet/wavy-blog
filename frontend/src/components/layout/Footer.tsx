import { Waves, Heart } from "lucide-react"; // Assuming lucide-react for icons

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 py-12 mt-16">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center mb-4">
          <Waves className="text-pink-500 h-8 w-8 mr-1" />{" "}
          {/* Adjusted size to match reference.html text-3xl */}
          <h1 className="text-2xl font-bold text-white">
            wavy<span className="text-pink-500">.</span>
          </h1>
        </div>
        <p className="text-sm">
          © {new Date().getFullYear()} Wavy. All rights reserved. Designed with{" "}
          <Heart className="inline h-4 w-4 text-pink-500 fill-pink-500" /> by
          YourName.
        </p>
        <p className="text-xs mt-2">Personal Blog Theme</p>
      </div>
    </footer>
  );
};

export default Footer;
