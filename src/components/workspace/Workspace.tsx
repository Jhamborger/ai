'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/use-workspace-store';
import { CodeEditor } from './Editor';
import { Preview } from './Preview';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { FileCode, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Workspace() {
  const { currentProjectId, setActiveFile, activeFile } = useWorkspaceStore();
  const [files, setFiles] = useState<any[]>([]);
  const [activeFileContent, setActiveFileContent] = useState('');

  useEffect(() => {
    if (currentProjectId) {
      fetch(`/api/projects/${currentProjectId}/files`)
        .then(res => res.json())
        .then(data => setFiles(data));
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (activeFile && files.length > 0) {
      const file = files.find(f => f.path === activeFile);
      if (file) setActiveFileContent(file.content);
    }
  }, [activeFile, files]);

  const handleFileChange = async (content: string | undefined) => {
    if (!activeFile || !currentProjectId) return;
    setActiveFileContent(content || '');
    await fetch(`/api/projects/${currentProjectId}/files`, {
      method: 'PUT',
      body: JSON.stringify({ path: activeFile, content }),
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Project Explorer */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col">
        <div className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
          Explorer
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.map(file => (
            <div
              key={file.id}
              onClick={() => setActiveFile(file.path)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors',
                activeFile === file.path ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <FileCode size={14} />
              <span className="truncate">{file.path}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Pane */}
      <div className="w-1/3 border-r border-zinc-800 h-full">
        <ChatWindow />
      </div>

      {/* Editor Pane */}
      <div className="flex-1 h-full relative">
        {activeFile ? (
          <CodeEditor
            path={activeFile}
            content={activeFileContent}
            language={activeFile.split('.').pop() || 'javascript'}
            onChange={handleFileChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500">
            Select a file to edit
          </div>
        )}
      </div>

      {/* Preview Pane */}
      <div className="w-1/3 border-l border-zinc-800 h-full">
        <Preview />
      </div>
    </div>
  );
}
