import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// The picture shown when a link to the site is shared (Telegram, WhatsApp, X, Google Discover…): 1200×630, the logo
// on the site's own dark green. It has no Persian text on purpose: drawing Persian needs a font file at build time.
export const runtime = "nodejs";
export const alt = "مجمع باورمندان";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "mainicon.jpg"));
  const source = `data:image/jpeg;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(135deg, #0b3a33 0%, #082b26 55%, #04170f 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={source} width={360} height={360} alt="" style={{ borderRadius: 72, border: "4px solid #f4d447" }} />
        <div style={{ display: "flex", fontSize: 44, color: "#f4d447", letterSpacing: 4 }}>bavarmandan.com</div>
      </div>
    ),
    size
  );
}
