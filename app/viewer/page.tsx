"use client";

import { useSearchParams } from "next/navigation";

export default function PdfViewerPage() {
  const searchParams = useSearchParams();
  const pdfUrl = searchParams.get("pdf");

  if (!pdfUrl) {
    return <div className="p-4 text-red-500">PDF یافت نشد</div>;
  }

  return (
    <div className="w-full h-screen p-4">
      <iframe
        src={pdfUrl}
        className="w-full h-full border rounded"
        title="PDF Viewer"
      />
    </div>
  );
}
