"use client";

/** Ends the admin session on the server (cookie cleared for every path), then the caller navigates away. */
export async function logoutAdminSession() {
  try {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include", cache: "no-store" });
  } catch {
    // Even if the request failed, the caller still leaves the dashboard.
  }
}
