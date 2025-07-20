"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, FolderOpen, Eye, TrendingUp, Plus, Activity } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { postQueries } from "@/lib/queries/posts";
import { useAuthStore } from "@/stores/authStore";

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  gradient: string;
  href?: string;
}

function StatsCard({ title, value, change, changeType = "neutral", icon, gradient, href }: StatsCardProps) {
  const changeColor = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600"
  }[changeType];

  const cardContent = (
    <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden group cursor-pointer">
      <div className={`h-1 ${gradient}`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={`text-sm font-medium flex items-center gap-1 ${changeColor}`}>
                {changeType === "positive" && <TrendingUp className="w-3 h-3" />}
                {change}
              </p>
            )}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// Quick Actions Component
function QuickActions() {
  return (
    <Card className="bg-white rounded-xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-pink-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/admin/posts/add">
          <Button className="w-full justify-start subscribe-button text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create New Post
          </Button>
        </Link>
        <Link href="/admin/categories/add">
          <Button variant="outline" className="w-full justify-start border-pink-200 text-pink-600 hover:bg-pink-50">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </Link>
        <Link href="/admin/users/add">
          <Button variant="outline" className="w-full justify-start border-pink-200 text-pink-600 hover:bg-pink-50">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Recent Activity Component
function RecentActivity() {
  const { accessToken } = useAuthStore();
  
  const { data: postsData } = useQuery({
    ...postQueries.admin(accessToken || ""),
    enabled: !!accessToken,
  });

  const recentPosts = postsData?.posts?.slice(0, 5) || [];

  return (
    <Card className="bg-white rounded-xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-600" />
            Recent Posts
          </span>
          <Link href="/admin/posts">
            <Button variant="ghost" size="sm" className="text-pink-600 hover:bg-pink-50">
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <div key={post.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{post.title}</p>
                <p className="text-sm text-gray-500">by {post.authorName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  post.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {post.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No posts yet</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminHomePage() {
  const { accessToken } = useAuthStore();
  
  const { data: postsData } = useQuery({
    ...postQueries.admin(accessToken || ""),
    enabled: !!accessToken,
  });

  const totalPosts = postsData?.posts?.length || 0;
  const publishedPosts = postsData?.posts?.filter(post => post.status === 'published').length || 0;
  const draftPosts = postsData?.posts?.filter(post => post.status === 'draft').length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your blog today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value="42"
          change="+2 this week"
          changeType="positive"
          icon={<Users className="w-6 h-6 text-pink-600" />}
          gradient="bg-gradient-to-r from-pink-500 to-pink-400"
          href="/admin/users"
        />
        
        <StatsCard
          title="Total Posts"
          value={totalPosts}
          change="+5 this month"
          changeType="positive"
          icon={<FileText className="w-6 h-6 text-purple-600" />}
          gradient="bg-gradient-to-r from-purple-500 to-pink-500"
          href="/admin/posts"
        />
        
        <StatsCard
          title="Categories"
          value="8"
          change="+1 this month"
          changeType="positive"
          icon={<FolderOpen className="w-6 h-6 text-blue-600" />}
          gradient="bg-gradient-to-r from-blue-500 to-purple-500"
          href="/admin/categories"
        />
        
        <StatsCard
          title="Total Views"
          value="15.2K"
          change="+8% this week"
          changeType="positive"
          icon={<Eye className="w-6 h-6 text-green-600" />}
          gradient="bg-gradient-to-r from-green-500 to-emerald-400"
        />
      </div>

      {/* Content Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white rounded-xl shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{publishedPosts}</h3>
            <p className="text-gray-600">Published Posts</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{draftPosts}</h3>
            <p className="text-gray-600">Draft Posts</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">87%</h3>
            <p className="text-gray-600">Engagement Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  );
}
