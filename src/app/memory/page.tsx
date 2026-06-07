"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Pin, Trash2, Pencil, Download, Filter } from "lucide-react";
import { AppShell } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlobalSearch } from "@/components/shared/global-search";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Memory, MemoryCategory } from "@/types";

const categories: MemoryCategory[] = [
  "preference",
  "coding",
  "project",
  "personal",
  "custom",
];

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MemoryCategory | "all">("all");
  const [editMemory, setEditMemory] = useState<Memory | null>(null);
  const [editContent, setEditContent] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("custom");

  useEffect(() => {
    fetchMemories();
  }, [search, filter]);

  async function fetchMemories() {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (filter !== "all") params.set("category", filter);
    const res = await fetch(`/api/memory?${params}`);
    if (res.ok) setMemories(await res.json());
  }

  async function togglePin(id: string, pinned: boolean) {
    await fetch(`/api/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    fetchMemories();
  }

  async function deleteMemory(id: string) {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    fetchMemories();
  }

  async function saveEdit() {
    if (!editMemory) return;
    await fetch(`/api/memory/${editMemory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setEditMemory(null);
    fetchMemories();
  }

  async function createMemory() {
    if (!newContent.trim()) return;
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent, category: newCategory }),
    });
    setCreateOpen(false);
    setNewContent("");
    fetchMemories();
  }

  return (
    <AppShell>
      <GlobalSearch />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-100 flex items-center gap-2">
                <Brain className="h-6 w-6 text-violet-400" /> Memory
              </h1>
              <p className="text-zinc-500 mt-1">Long-term knowledge the AI remembers</p>
            </div>
            <div className="flex gap-2">
              <a href="/api/export/memories">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </a>
              <Button size="sm" onClick={() => setCreateOpen(true)}>Add Memory</Button>
            </div>
          </div>

          <div className="flex gap-3 mb-6 flex-wrap">
            <Input
              placeholder="Search memories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-1 flex-wrap">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All" />
              {categories.map((c) => (
                <FilterButton key={c} active={filter === c} onClick={() => setFilter(c)} label={c} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {memories.map((memory, i) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/30 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/15 text-violet-300 border border-violet-500/20">
                        {memory.category}
                      </span>
                      {memory.pinned && <Pin className="h-3 w-3 text-violet-400" />}
                      <span className="text-xs text-zinc-600">
                        Importance: {memory.importance}/10 · {formatRelativeTime(memory.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-200">{memory.content}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(memory.id, memory.pinned)}>
                      <Pin className={cn("h-3.5 w-3.5", memory.pinned && "text-violet-400")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditMemory(memory); setEditContent(memory.content); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteMemory(memory.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {memories.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No memories yet. Tell the AI to remember something in chat.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editMemory} onOpenChange={() => setEditMemory(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Memory</DialogTitle></DialogHeader>
          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} />
          <Button onClick={saveEdit}>Save</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Memory</DialogTitle></DialogHeader>
          <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="What should the AI remember?" rows={4} />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
            className="w-full h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button onClick={createMemory}>Save Memory</Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-xs border transition-colors capitalize",
        active
          ? "bg-violet-600/20 border-violet-500/30 text-violet-300"
          : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
      )}
    >
      {label}
    </button>
  );
}
