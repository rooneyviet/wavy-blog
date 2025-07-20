"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddPostStore } from "@/stores/addPostStore";

const StatusSelector: React.FC = () => {
  const { status, setStatus } = useAddPostStore();

  return (
    <div className="space-y-2">
      <Label>Status</Label>
      <Select key={status} value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusSelector;
