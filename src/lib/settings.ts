import prisma from "@/lib/prisma";
import {
  DEFAULT_AI_SETTINGS,
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_MEMORY_SETTINGS,
  type AppSettings,
} from "@/types";

export async function getSettings(userId = "default"): Promise<AppSettings> {
  const settings = await prisma.settings.findUnique({ where: { userId } });

  if (!settings) {
    return {
      ai: DEFAULT_AI_SETTINGS,
      memory: DEFAULT_MEMORY_SETTINGS,
      appearance: DEFAULT_APPEARANCE_SETTINGS,
    };
  }

  return {
    ai: { ...DEFAULT_AI_SETTINGS, ...(settings.ai as object) },
    memory: { ...DEFAULT_MEMORY_SETTINGS, ...(settings.memory as object) },
    appearance: {
      ...DEFAULT_APPEARANCE_SETTINGS,
      ...(settings.appearance as object),
    },
  };
}

export async function updateSettings(
  data: {
    ai?: Partial<AppSettings["ai"]>;
    memory?: Partial<AppSettings["memory"]>;
    appearance?: Partial<AppSettings["appearance"]>;
    project?: Record<string, unknown>;
  },
  userId = "default"
) {
  const existing = await prisma.settings.findUnique({ where: { userId } });
  const current = existing
    ? {
        ai: { ...DEFAULT_AI_SETTINGS, ...(existing.ai as object) },
        memory: { ...DEFAULT_MEMORY_SETTINGS, ...(existing.memory as object) },
        appearance: {
          ...DEFAULT_APPEARANCE_SETTINGS,
          ...(existing.appearance as object),
        },
      }
    : {
        ai: DEFAULT_AI_SETTINGS,
        memory: DEFAULT_MEMORY_SETTINGS,
        appearance: DEFAULT_APPEARANCE_SETTINGS,
      };

  const merged = {
    ai: { ...current.ai, ...data.ai },
    memory: { ...current.memory, ...data.memory },
    appearance: { ...current.appearance, ...data.appearance },
    project: data.project ?? (existing?.project as object) ?? {},
  };

  return prisma.settings.upsert({
    where: { userId },
    create: {
      userId,
      ai: merged.ai,
      memory: merged.memory,
      appearance: merged.appearance,
      project: merged.project ?? {},
    },
    update: {
      ai: merged.ai,
      memory: merged.memory,
      appearance: merged.appearance,
      project: merged.project ?? {},
    },
  });
}
