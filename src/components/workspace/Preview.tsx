'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/use-workspace-store';

export function Preview() {
  const { currentProjectId } = useWorkspaceStore();

  if (!currentProjectId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-zinc-500">
        Select a project to preview
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white">
      <iframe
        src={`/api/preview/${currentProjectId}`}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-forms"
      />
    </div>
  );
}
