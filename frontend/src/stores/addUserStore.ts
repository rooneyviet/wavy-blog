import { create } from "zustand";

export type UserRole = "Admin" | "Author";

interface AddUserState {
  name: string;
  email: string;
  password_DO_NOT_LOG: string; // Suffix to remind not to log
  confirmPassword_DO_NOT_LOG: string; // Suffix to remind not to log
  role: UserRole;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  setRole: (role: UserRole) => void;
  resetForm: () => void;
}

const initialState = {
  name: "",
  email: "",
  password_DO_NOT_LOG: "",
  confirmPassword_DO_NOT_LOG: "",
  role: "Author" as UserRole, // Default role
};

export const useAddUserStore = create<AddUserState>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setPassword: (password_DO_NOT_LOG) => set({ password_DO_NOT_LOG }),
  setConfirmPassword: (confirmPassword_DO_NOT_LOG) =>
    set({ confirmPassword_DO_NOT_LOG }),
  setRole: (role) => set({ role }),
  resetForm: () => set(initialState),
}));
