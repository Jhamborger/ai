import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const createMessageSchema = z.object({
  conversationId: z.string(),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1),
});

export const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1),
  projectId: z.string().optional(),
  regenerate: z.boolean().optional(),
  settings: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(256).max(32768).optional(),
      topP: z.number().min(0).max(1).optional(),
      model: z.string().optional(),
    })
    .optional(),
});

export const memorySchema = z.object({
  content: z.string().min(1),
  category: z
    .enum(["preference", "coding", "project", "personal", "custom"])
    .optional(),
  importance: z.number().min(1).max(10).optional(),
  pinned: z.boolean().optional(),
});

export const updateMemorySchema = memorySchema.partial();

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

export const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export const searchSchema = z.object({
  q: z.string().min(1),
  type: z
    .enum(["all", "conversations", "messages", "memories", "projects", "files"])
    .optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const settingsSchema = z.object({
  ai: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(256).max(32768).optional(),
      topP: z.number().min(0).max(1).optional(),
      model: z.string().optional(),
    })
    .optional(),
  memory: z
    .object({
      maxRetrieved: z.number().min(1).max(50).optional(),
      autoSave: z.boolean().optional(),
    })
    .optional(),
  appearance: z
    .object({
      theme: z.enum(["dark", "light", "system"]).optional(),
      sidebarCollapsed: z.boolean().optional(),
      compactMode: z.boolean().optional(),
    })
    .optional(),
  project: z.record(z.string(), z.unknown()).optional(),
});
