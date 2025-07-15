"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const SubscribeButton = () => {
  const { user, clearSession } = useAuthStore();

  const handleLogout = () => {
    clearSession();
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/admin" passHref>
          <Button className="subscribe-button text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity">
            My Page
          </Button>
        </Link>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              >
                <LogOut className="h-15 w-15" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Log Out</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <Link href="/login" passHref>
      <Button className="subscribe-button text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity">
        Login
      </Button>
    </Link>
  );
};

export default SubscribeButton;
