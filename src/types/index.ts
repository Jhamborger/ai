export type MessageRole = "system" | "user" | "assistant";

export type MemoryCategory =
  | "preference"
  | "coding"
  | "project"
  | "personal"
  | "custom";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  _count?: { messages: number };
}

export interface Memory {
  id: string;
  content: string;
  category: MemoryCategory;
  importance: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  files?: ProjectFile[];
  _count?: { files: number };
}

export interface ProjectFileOutput {
  path: string;
  content: string;
}

export interface StructuredProjectOutput {
  files: ProjectFileOutput[];
}

export interface AISettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  model: string;
}

export interface MemorySettings {
  maxRetrieved: number;
  autoSave: boolean;
}

export interface AppearanceSettings {
  theme: "dark" | "light" | "system";
  sidebarCollapsed: boolean;
  compactMode: boolean;
}

export interface AppSettings {
  ai: AISettings;
  memory: MemorySettings;
  appearance: AppearanceSettings;
}

export interface SearchResult {
  type: "conversation" | "message" | "memory" | "project" | "file";
  id: string;
  title: string;
  snippet: string;
  url: string;
  score?: number;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  temperature: 0.7,
  maxTokens: 8192,
  topP: 0.95,
  model: process.env.GEMMA_MODEL ?? "gemma-3-27b-it",
};

export const DEFAULT_MEMORY_SETTINGS: MemorySettings = {
  maxRetrieved: 10,
  autoSave: true,
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: "dark",
  sidebarCollapsed: false,
  compactMode: false,
};
