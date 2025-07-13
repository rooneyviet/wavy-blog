import { redirect } from "next/navigation";
import { api } from "@/lib/api/server";
import AdminLayoutClient from "./AdminLayoutClient";
import { User } from "@/types";
import { headers } from "next/headers";

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const headersList = await headers();
    const cookieHeader = headersList.get("Cookie") || "";
    console.log("ABCSSSSS", cookieHeader);
    if (!cookieHeader.includes("refresh_token=")) {
      console.log("No refresh token found in cookie header");
      return null;
    }

    const response = await api.refreshWithCookies(cookieHeader);
    return response.user;
  } catch (error) {
    console.error("Authentication failed:", error);
    return null;
  }
}

export default async function AdminAuthWrapper({
  children,
}: AdminAuthWrapperProps) {
  const user = await getAuthenticatedUser();

  // Check if user is authenticated
  if (!user) {
    redirect("/");
  }

  // Check if user has at least author role
  if (user.role !== "admin" && user.role !== "author") {
    redirect("/");
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
