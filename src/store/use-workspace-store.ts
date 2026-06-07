import { create } from 'zustand';

interface WorkspaceState {
  activeMode: 'chat' | 'workspace' | 'projects' | 'memory';
  currentProjectId: string | null;
  activeFile: string | null;
  isSidebarOpen: boolean;

  setMode: (mode: 'chat' | 'workspace' | 'projects' | 'memory') => void;
  setProjectId: (id: string | null) => void;
  setActiveFile: (path: string | null) => void;
  toggleSidebar: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeMode: 'chat',
  currentProjectId: null,
  activeFile: null,
  isSidebarOpen: true,

  setMode: (mode) => set({ activeMode: mode }),
  setProjectId: (id) => set({ currentProjectId: id }),
  setActiveFile: (path) => set({ activeFile: path }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
