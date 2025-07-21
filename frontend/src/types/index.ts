export interface User {
  userID: string;
  username: string;
  email: string;
  role: "author" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  name: string;
  slug: string;
  imageUrl?: string;
}

export interface Post {
  slug: string;
  title: string;
  content: string;
  authorID: string;
  authorName: string; // Username resolved from authorID
  category: string;
  thumbnailURL?: string;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
  // The following are from the dummy data and may not be in the final API response.
  // We will keep them optional for now.
  id?: string;
  excerpt?: string;
  author?: Author;
  readTimeMinutes?: number;
  publishDate?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface PaginatedPostsResponse {
  pageIndex: number;  // 1-based indexing
  pageSize: number;
  total: number;
  posts: Post[];
}

export interface ImageMetadata {
  id: string;
  name: string;
  originalName: string;
  size: number;
  contentType: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  path: string;
}

export interface PaginatedImagesResponse {
  pageIndex: number;  // 1-based indexing
  pageSize: number;
  total: number;
  images: ImageMetadata[];
}

export interface ApiError {
  message: string;
}

export interface Category {
  slug: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FormState {
  error?: string;
  user?: User;
  access_token?: string;
}
