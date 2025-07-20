"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddUserStore, UserRole } from "@/stores/addUserStore";

export default function AddUserPage() {
  const {
    name,
    email,
    password_DO_NOT_LOG,
    confirmPassword_DO_NOT_LOG,
    role,
    setName,
    setEmail,
    setPassword,
    setConfirmPassword,
    setRole,
    resetForm,
  } = useAddUserStore();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password_DO_NOT_LOG !== confirmPassword_DO_NOT_LOG) {
      alert("Passwords do not match!");
      return;
    }
    // Actual submission logic will go here
    console.log("Submitting new user:", {
      name,
      email,
      role,
      // IMPORTANT: Never log passwords in a real application
      // password_DO_NOT_LOG: "******"
    });
    alert(
      "New user submitted (see console for data, password not logged). Form will reset."
    );
    resetForm();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-600" />
                Create New User
              </CardTitle>
              <CardDescription className="text-gray-600">
                Fill in the basic information for the new user account
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500">
                  Enter the user&apos;s full name as it should appear in the
                  system
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500">
                  This will be used for login and account notifications
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a secure password"
                  value={password_DO_NOT_LOG}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500">
                  Use a strong password with at least 8 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm Password *
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm the password"
                  value={confirmPassword_DO_NOT_LOG}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500">
                  Re-enter the password to confirm it matches
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="text-sm font-medium text-gray-700"
                >
                  User Role *
                </Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                >
                  <SelectTrigger
                    id="role"
                    className="border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Author">Author</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Authors can create posts, Admins have full access
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-6">
              <div className="flex gap-3 w-full">
                <Button
                  type="submit"
                  className="flex-1 subscribe-button text-white hover:opacity-90 font-medium py-3 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Create User
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
