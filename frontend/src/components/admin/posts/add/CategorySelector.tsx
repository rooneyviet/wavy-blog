"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAddPostStore, Category } from "@/stores/addPostStore";

const CategorySelector: React.FC = () => {
  const { availableCategories, selectedCategoryIds, toggleCategoryId } =
    useAddPostStore();

  return (
    <div className="space-y-2">
      <Label>Categories</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border rounded-md">
        {availableCategories.length > 0 ? (
          availableCategories.map((category: Category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategoryIds.includes(category.id)}
                onCheckedChange={() => toggleCategoryId(category.id)}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="font-normal cursor-pointer"
              >
                {category.name}
              </Label>
            </div>
          ))
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
