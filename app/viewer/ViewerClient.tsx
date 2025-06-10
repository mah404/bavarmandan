"use client";

import { useSearchParams } from "next/navigation";

export default function ViewerClient() {
  const params = useSearchParams();
  const url = params.get("url");

  if (!url) return <p>PDF not found</p>;

  return (
    <div className="h-screen w-screen p-4">
      <iframe
        src={url}
        title="PDF Viewer"
        className="w-full h-full border rounded"
      />
    </div>
  );
}
