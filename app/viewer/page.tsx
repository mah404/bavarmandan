"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ViewerPage() {
  const searchParams = useSearchParams();
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    const pdf = searchParams.get("pdf");
    if (pdf) {
      setPdfUrl(pdf);
    }
  }, [searchParams]);

  if (!pdfUrl) {
    return <p className="text-center mt-10">در حال بارگذاری فایل PDF...</p>;
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
