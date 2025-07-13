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
    console.log("[AUTH] Starting authentication check");
    const headersList = await headers();
    const cookieHeader = headersList.get("Cookie") || "";
    console.log("[AUTH] Cookie header from request:", cookieHeader);
    
    if (!cookieHeader.includes("refresh_token=")) {
      console.log("[AUTH] No refresh_token found in cookies");
      return null;
    }

    console.log("[AUTH] refresh_token found, calling refresh API");
    const response = await api.refreshWithCookies(cookieHeader);
    console.log("[AUTH] Refresh API successful, user:", response.user);
    return response.user;
  } catch (error) {
    console.error("[AUTH] Authentication failed:", error);
    return null;
  }
}

export default async function AdminAuthWrapper({
  children,
}: AdminAuthWrapperProps) {
  console.log("[AUTH] AdminAuthWrapper called");
  const user = await getAuthenticatedUser();

  // Check if user is authenticated
  if (!user) {
    console.log("[AUTH] No user found, redirecting to home");
    redirect("/");
  }

  console.log("[AUTH] User found:", user.username, "role:", user.role);

  // Check if user has at least author role
  if (user.role !== "admin" && user.role !== "author") {
    console.log("[AUTH] User does not have admin/author role, redirecting to home");
    redirect("/");
  }

  console.log("[AUTH] User authorized, rendering admin layout");
  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
