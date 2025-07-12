"use client";

import * as React from "react";
import { GalleryVerticalEnd, Users, FileText } from "lucide-react";

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

// All navigation items
const allNavItems = [
  {
    title: "Users",
    url: "/admin/users", // Base URL for users section
    icon: Users,
    isActive: true, // Example: make Users active by default or based on route
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
    url: "/admin/posts", // Base URL for posts section
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
  // Example for a settings link if needed in the future
  // {
  //   title: "Settings",
  //   url: "/admin/settings",
  //   icon: Settings2,
  //   roles: ["admin"],
  // },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: string;
  user?: User;
}

export function AppSidebar({ userRole, user, ...props }: AppSidebarProps) {
  // Filter navigation items based on user role
  const filteredNavItems = allNavItems.filter(item => 
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
    <Sidebar collapsible="icon" className="bg-white" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        {/* Placeholder for a logo or app name if TeamSwitcher is removed */}
        <div className="flex h-12 items-center justify-center p-2">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <GalleryVerticalEnd className="h-6 w-6" /> {/* Example Icon */}
            <span>Wavy Admin</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
