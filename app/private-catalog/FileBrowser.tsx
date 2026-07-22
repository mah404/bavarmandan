"use client";

import { useState } from "react";
import { Archive, ChevronDown, FileDown, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export type BrowseItem = {
  name: string;
  type: "folder" | "file";
  children?: BrowseItem[] | Record<string, BrowseItem[] | BrowseItem>;
  sizeBytes?: number;
  downloadUrl?: string;
};

type BrowseTree = Record<string, BrowseItem[] | BrowseItem> | BrowseItem[];

type FileBrowserProps = {
  tree: BrowseTree;
  secretKey: string;
};

function formatSize(sizeBytes?: number) {
  if (!sizeBytes) return "";
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}

function isBrowseItem(value: unknown): value is BrowseItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value
  );
}

function normalizeItems(value: unknown, fallbackName?: string): BrowseItem[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(isBrowseItem).map((item) => ({
      ...item,
      name: item.name,
      children: item.type === "folder" ? normalizeItems(item.children) : undefined,
    }));
  }

  if (isBrowseItem(value)) {
    return [
      {
        ...value,
        name: value.name || fallbackName || "untitled",
        children:
          value.type === "folder" ? normalizeItems(value.children) : undefined,
      },
    ];
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([name, item]) => {
      if (isBrowseItem(item)) {
        return {
          ...item,
          name: item.name || name,
          children:
            item.type === "folder" ? normalizeItems(item.children) : undefined,
        };
      }

      return {
        name,
        type: "folder" as const,
        children: normalizeItems(item, name),
      };
    });
  }

  return [];
}

function TreeItem({
  item,
  depth = 0,
  zipUrl,
}: {
  item: BrowseItem;
  depth?: number;
  zipUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState("");
  const isFolder = item.type === "folder";
  const children = normalizeItems(item.children);

  if (!isFolder) {
    return (
      <div
        className="flex flex-col gap-3 rounded-xl border border-secondary bg-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold text-foreground">
            {item.name}
          </p>
          {item.sizeBytes ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatSize(item.sizeBytes)}
            </p>
          ) : null}
        </div>

        {item.downloadUrl ? (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <a href={item.downloadUrl} download rel="noopener noreferrer">
              <FileDown className="mr-2 size-4" />
              Download
            </a>
          </Button>
        ) : null}
      </div>
    );
  }

  const isRoot = depth === 0 && !!zipUrl;

  async function downloadZip() {
    if (!zipUrl || zipLoading) return;

    setZipLoading(true);
    setZipError("");

    try {
      const response = await fetch(zipUrl, { cache: "no-store" });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "bavarmandan-media.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setZipError(error instanceof Error ? error.message : "ZIP download failed.");
    } finally {
      setZipLoading(false);
    }
  }

  return (
    <div className="space-y-2" style={{ marginLeft: depth * 16 }}>
      <div className="flex w-full flex-col gap-3 rounded-xl border border-secondary bg-background/50 px-4 py-3 text-left text-sm font-bold text-foreground transition hover:border-primary/40 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-3 transition hover:text-primary"
        >
          <ChevronDown
            className={[
              "size-4 shrink-0 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
          {open ? (
            <FolderOpen className="size-5 shrink-0 text-primary" />
          ) : (
            <Folder className="size-5 shrink-0 text-primary" />
          )}
          <span className="break-all">{item.name}</span>
          <span className="ml-auto text-xs font-medium text-muted-foreground">
            {children.length} items
          </span>
        </button>

        {isRoot ? (
          <Button
            type="button"
            size="sm"
            className="shrink-0 text-card"
            disabled={zipLoading}
            onClick={downloadZip}
          >
            <Archive className="mr-2 size-4" />
            {zipLoading ? "Preparing..." : "Download ZIP"}
          </Button>
        ) : null}
      </div>

      {zipError ? (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {zipError}
        </p>
      ) : null}

      {open ? (
        <div className="space-y-2">
          {children.map((child) => (
            <TreeItem
              key={`${depth}-${item.name}-${child.name}-${child.downloadUrl || ""}`}
              item={child}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FileBrowser({ tree, secretKey }: FileBrowserProps) {
  const rootChildren = normalizeItems(tree);

  if (rootChildren.length === 0) {
    return (
      <p className="rounded-xl bg-background/70 p-4 text-sm text-muted-foreground">
        No files found.
      </p>
    );
  }

  const rootFolder: BrowseItem = {
    name: "media-server",
    type: "folder",
    children: rootChildren,
  };

  return (
    <TreeItem
      item={rootFolder}
      zipUrl={`/api/private-download-zip?key=${encodeURIComponent(secretKey)}`}
    />
  );
}
