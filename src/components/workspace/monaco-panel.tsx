"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { getLanguageFromPath } from "@/lib/ai/project-parser";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface MonacoPanelProps {
  className?: string;
  onSave?: (path: string, content: string) => void;
}

export function MonacoPanel({ className, onSave }: MonacoPanelProps) {
  const {
    files,
    openTabs,
    activeFilePath,
    unsavedChanges,
    setActiveFilePath,
    closeTab,
    updateFileContent,
    markUnsaved,
    clearUnsaved,
  } = useWorkspaceStore();

  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const activeFile = files.find((f) => f.path === activeFilePath);
  const content =
    (activeFilePath && unsavedChanges[activeFilePath]) ??
    activeFile?.content ??
    "";

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!activeFilePath || value === undefined) return;
      updateFileContent(activeFilePath, value);
      markUnsaved(activeFilePath, value);

      if (saveTimeoutRef.current[activeFilePath]) {
        clearTimeout(saveTimeoutRef.current[activeFilePath]);
      }

      saveTimeoutRef.current[activeFilePath] = setTimeout(() => {
        onSave?.(activeFilePath, value);
        clearUnsaved(activeFilePath);
      }, 1000);
    },
    [activeFilePath, updateFileContent, markUnsaved, clearUnsaved, onSave]
  );

  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  if (!activeFilePath) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-zinc-950 text-zinc-500", className)}>
        Select a file to edit
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-zinc-950", className)}>
      <div className="flex items-center border-b border-zinc-800 overflow-x-auto">
        {openTabs.map((tab) => {
          const isActive = tab === activeFilePath;
          const isUnsaved = tab in unsavedChanges;
          return (
            <button
              key={tab}
              onClick={() => setActiveFilePath(tab)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs border-r border-zinc-800 shrink-0 transition-colors",
                isActive ? "bg-zinc-900 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {isUnsaved && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
              {tab.split("/").pop()}
              <X
                className="h-3 w-3 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab);
                }}
              />
            </button>
          );
        })}
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={getLanguageFromPath(activeFilePath)}
          value={content}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--font-geist-mono), monospace",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
