"use client";

import { create } from "zustand";
import type { Conversation, ChatMessage, AppSettings } from "@/types";
import { DEFAULT_AI_SETTINGS, DEFAULT_APPEARANCE_SETTINGS, DEFAULT_MEMORY_SETTINGS } from "@/types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  searchQuery: string;
  settings: AppSettings;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  setIsStreaming: (v: boolean) => void;
  appendStreamingContent: (chunk: string) => void;
  resetStreamingContent: () => void;
  setSearchQuery: (q: string) => void;
  setSettings: (settings: AppSettings) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  searchQuery: "",
  settings: {
    ai: DEFAULT_AI_SETTINGS,
    memory: DEFAULT_MEMORY_SETTINGS,
    appearance: DEFAULT_APPEARANCE_SETTINGS,
  },
  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  updateMessage: (id, content) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, content } : m)),
    })),
  setIsStreaming: (v) => set({ isStreaming: v }),
  appendStreamingContent: (chunk) =>
    set((s) => ({ streamingContent: s.streamingContent + chunk })),
  resetStreamingContent: () => set({ streamingContent: "" }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSettings: (settings) => set({ settings }),
}));
