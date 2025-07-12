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
  category: string;
  thumbnailURL?: string;
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

export interface ApiError {
  message: string;
}

export interface FormState {
  error?: string;
  user?: User;
  access_token?: string;
}
