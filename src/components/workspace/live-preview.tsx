"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, AlertCircle, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPreviewDocument } from "@/lib/ai/project-parser";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";

interface LivePreviewProps {
  className?: string;
  autoRefresh?: boolean;
}

export function LivePreview({ className, autoRefresh = true }: LivePreviewProps) {
  const { files, previewHtml, setPreviewHtml } = useWorkspaceStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!autoRefresh) return;
    try {
      const html = buildPreviewDocument(files);
      setPreviewHtml(html);
      setError(null);
      setKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview error");
    }
  }, [files, autoRefresh, setPreviewHtml]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow) return;

        iframeWindow.onerror = (msg) => {
          setError(String(msg));
          return true;
        };
      } catch {
        // cross-origin restrictions in sandbox
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [key]);

  function refresh() {
    setKey((k) => k + 1);
    setError(null);
  }

  return (
    <div className={cn("flex flex-col h-full bg-zinc-950", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Monitor className="h-3.5 w-3.5" />
          Live Preview
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={refresh}>
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-950/50 border-b border-red-900/50 text-red-400 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex-1 bg-white">
        <iframe
          key={key}
          ref={iframeRef}
          srcDoc={previewHtml}
          sandbox="allow-scripts allow-modals"
          className="w-full h-full border-0"
          title="Project Preview"
        />
      </div>
    </div>
  );
}
