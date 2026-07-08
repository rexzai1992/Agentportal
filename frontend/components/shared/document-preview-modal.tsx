"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading";

interface DocumentPreviewModalProps {
  documentId: string | null;
  title?: string;
  onClose: () => void;
}

interface PreviewState {
  url: string;
  contentType: string;
  fileName: string;
}

/**
 * Fetches a document from /api/documents/[id] and previews it in a modal:
 * images render inline, PDFs render in an embedded viewer, anything else
 * falls back to a download link.
 */
export const DocumentPreviewModal = ({ documentId, title, onClose }: DocumentPreviewModalProps) => {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    setPreview(null);
    setError(null);

    fetch(`/api/documents/${documentId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load the document");
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const disposition = res.headers.get("content-disposition") || "";
        const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "document";
        setPreview({
          url: objectUrl,
          contentType: res.headers.get("content-type") || blob.type || "",
          fileName
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load the document");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  const isImage = preview?.contentType.startsWith("image/");
  const isPdf = preview?.contentType.includes("pdf");

  return (
    <Modal
      open={Boolean(documentId)}
      onClose={onClose}
      title={title ?? preview?.fileName ?? "Document"}
      className="max-w-4xl"
    >
      {error ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : !preview ? (
        <LoadingState label="Loading document..." />
      ) : isImage ? (
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt={preview.fileName} className="mx-auto max-h-[70vh] w-auto" />
        </div>
      ) : isPdf ? (
        <iframe
          src={preview.url}
          title={preview.fileName}
          className="h-[70vh] w-full rounded-2xl border border-slate-200"
        />
      ) : (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>This file type cannot be previewed here.</p>
          <a
            href={preview.url}
            download={preview.fileName}
            className="mt-2 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Download {preview.fileName}
          </a>
        </div>
      )}
      {preview ? (
        <div className="mt-3 text-right">
          <a
            href={preview.url}
            download={preview.fileName}
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            Download
          </a>
        </div>
      ) : null}
    </Modal>
  );
};
