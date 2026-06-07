"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { MonacoPanel } from "@/components/workspace/monaco-panel";
import { LivePreview } from "@/components/workspace/live-preview";
import { FileTree } from "@/components/workspace/file-tree";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useChatStore } from "@/stores/chat-store";
import { GlobalSearch } from "@/components/shared/global-search";
import { Button } from "@/components/ui/button";
import { Code2, Eye, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkspacePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const {
    project,
    files,
    setProject,
    setFiles,
    openTab,
    showEditor,
    showPreview,
    setShowEditor,
    setShowPreview,
  } = useWorkspaceStore();
  const { setActiveConversationId } = useChatStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"editor" | "preview">("editor");

  useEffect(() => {
    loadProject();
    createWorkspaceChat();
  }, [projectId]);

  async function loadProject() {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      setFiles(data.files ?? []);
      if (data.files?.length > 0) {
        openTab(data.files[0].path);
      }
    }
  }

  async function createWorkspaceChat() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `${project?.name ?? "Workspace"} Chat` }),
    });
    if (res.ok) {
      const conv = await res.json();
      setConversationId(conv.id);
      setActiveConversationId(conv.id);
    }
  }

  const saveFile = useCallback(
    async (path: string, content: string) => {
      await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
    },
    [projectId]
  );

  async function handleCreateFile(path: string) {
    await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", path, content: "" }),
    });
    await loadProject();
    openTab(path);
  }

  async function handleDeleteFile(path: string) {
    await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", path }),
    });
    await loadProject();
  }

  function handleProjectFilesGenerated(
    newFiles: { path: string; content: string }[]
  ) {
    setFiles(
      files.map((f) => {
        const updated = newFiles.find((nf) => nf.path === f.path);
        return updated ? { ...f, content: updated.content } : f;
      }).concat(
        newFiles
          .filter((nf) => !files.some((f) => f.path === nf.path))
          .map((nf) => ({
            id: nf.path,
            projectId,
            path: nf.path,
            content: nf.content,
            updatedAt: new Date().toISOString(),
          }))
      )
    );
    if (newFiles.length > 0) openTab(newFiles[0].path);
    loadProject();
  }

  return (
    <AppShell>
      <GlobalSearch />
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950/80">
          <div>
            <h1 className="text-sm font-medium text-zinc-200">{project?.name ?? "Workspace"}</h1>
            <p className="text-xs text-zinc-500">{files.length} files</p>
          </div>
          <div className="flex gap-1 md:hidden">
            <Button
              variant={panel === "editor" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPanel("editor")}
            >
              <Code2 className="h-4 w-4" />
            </Button>
            <Button
              variant={panel === "preview" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPanel("preview")}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Chat Panel */}
          <div className="w-full md:w-[380px] lg:w-[420px] border-r border-zinc-800 flex flex-col min-h-0">
            <ChatInterface
              conversationId={conversationId}
              projectId={projectId}
              onProjectFilesGenerated={handleProjectFilesGenerated}
            />
          </div>

          {/* File Tree + Editor + Preview */}
          <div className="hidden md:flex flex-1 min-w-0">
            <div className="w-48 border-r border-zinc-800 shrink-0">
              <FileTree onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} />
            </div>
            <div className="flex-1 flex min-w-0">
              {showEditor && (
                <div className="flex-1 min-w-0 border-r border-zinc-800">
                  <MonacoPanel onSave={saveFile} />
                </div>
              )}
              {showPreview && (
                <div className="flex-1 min-w-0">
                  <LivePreview />
                </div>
              )}
            </div>
          </div>

          {/* Mobile/Tablet editor/preview toggle */}
          <div className="flex md:hidden flex-1 min-w-0">
            {panel === "editor" ? (
              <MonacoPanel onSave={saveFile} className="flex-1" />
            ) : (
              <LivePreview className="flex-1" />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
