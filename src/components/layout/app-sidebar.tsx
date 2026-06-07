"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare,
  FolderKanban,
  Brain,
  Settings,
  Plus,
  Search,
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Code2,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { useEffect, useState } from "react";
import type { Conversation } from "@/types";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare, mode: "chat" as const },
  { href: "/projects", label: "Projects", icon: FolderKanban, mode: "projects" as const },
  { href: "/memory", label: "Memory", icon: Brain, mode: "memory" as const },
  { href: "/settings", label: "Settings", icon: Settings, mode: "settings" as const },
];

export function AppSidebar() {
  const pathname = usePathname();
  const {
    conversations,
    activeConversationId,
    searchQuery,
    setConversations,
    setActiveConversationId,
    setSearchQuery,
  } = useChatStore();
  const { sidebarCollapsed, setSidebarCollapsed, setGlobalSearchOpen, setActiveMode } =
    useUIStore();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    fetchConversations();
  }, [searchQuery]);

  async function fetchConversations() {
    const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
    const res = await fetch(`/api/conversations${params}`);
    if (res.ok) setConversations(await res.json());
  }

  async function createChat() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const conv = await res.json();
      setActiveConversationId(conv.id);
      window.location.href = `/chat?id=${conv.id}`;
    }
  }

  async function updateConversation(id: string, data: Partial<Conversation>) {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchConversations();
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeConversationId === id) {
      setActiveConversationId(null);
      window.location.href = "/chat";
    }
    fetchConversations();
  }

  if (sidebarCollapsed) {
    return (
      <aside className="w-14 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-4 gap-2">
        <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(false)}>
          <PanelLeft className="h-4 w-4" />
        </Button>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setActiveMode(item.mode)}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          </Link>
        ))}
      </aside>
    );
  }

  return (
    <aside className="w-72 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <Link href="/chat" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight">AETDRIXZ AI</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(true)}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1 mb-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveMode(item.mode)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <Button className="w-full gap-2 mb-3" onClick={createChat}>
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input
            placeholder="Search chats..."
            className="pl-9 h-8"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchQuery(localSearch)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversationId === conv.id || pathname.includes(conv.id)}
              onSelect={() => {
                setActiveConversationId(conv.id);
                window.location.href = `/chat?id=${conv.id}`;
              }}
              onPin={() => updateConversation(conv.id, { pinned: !conv.pinned })}
              onArchive={() => updateConversation(conv.id, { archived: true })}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-zinc-800">
        <Button
          variant="outline"
          className="w-full gap-2 text-xs"
          onClick={() => setGlobalSearchOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          Global Search
          <kbd className="ml-auto text-zinc-500">⌘K</kbd>
        </Button>
      </div>
    </aside>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onPin,
  onArchive,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      layout
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-violet-600/15 text-violet-200" : "hover:bg-zinc-800/60 text-zinc-400"
      )}
      onClick={onSelect}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{conversation.title}</p>
        <p className="text-xs text-zinc-600">{formatRelativeTime(conversation.updatedAt)}</p>
      </div>
      {conversation.pinned && <Pin className="h-3 w-3 text-violet-400 shrink-0" />}
      <div className="relative opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 hover:bg-zinc-700 rounded"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[140px]">
            <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-zinc-800 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); onPin(); setMenuOpen(false); }}>
              <Pin className="h-3 w-3" /> {conversation.pinned ? "Unpin" : "Pin"}
            </button>
            <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-zinc-800 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); onArchive(); setMenuOpen(false); }}>
              <Archive className="h-3 w-3" /> Archive
            </button>
            <button className="w-full px-3 py-1.5 text-xs text-left hover:bg-zinc-800 text-red-400 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}>
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className={cn("hidden md:flex", !sidebarOpen && "md:hidden")}>
        <AppSidebar />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
