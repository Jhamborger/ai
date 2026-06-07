import type { StructuredProjectOutput } from "@/types";

export function parseProjectOutput(content: string): StructuredProjectOutput | null {
  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates: string[] = [];

  if (jsonBlockMatch?.[1]) {
    candidates.push(jsonBlockMatch[1].trim());
  }

  const rawJsonMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (rawJsonMatch?.[0]) {
    candidates.push(rawJsonMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as StructuredProjectOutput;
      if (parsed?.files && Array.isArray(parsed.files)) {
        return {
          files: parsed.files.filter(
            (f) => f.path && typeof f.content === "string"
          ),
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function stripProjectJsonFromContent(content: string): string {
  return content
    .replace(/```(?:json)?\s*\{[\s\S]*?"files"[\s\S]*?\}\s*```/g, "")
    .trim();
}

export function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    md: "markdown",
    py: "python",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    svg: "xml",
  };
  return map[ext] ?? "plaintext";
}

export function buildPreviewDocument(
  files: { path: string; content: string }[]
): string {
  const byPath = Object.fromEntries(files.map((f) => [f.path.replace(/\\/g, "/"), f.content]));

  const htmlFile =
    byPath["index.html"] ??
    byPath["public/index.html"] ??
    Object.entries(byPath).find(([p]) => p.endsWith(".html"))?.[1];

  if (!htmlFile) {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;background:#111;color:#eee"><p>No HTML entry point found. Add an index.html to preview.</p></body></html>`;
  }

  let html = htmlFile;

  const cssFiles = Object.entries(byPath).filter(([p]) => p.endsWith(".css"));
  const jsFiles = Object.entries(byPath).filter(
    ([p]) => p.endsWith(".js") && !p.includes("node_modules")
  );

  if (cssFiles.length > 0 && !html.includes("<style")) {
    const inlineCss = cssFiles.map(([, c]) => c).join("\n");
    html = html.replace("</head>", `<style>${inlineCss}</style></head>`);
    if (!html.includes("</head>")) {
      html = html.replace("<body", `<style>${inlineCss}</style><body`);
    }
  }

  if (jsFiles.length > 0 && !html.includes("<script")) {
    const inlineJs = jsFiles.map(([, c]) => c).join("\n");
    html = html.replace("</body>", `<script>${inlineJs}</script></body>`);
  }

  return html;
}
