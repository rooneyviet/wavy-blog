"use client";

import { useAuthStore } from "@/stores/authStore";

/**
 * General logout function that:
 * 1. Clears the zustand auth store (user and access token)
 * 2. Removes the refresh_token cookie
 * 3. Redirects to the frontpage
 */
export function logoutUser() {
  console.log("[LOGOUT] Starting logout process");
  
  // Clear the zustand store
  const { clearSession } = useAuthStore.getState();
  clearSession();
  console.log("[LOGOUT] Cleared zustand auth store");
  
  // Remove refresh_token cookie
  document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict";
  console.log("[LOGOUT] Removed refresh_token cookie");
  
  // Redirect to frontpage
  window.location.href = "/";
  console.log("[LOGOUT] Redirecting to frontpage");
}

/**
 * Check if a response is a 401 (Unauthorized) and automatically logout
 * This function should be called whenever making API requests
 */
export function handleUnauthorizedResponse(response: Response) {
  if (response.status === 401) {
    console.log("[AUTH] Received 401 response, triggering automatic logout");
    logoutUser();
    return true; // Indicates that logout was triggered
  }
  return false; // Indicates that logout was not triggered
}