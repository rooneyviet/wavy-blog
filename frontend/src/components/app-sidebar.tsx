"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import Link from "next/link"; // Added Link
import { NavMain } from "@/components/nav-main";
// import { NavProjects } from "@/components/nav-projects" // Removed
import { NavUser } from "@/components/nav-user";
// import { TeamSwitcher } from "@/components/team-switcher" // Removed
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { Users, FileText, UserCircle } from "lucide-react"; // Added Users and FileText, removed duplicate Settings2

// This is sample data.
const data = {
  user: {
    // Keeping user for NavUser, can be updated later
    name: "Admin User",
    email: "admin@example.com",
    avatar: "/avatars/shadcn.jpg", // Placeholder avatar
  },
  // teams: [ ... ], // Removed teams
  navMain: [
    {
      title: "Users",
      url: "/admin/users", // Base URL for users section
      icon: Users,
      isActive: true, // Example: make Users active by default or based on route
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
    // },
  ],
  // projects: [ ... ], // Removed projects
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
