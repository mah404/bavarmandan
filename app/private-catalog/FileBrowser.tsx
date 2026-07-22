"use client";

import { useState } from "react";
import { ChevronDown, FileDown, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export type BrowseItem = {
  name: string;
  type: "folder" | "file";
  children?: BrowseItem[];
  sizeBytes?: number;
  downloadUrl?: string;
};

type BrowseTree = Record<string, BrowseItem[]>;

type FileBrowserProps = {
  tree: BrowseTree;
};

function formatSize(sizeBytes?: number) {
  if (!sizeBytes) return "";
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}

function TreeItem({ item, depth = 0 }: { item: BrowseItem; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const isFolder = item.type === "folder";
  const children = item.children || [];

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

  return (
    <div className="space-y-2" style={{ marginLeft: depth * 16 }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-xl border border-secondary bg-background/50 px-4 py-3 text-left text-sm font-bold text-foreground transition hover:border-primary/40 hover:text-primary"
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

export function FileBrowser({ tree }: FileBrowserProps) {
  const sections = Object.entries(tree);

  if (sections.length === 0) {
    return (
      <p className="rounded-xl bg-background/70 p-4 text-sm text-muted-foreground">
        No files found.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map(([sectionName, items]) => (
        <section key={sectionName} className="rounded-2xl border border-secondary p-4">
          <h2 className="mb-4 text-lg font-bold capitalize text-primary">
            {sectionName}
          </h2>
          <div className="space-y-2">
            {items.map((item) => (
              <TreeItem
                key={`${sectionName}-${item.name}-${item.downloadUrl || ""}`}
                item={item}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
