import { create } from "zustand";

export interface Category {
  id: string;
  name: string;
}

interface AddPostState {
  title: string;
  content: string;
  selectedCategorySlug: string;
  thumbnailImage: File | null;
  status: "published" | "draft";
  // For now, let's assume categories are fetched or predefined
  availableCategories: Category[];

  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  selectCategorySlug: (categorySlug: string) => void;
  setThumbnailImage: (image: File | null) => void;
  setStatus: (status: "published" | "draft") => void;
  resetForm: () => void;
  // Potentially an action to load categories if they are dynamic
  // loadCategories: (categories: Category[]) => void;
}

const initialCategories: Category[] = [
  { id: "tech", name: "Technology" },
  { id: "lifestyle", name: "Lifestyle" },
  { id: "travel", name: "Travel" },
  { id: "food", name: "Food" },
  { id: "dev", name: "Development" },
];

const initialState = {
  title: "",
  content: "",
  selectedCategorySlug: "",
  thumbnailImage: null,
  status: "published" as const,
  availableCategories: initialCategories,
};

export const useAddPostStore = create<AddPostState>((set) => ({
  ...initialState,
  setTitle: (title) => set({ title }),
  setContent: (content) => set({ content }),
  selectCategorySlug: (categorySlug) =>
    set({ selectedCategorySlug: categorySlug }),
  setThumbnailImage: (image) => set({ thumbnailImage: image }),
  setStatus: (status) => set({ status }),
  resetForm: () => set(initialState),
  // loadCategories: (categories) => set({ availableCategories: categories }),
}));
