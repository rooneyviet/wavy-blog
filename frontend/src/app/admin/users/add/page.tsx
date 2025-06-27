"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/select"; // Added Select
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
    <form onSubmit={handleSubmit}>
      <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full max-w-lg mx-auto border-0">
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>
            Create a new user account and assign a role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter user's full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter user's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password_DO_NOT_LOG}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword_DO_NOT_LOG}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Author">Author</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white subscribe-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 h-auto"
          >
            Create User
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
