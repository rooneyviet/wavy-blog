"use client";

import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAddPostStore } from "@/stores/addPostStore";
import { UploadCloud, XCircle } from "lucide-react"; // Icons

const ThumbnailUpload: React.FC = () => {
  const { thumbnailImage, setThumbnailImage } = useAddPostStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setThumbnailImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setThumbnailImage(null);
        setPreviewUrl(null);
      }
    },
    [setThumbnailImage]
  );

  const removeImage = () => {
    setThumbnailImage(null);
    setPreviewUrl(null);
    // Reset the file input if possible (can be tricky)
    const fileInput = document.getElementById(
      "thumbnail-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="thumbnail-upload">Thumbnail Image</Label>
      <div className="flex flex-col items-center space-y-4 rounded-md border-2 border-dashed border-muted-foreground/50 p-6 hover:border-primary transition-colors">
        {!previewUrl && (
          <>
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop an image here, or click to select one
            </p>
            <Input
              id="thumbnail-upload"
              type="file"
              className="hidden" // Hidden, triggered by label/button click
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                document.getElementById("thumbnail-upload")?.click()
              }
            >
              Browse Files
            </Button>
          </>
        )}
        {previewUrl && (
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Thumbnail preview"
              className="max-h-48 w-auto rounded-md object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={removeImage}
            >
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
        )}
      </div>
      {thumbnailImage && (
        <p className="text-xs text-muted-foreground">
          Selected: {thumbnailImage.name} (
          {(thumbnailImage.size / 1024).toFixed(2)} KB)
        </p>
      )}
    </div>
  );
};

export default ThumbnailUpload;
