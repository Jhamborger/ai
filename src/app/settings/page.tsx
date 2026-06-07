'use client';

import React, { useState } from 'react';
import { useWorkspaceStore } from '@/store/use-workspace-store';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { setMode } = useWorkspaceStore();
  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    theme: 'dark',
  });

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <div className="flex-1 max-w-4xl mx-auto p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Settings</h1>
          <button
            onClick={() => setMode('chat')}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
          >
            Back to Chat
          </button>
        </div>

        <section className="space-y-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <h2 className="text-xl font-semibold">AI Configuration</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Temperature</label>
              <input
                type="number"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                className="w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Max Tokens</label>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                className="w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <h2 className="text-xl font-semibold">Appearance</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">Theme</span>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({...settings, theme: e.target.value})}
              className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}
