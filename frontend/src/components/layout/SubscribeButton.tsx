import { Button } from "@/components/ui/button"; // Assuming shadcn button
import Link from "next/link";

const SubscribeButton = () => {
  return (
    <Link href="/login" passHref>
      <Button className="subscribe-button text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity">
        Login
      </Button>
    </Link>
  );
};

export default SubscribeButton;
