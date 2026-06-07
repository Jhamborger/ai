"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Square,
  RotateCcw,
  Pencil,
  Download,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { useChatStore } from "@/stores/chat-store";
import { stripProjectJsonFromContent } from "@/lib/ai/project-parser";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface ChatInterfaceProps {
  conversationId: string | null;
  projectId?: string;
  onProjectFilesGenerated?: (files: { path: string; content: string }[]) => void;
}

export function ChatInterface({
  conversationId,
  projectId,
  onProjectFilesGenerated,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    messages,
    setMessages,
    isStreaming,
    streamingContent,
    setIsStreaming,
    appendStreamingContent,
    resetStreamingContent,
    addMessage,
    updateMessage,
    settings,
  } = useChatStore();

  useEffect(() => {
    if (conversationId) loadConversation(conversationId);
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function loadConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
  }

  async function sendMessage(regenerate = false) {
    const text = regenerate ? messages.filter((m) => m.role === "user").at(-1)?.content ?? "" : input.trim();
    if (!text || isStreaming) return;

    if (!regenerate) {
      setInput("");
      addMessage({
        id: `temp-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      });
    }

    setIsStreaming(true);
    resetStreamingContent();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          projectId,
          regenerate,
          settings: settings.ai,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Chat request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let newConversationId = conversationId;
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "start" && data.conversationId) {
            newConversationId = data.conversationId;
            if (!conversationId) {
              window.history.replaceState({}, "", `/chat?id=${data.conversationId}`);
            }
          }
          if (data.type === "token") {
            accumulated += data.content;
            appendStreamingContent(data.content);
          }
          if (data.type === "done") {
            if (data.projectFiles && onProjectFilesGenerated) {
              onProjectFilesGenerated(data.projectFiles);
            }
          }
        }
      }

      if (newConversationId) {
        await loadConversation(newConversationId);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        addMessage({
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Error: ${(err as Error).message}`,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsStreaming(false);
      resetStreamingContent();
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  async function saveEdit(messageId: string) {
    await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    updateMessage(messageId, editContent);
    setEditingId(null);
  }

  const displayMessages = isStreaming && streamingContent
    ? [...messages, { id: "streaming", role: "assistant" as const, content: streamingContent, createdAt: "" }]
    : messages;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 md:px-8">
        <div className="max-w-3xl mx-auto py-8 space-y-6">
          {displayMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 mb-6">
                <Sparkles className="h-8 w-8 text-violet-400" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-2">
                Welcome to AETDRIXZ AI
              </h2>
              <p className="text-zinc-500 max-w-md mx-auto">
                Your personal AI workspace. Chat, build websites, generate apps, and remember everything.
              </p>
            </motion.div>
          )}

          {displayMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={msg.id === "streaming"}
              editing={editingId === msg.id}
              editContent={editContent}
              onEdit={() => {
                setEditingId(msg.id);
                setEditContent(msg.content);
              }}
              onEditChange={setEditContent}
              onSaveEdit={() => saveEdit(msg.id)}
              onCancelEdit={() => setEditingId(null)}
              onRegenerate={msg.role === "assistant" ? () => sendMessage(true) : undefined}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-zinc-900/80 border border-zinc-700 rounded-xl p-2 focus-within:border-violet-500/50 transition-colors">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message AETDRIXZ AI..."
              className="min-h-[44px] max-h-[200px] border-0 bg-transparent focus-visible:ring-0 resize-none"
              rows={1}
            />
            {isStreaming ? (
              <Button variant="secondary" size="icon" onClick={stopStreaming}>
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-zinc-600 text-center mt-2">
            AETDRIXZ AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming,
  editing,
  editContent,
  onEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onRegenerate,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  editing?: boolean;
  editContent?: string;
  onEdit?: () => void;
  onEditChange?: (v: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === "user";
  const displayContent = isUser
    ? message.content
    : stripProjectJsonFromContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-4", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-medium",
          isUser
            ? "bg-violet-600 text-white"
            : "bg-zinc-800 text-zinc-300 border border-zinc-700"
        )}
      >
        {isUser ? "You" : "AI"}
      </div>
      <div className={cn("flex-1 min-w-0", isUser && "text-right")}>
        {editing ? (
          <div className="space-y-2">
            <Textarea value={editContent} onChange={(e) => onEditChange?.(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSaveEdit}>Save</Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "inline-block text-left rounded-xl px-4 py-3 max-w-full",
              isUser ? "bg-violet-600/15 border border-violet-500/20" : "bg-zinc-900/50"
            )}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
            ) : (
              <MarkdownRenderer content={displayContent || (isStreaming ? "▋" : "")} />
            )}
          </div>
        )}
        {!editing && !isStreaming && (
          <div className={cn("flex gap-1 mt-1", isUser && "justify-end")}>
            {isUser && onEdit && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
            )}
            {!isUser && onRegenerate && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRegenerate}>
                <RotateCcw className="h-3 w-3 mr-1" /> Regenerate
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
