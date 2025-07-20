"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAddPostStore } from "@/stores/addPostStore";
import { categoryQueries } from "@/lib/queries/categories";

const CategorySelector: React.FC = () => {
  const { selectedCategorySlug, selectCategorySlug } = useAddPostStore();
  const { data: categories = [], isLoading } = useQuery(categoryQueries.list());

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Categories</Label>
        <div className="space-y-2 p-4 border rounded-md">
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Category</Label>
      <div className="p-4 border rounded-md max-h-48 overflow-y-auto">
        {categories.length > 0 ? (
          <RadioGroup
            value={selectedCategorySlug || ""}
            onValueChange={selectCategorySlug}
          >
            {categories.map((category) => (
              <div key={category.slug} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={category.slug}
                  id={`category-${category.slug}`}
                />
                <Label
                  htmlFor={`category-${category.slug}`}
                  className="font-normal cursor-pointer"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <p className="text-sm text-muted-foreground">
            No categories available.
          </p>
        )}
      </div>
    </div>
  );
};

export default CategorySelector;
