"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AdminLayoutClient from "./AdminLayoutClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authQueries } from "@/lib/queries/auth";

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export default function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const router = useRouter();
  
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery(authQueries.refresh());

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (isError || !user) {
    router.push("/");
    return null;
  }

  // Check if user has at least author role
  if (user.role !== "admin" && user.role !== "author") {
    router.push("/");
    return null;
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}