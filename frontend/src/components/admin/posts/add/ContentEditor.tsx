"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAddPostStore } from "@/stores/addPostStore";

const ContentEditor: React.FC = () => {
  const { content, setContent } = useAddPostStore();

  return (
    <div className="space-y-2">
      <Label htmlFor="post-content">Content</Label>
      <Textarea
        id="post-content"
        placeholder="Write your blog post content here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        className="min-h-[200px] lg:min-h-[300px]" // Make textarea larger
      />
    </div>
  );
};

export default ContentEditor;
