import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react"; // Assuming lucide-react for icons

const MobileMenuButton = () => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden ml-4 text-gray-600"
    >
      <Menu className="h-8 w-8" />{" "}
      {/* Adjusted size to match reference.html text-3xl */}
      <span className="sr-only">Open menu</span>
    </Button>
  );
};

export default MobileMenuButton;
