"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  FolderKanban,
  Copy,
  Trash2,
  Download,
  Upload,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlobalSearch } from "@/components/shared/global-search";
import { formatRelativeTime } from "@/lib/utils";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [search]);

  async function fetchProjects() {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/projects${params}`);
    if (res.ok) setProjects(await res.json());
  }

  async function createProject() {
    if (!newName.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setCreateOpen(false);
      setNewName("");
      fetchProjects();
    }
  }

  async function duplicateProject(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate" }),
    });
    fetchProjects();
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  }

  async function importProject() {
    try {
      const data = JSON.parse(importJson);
      await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setImportOpen(false);
      setImportJson("");
      fetchProjects();
    } catch {
      alert("Invalid JSON format");
    }
  }

  return (
    <AppShell>
      <GlobalSearch />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-100">Projects</h1>
              <p className="text-zinc-500 mt-1">Build websites and applications with AI</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" /> Import
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Project
              </Button>
            </div>
          </div>

          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-6 max-w-md"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 hover:border-violet-500/30 hover:bg-zinc-900/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
                    <FolderKanban className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateProject(project.id)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <a href={`/api/projects/${project.id}/export`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteProject(project.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-medium text-zinc-100 mb-1">{project.name}</h3>
                <p className="text-xs text-zinc-500 mb-4">
                  {project._count?.files ?? 0} files · {formatRelativeTime(project.updatedAt)}
                </p>
                <Link href={`/workspace/${project.id}`}>
                  <Button variant="secondary" className="w-full gap-2">
                    <ExternalLink className="h-3.5 w-3.5" /> Open Workspace
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No projects yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createProject()}
          />
          <Button onClick={createProject} disabled={!newName.trim()}>Create</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Project</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full h-40 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-100 font-mono"
            placeholder='{"name": "My Project", "files": [{"path": "index.html", "content": "..."}]}'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
          />
          <Button onClick={importProject}>Import</Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
