import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AUDIO_CATALOG_URL, MEDIA_BROWSE_URL } from "@/lib/media-api";
import { FileBrowser, type BrowseItem } from "./FileBrowser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Private Catalog",
  robots: {
    index: false,
    follow: false,
  },
};

type PrivateCatalogPageProps = {
  searchParams?: {
    key?: string;
  };
};

type BrowseTree = Record<string, BrowseItem[]>;

async function getCatalog() {
  if (!AUDIO_CATALOG_URL) {
    throw new Error("MEDIA_API_BASE is not configured.");
  }

  const response = await fetch(AUDIO_CATALOG_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Catalog fetch failed with status ${response.status}.`);
  }

  return response.json();
}

async function getBrowseTree(): Promise<BrowseTree> {
  if (!MEDIA_BROWSE_URL) {
    throw new Error("MEDIA_API_BASE is not configured.");
  }

  const response = await fetch(MEDIA_BROWSE_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Browse fetch failed with status ${response.status}.`);
  }

  return response.json();
}

export default async function PrivateCatalogPage({
  searchParams,
}: PrivateCatalogPageProps) {
  const secret = process.env.PRIVATE_CATALOG_SECRET;

  if (!secret || searchParams?.key !== secret) {
    notFound();
  }

  let catalog: unknown = null;
  let browseTree: BrowseTree = {};
  let error = "";
  let browseError = "";

  try {
    catalog = await getCatalog();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  try {
    browseTree = await getBrowseTree();
  } catch (err) {
    browseError = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground" dir="ltr">
      <section className="mx-auto max-w-6xl rounded-2xl border border-secondary bg-card/80 p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 border-b border-secondary pb-4">
          <p className="text-sm font-semibold text-primary">Private</p>
          <h1 className="text-2xl font-bold">Live Audio Catalog</h1>
          <p className="text-sm text-muted-foreground">
            This page fetches directly from the configured backend API and is hidden
            unless the correct secret key is provided.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold">File Browser</h2>
            {browseError ? (
              <pre className="overflow-auto rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                {browseError}
              </pre>
            ) : (
              <FileBrowser tree={browseTree} />
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Raw Audio Catalog JSON</h2>
            {error ? (
              <pre className="overflow-auto rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </pre>
            ) : (
              <pre className="max-h-[70vh] overflow-auto rounded-xl bg-background/80 p-4 text-xs leading-6 text-foreground">
                {JSON.stringify(catalog, null, 2)}
              </pre>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
