"use client";

import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  globalSearchOpen: boolean;
  activeMode: "chat" | "workspace" | "projects" | "memory" | "settings";
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setGlobalSearchOpen: (v: boolean) => void;
  setActiveMode: (mode: UIState["activeMode"]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  globalSearchOpen: false,
  activeMode: "chat",
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setGlobalSearchOpen: (v) => set({ globalSearchOpen: v }),
  setActiveMode: (mode) => set({ activeMode: mode }),
}));
