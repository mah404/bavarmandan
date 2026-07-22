import { mediaBrowseUrlWithKey } from "@/lib/media-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type BrowseItem = {
  name: string;
  type: "folder" | "file";
  children?: BrowseItem[];
  downloadUrl?: string;
};

type BrowseTree = Record<string, BrowseItem[]> | BrowseItem[];

type ZipEntry = {
  path: string;
  data: Buffer;
  crc: number;
};

const textEncoder = new TextEncoder();

function sanitizePathPart(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

function collectFiles(items: BrowseItem[], prefix: string[] = []) {
  const files: { path: string; url: string }[] = [];

  for (const item of items) {
    const nextPrefix = [...prefix, sanitizePathPart(item.name)];

    if (item.type === "folder") {
      files.push(...collectFiles(item.children || [], nextPrefix));
      continue;
    }

    if (item.downloadUrl) {
      files.push({
        path: nextPrefix.join("/"),
        url: item.downloadUrl,
      });
    }
  }

  return files;
}

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }

  return table;
}

const crcTable = makeCrcTable();

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (let index = 0; index < buffer.length; index++) {
    crc = crcTable[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function uint32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

function createZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(textEncoder.encode(entry.path));
    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(entry.crc),
      uint32(entry.data.length),
      uint32(entry.data.length),
      uint16(name.length),
      uint16(0),
      name,
    ]);

    localParts.push(localHeader, entry.data);

    const centralHeader = Buffer.concat([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(entry.crc),
      uint32(entry.data.length),
      uint32(entry.data.length),
      uint16(name.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      name,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endOfCentralDirectory = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(entries.length),
    uint16(entries.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0),
  ]);

  return Buffer.concat([...localParts, centralDirectory, endOfCentralDirectory]);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.PRIVATE_CATALOG_SECRET;

  if (!secret || url.searchParams.get("key") !== secret) {
    return new Response("Not found", { status: 404 });
  }

  const browseUrl = mediaBrowseUrlWithKey(secret);

  if (!browseUrl) {
    return new Response("MEDIA_API_BASE is not configured", { status: 500 });
  }

  const browseResponse = await fetch(browseUrl, { cache: "no-store" });

  if (!browseResponse.ok) {
    return new Response("Could not load file tree", { status: 502 });
  }

  const tree = (await browseResponse.json()) as BrowseTree;
  const files = Array.isArray(tree)
    ? collectFiles(tree)
    : Object.entries(tree).flatMap(([sectionName, items]) =>
        collectFiles(items, [sectionName])
      );

  const entries: ZipEntry[] = [];

  for (const file of files) {
    const fileResponse = await fetch(file.url, { cache: "no-store" });
    if (!fileResponse.ok) continue;

    const arrayBuffer = await fileResponse.arrayBuffer();
    const data = Buffer.from(arrayBuffer);
    entries.push({
      path: file.path,
      data,
      crc: crc32(data),
    });
  }

  if (entries.length === 0) {
    return new Response("No downloadable files found", { status: 404 });
  }

  const zip = createZip(entries);

  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="bavarmandan-media.zip"',
      "Cache-Control": "no-store",
    },
  });
}
