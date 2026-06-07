"use client";

import { create } from "zustand";
import type { Project, ProjectFile } from "@/types";

interface WorkspaceState {
  project: Project | null;
  files: ProjectFile[];
  openTabs: string[];
  activeFilePath: string | null;
  previewHtml: string;
  showPreview: boolean;
  showEditor: boolean;
  unsavedChanges: Record<string, string>;
  setProject: (project: Project | null) => void;
  setFiles: (files: ProjectFile[]) => void;
  updateFileContent: (path: string, content: string) => void;
  setActiveFilePath: (path: string | null) => void;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  setPreviewHtml: (html: string) => void;
  setShowPreview: (v: boolean) => void;
  setShowEditor: (v: boolean) => void;
  markUnsaved: (path: string, content: string) => void;
  clearUnsaved: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  project: null,
  files: [],
  openTabs: [],
  activeFilePath: null,
  previewHtml: "",
  showPreview: true,
  showEditor: true,
  unsavedChanges: {},
  setProject: (project) => set({ project }),
  setFiles: (files) => set({ files }),
  updateFileContent: (path, content) =>
    set((s) => ({
      files: s.files.map((f) => (f.path === path ? { ...f, content } : f)),
    })),
  setActiveFilePath: (path) => set({ activeFilePath: path }),
  openTab: (path) =>
    set((s) => ({
      openTabs: s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path],
      activeFilePath: path,
    })),
  closeTab: (path) => {
    const { openTabs, activeFilePath } = get();
    const newTabs = openTabs.filter((t) => t !== path);
    set({
      openTabs: newTabs,
      activeFilePath:
        activeFilePath === path
          ? newTabs[newTabs.length - 1] ?? null
          : activeFilePath,
    });
  },
  setPreviewHtml: (html) => set({ previewHtml: html }),
  setShowPreview: (v) => set({ showPreview: v }),
  setShowEditor: (v) => set({ showEditor: v }),
  markUnsaved: (path, content) =>
    set((s) => ({
      unsavedChanges: { ...s.unsavedChanges, [path]: content },
    })),
  clearUnsaved: (path) =>
    set((s) => {
      const { [path]: _, ...rest } = s.unsavedChanges;
      return { unsavedChanges: rest };
    }),
}));
