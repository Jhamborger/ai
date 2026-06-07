"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageSquare, Brain, FolderKanban, File } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";
import type { SearchResult } from "@/types";
import { cn } from "@/lib/utils";

const typeIcons = {
  conversation: MessageSquare,
  message: MessageSquare,
  memory: Brain,
  project: FolderKanban,
  file: File,
};

export function GlobalSearch() {
  const { globalSearchOpen, setGlobalSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setResults(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
      if (e.key === "Escape") setGlobalSearchOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setGlobalSearchOpen]);

  function navigate(url: string) {
    setGlobalSearchOpen(false);
    setQuery("");
    router.push(url);
  }

  return (
    <Dialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search everything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <p className="text-sm text-zinc-500 p-4 text-center">Searching...</p>
          )}
          {!loading && results.length === 0 && query && (
            <p className="text-sm text-zinc-500 p-4 text-center">No results found</p>
          )}
          {results.map((result) => {
            const Icon = typeIcons[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => navigate(result.url)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/60 text-left transition-colors"
              >
                <Icon className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{result.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{result.snippet}</p>
                  <span className="text-xs text-violet-400 capitalize">{result.type}</span>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
