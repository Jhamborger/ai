"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalSearch } from "@/components/shared/global-search";
import { useChatStore } from "@/stores/chat-store";
import type { AppSettings } from "@/types";

export default function SettingsPage() {
  const { settings, setSettings } = useChatStore();
  const [local, setLocal] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      setLocal(data);
    }
  }

  async function saveSettings() {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(local),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <AppShell>
      <GlobalSearch />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>
            <p className="text-zinc-500 mt-1">Configure your AI workspace</p>
          </div>

          <section className="border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-medium text-zinc-200">AI Settings</h2>
            <SettingRow label="Temperature">
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={local.ai.temperature}
                onChange={(e) =>
                  setLocal({ ...local, ai: { ...local.ai, temperature: parseFloat(e.target.value) } })
                }
                className="max-w-[120px]"
              />
            </SettingRow>
            <SettingRow label="Max Tokens">
              <Input
                type="number"
                min={256}
                max={32768}
                step={256}
                value={local.ai.maxTokens}
                onChange={(e) =>
                  setLocal({ ...local, ai: { ...local.ai, maxTokens: parseInt(e.target.value) } })
                }
                className="max-w-[120px]"
              />
            </SettingRow>
            <SettingRow label="Top P">
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={local.ai.topP}
                onChange={(e) =>
                  setLocal({ ...local, ai: { ...local.ai, topP: parseFloat(e.target.value) } })
                }
                className="max-w-[120px]"
              />
            </SettingRow>
            <SettingRow label="Model">
              <Input
                value={local.ai.model}
                onChange={(e) =>
                  setLocal({ ...local, ai: { ...local.ai, model: e.target.value } })
                }
                className="max-w-[240px]"
              />
            </SettingRow>
          </section>

          <section className="border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-medium text-zinc-200">Memory Settings</h2>
            <SettingRow label="Max Retrieved Memories">
              <Input
                type="number"
                min={1}
                max={50}
                value={local.memory.maxRetrieved}
                onChange={(e) =>
                  setLocal({
                    ...local,
                    memory: { ...local.memory, maxRetrieved: parseInt(e.target.value) },
                  })
                }
                className="max-w-[120px]"
              />
            </SettingRow>
            <SettingRow label="Auto-save Memories">
              <button
                onClick={() =>
                  setLocal({
                    ...local,
                    memory: { ...local.memory, autoSave: !local.memory.autoSave },
                  })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  local.memory.autoSave ? "bg-violet-600" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    local.memory.autoSave ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </SettingRow>
          </section>

          <section className="border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-medium text-zinc-200">Appearance</h2>
            <SettingRow label="Theme">
              <select
                value={local.appearance.theme}
                onChange={(e) =>
                  setLocal({
                    ...local,
                    appearance: {
                      ...local.appearance,
                      theme: e.target.value as "dark" | "light" | "system",
                    },
                  })
                }
                className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </SettingRow>
            <SettingRow label="Compact Mode">
              <button
                onClick={() =>
                  setLocal({
                    ...local,
                    appearance: {
                      ...local.appearance,
                      compactMode: !local.appearance.compactMode,
                    },
                  })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  local.appearance.compactMode ? "bg-violet-600" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    local.appearance.compactMode ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </SettingRow>
          </section>

          <Button onClick={saveSettings} className="w-full">
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      {children}
    </div>
  );
}
