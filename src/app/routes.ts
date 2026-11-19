import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", notify);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getPathname() {
  return typeof window === "undefined" ? "/login" : window.location.pathname;
}

export function usePathname() {
  return useSyncExternalStore(subscribe, getPathname, () => "/login");
}

export function navigate(path: string, replace = false) {
  if (typeof window === "undefined") return;

  if (window.location.pathname === path) return;

  if (replace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }

  notify();
}

export function getPrimaryRole(roles: string[]) {
  for (const role of ["ADMIN", "TEACHER", "STUDENT"]) {
    if (roles.includes(role)) return role;
  }

  return roles[0] || "USER";
}

export function getDashboardPath(role: string): string | null {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "TEACHER":
      return "/guru/dashboard";
    case "STUDENT":
      return "/siswa/dashboard";
    default:
      return null;
  }
}
