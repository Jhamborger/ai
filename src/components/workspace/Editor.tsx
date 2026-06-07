'use client';

import React from 'react';
import Editor from '@monaco-editor/react';
import { useWorkspaceStore } from '@/store/use-workspace-store';

interface EditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
  language: string;
  path: string;
}

export function CodeEditor({ content, onChange, language, path }: EditorProps) {
  return (
    <div className="h-full w-full flex flex-col bg-zinc-900">
      <div className="p-2 px-4 bg-zinc-800 text-zinc-400 text-xs font-mono flex justify-between items-center border-b border-zinc-700">
        <span>{path}</span>
        <span className="uppercase">{language}</span>
      </div>
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={content}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 16 },
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        }}
      />
    </div>
  );
}
