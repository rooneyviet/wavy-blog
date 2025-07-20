"use client";

import * as React from "react";
import { LayoutDashboard, Users, FileText, FolderOpen, Waves } from "lucide-react";

import Link from "next/link";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { User } from "@/types";

// All navigation items with Dashboard first
const allNavItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    roles: ["admin", "author"], // Both admin and author can see dashboard
    items: [],
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    roles: ["admin"], // Only admin can see this
    items: [
      {
        title: "List Users",
        url: "/admin/users",
      },
      {
        title: "Add User",
        url: "/admin/users/add",
      },
    ],
  },
  {
    title: "Posts",
    url: "/admin/posts",
    icon: FileText,
    roles: ["admin", "author"], // Both admin and author can see this
    items: [
      {
        title: "List Posts",
        url: "/admin/posts",
      },
      {
        title: "Add Post",
        url: "/admin/posts/add",
      },
    ],
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: FolderOpen,
    roles: ["admin"], // Only admin can manage categories
    items: [
      {
        title: "List Categories",
        url: "/admin/categories",
      },
      {
        title: "Add Category",
        url: "/admin/categories/add",
      },
    ],
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Filter navigation items based on user role
  const filteredNavItems = allNavItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  const data = {
    user: {
      name: user?.username || "User",
      email: user?.email || "user@example.com",
      avatar: "/avatars/shadcn.jpg", // Placeholder avatar
    },
    navMain: filteredNavItems,
  };

  return (
    <Sidebar collapsible="icon" className="bg-white shadow-lg border-r border-gray-200" {...props}>
      <SidebarHeader>
        {/* Enhanced Header with Wavy Branding */}
        <div className="flex h-16 items-center justify-center p-4 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-3 font-bold text-xl text-gray-800 hover:text-pink-600 transition-colors">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-400 rounded-lg shadow-sm">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <span className="group-data-[collapsible=icon]:hidden">Wavy Admin</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 p-4">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
