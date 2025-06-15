export interface Author {
  name: string;
  slug: string;
  imageUrl?: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  publishDate: string; // Consider using Date object if more manipulation is needed
  author: Author;
  readTimeMinutes?: number;
  category?: string;
  // content will be fetched or defined for individual post pages later
}
