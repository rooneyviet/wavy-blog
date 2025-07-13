"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import AdminLayoutClient from "./AdminLayoutClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export default function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give some time for the store to hydrate from localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Check if user is authenticated and has proper role
      if (!user || !accessToken) {
        router.push("/");
        return;
      }

      // Check if user has at least author role
      if (user.role !== "admin" && user.role !== "author") {
        router.push("/");
        return;
      }
    }
  }, [user, accessToken, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pink-50">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (!user || !accessToken) {
    return null; // Will redirect
  }

  if (user.role !== "admin" && user.role !== "author") {
    return null; // Will redirect
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
