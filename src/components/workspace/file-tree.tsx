"use client";

import {
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  onCreateFile?: (path: string) => void;
  onDeleteFile?: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of paths.sort()) {
    const parts = path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFolder = i < parts.length - 1;
      const nodePath = parts.slice(0, i + 1).join("/");

      let node = current.find((n) => n.name === name);
      if (!node) {
        node = { name, path: nodePath, isFolder, children: [] };
        current.push(node);
      }
      current = node.children;
    }
  }

  return root;
}

export function FileTree({ onCreateFile, onDeleteFile }: FileTreeProps) {
  const { files, activeFilePath, openTab } = useWorkspaceStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const tree = buildTree(files.map((f) => f.path));

  function toggleExpand(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function renderNode(node: TreeNode, depth = 0) {
    const isExpanded = expanded.has(node.path);
    const isActive = activeFilePath === node.path;

    if (node.isFolder) {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleExpand(node.path)}
            className="flex items-center gap-1 w-full px-2 py-1 text-xs hover:bg-zinc-800 rounded"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-zinc-500" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="text-zinc-400">{node.name}</span>
          </button>
          {isExpanded && node.children.map((c) => renderNode(c, depth + 1))}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={cn(
          "flex items-center gap-1 group px-2 py-1 text-xs rounded cursor-pointer",
          isActive ? "bg-violet-600/20 text-violet-200" : "hover:bg-zinc-800 text-zinc-400"
        )}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        onClick={() => openTab(node.path)}
      >
        <File className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">{node.name}</span>
        <button
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteFile?.(node.path);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-400">Files</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {creating && (
        <div className="p-2 border-b border-zinc-800 flex gap-1">
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="path/to/file.ext"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFileName) {
                onCreateFile?.(newFileName);
                setNewFileName("");
                setCreating(false);
              }
            }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {tree.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
