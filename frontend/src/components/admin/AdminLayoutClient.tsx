"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User } from "@/types";
import { ChevronRight, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: User;
}

// Breadcrumb mapping for different routes
const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ label: "Admin", href: "/admin" }];

  if (segments.length > 1) {
    const section = segments[1];

    switch (section) {
      case "posts":
        breadcrumbs.push({ label: "Posts", href: "/admin/posts" });
        if (segments[2] === "add") {
          breadcrumbs.push({ label: "Add Post", href: "/admin/posts/add" });
        } else if (segments[2] && segments[3] === "edit") {
          breadcrumbs.push({
            label: "Edit Post",
            href: `/admin/posts/${segments[2]}/edit`,
          });
        } else if (segments[2]) {
          breadcrumbs.push({ label: "List Posts", href: "/admin/posts" });
        }
        break;
      case "categories":
        breadcrumbs.push({ label: "Categories", href: "/admin/categories" });
        if (segments[2] === "add") {
          breadcrumbs.push({
            label: "Add Category",
            href: "/admin/categories/add",
          });
        } else if (segments[2] && segments[3] === "edit") {
          breadcrumbs.push({
            label: "Edit Category",
            href: `/admin/categories/${segments[2]}/edit`,
          });
        } else if (segments[2]) {
          breadcrumbs.push({
            label: "List Categories",
            href: "/admin/categories",
          });
        }
        break;
      case "users":
        breadcrumbs.push({ label: "Users", href: "/admin/users" });
        if (segments[2] === "add") {
          breadcrumbs.push({ label: "Add User", href: "/admin/users/add" });
        } else if (segments[2]) {
          breadcrumbs.push({ label: "List Users", href: "/admin/users" });
        }
        break;
    }
  }

  return breadcrumbs;
};

export default function AdminLayoutClient({
  children,
  user,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="bg-white shadow-none border-none">
        {/* Enhanced Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1 p-2 hover:bg-gray-100 rounded-lg transition-colors" />

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-pink-600 font-medium">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-pink-600 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content with enhanced styling */}
        <main className="flex-1 bg-pink-50 p-6 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
