"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddPostStore } from "@/stores/addPostStore";

const TitleInput: React.FC = () => {
  const { title, setTitle } = useAddPostStore();

  return (
    <div className="space-y-2">
      <Label htmlFor="post-title">Title</Label>
      <Input
        id="post-title"
        type="text"
        placeholder="Enter post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
    </div>
  );
};

export default TitleInput;
