"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadFile,
  type UploadDocType,
  type UploadOwnerType,
  type UploadResult
} from "@/lib/upload";

interface FileUploadProps {
  label: string;
  docType: UploadDocType;
  ownerType: UploadOwnerType;
  ownerId?: string;
  required?: boolean;
  accept?: string;
  onUploaded: (result: UploadResult | null) => void;
}

const DEFAULT_ACCEPT = "image/jpeg,image/png,application/pdf";
const MAX_BYTES = 5 * 1024 * 1024;

export const FileUpload = ({
  label,
  docType,
  ownerType,
  ownerId,
  required,
  accept = DEFAULT_ACCEPT,
  onUploaded
}: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError("File too large. Maximum size is 5 MB.");
      return;
    }
    if (!accept.split(",").includes(file.type)) {
      setError("Unsupported file type. Only JPG, PNG and PDF are allowed.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile(file, { docType, ownerType, ownerId });
      setUploaded(result);
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      onUploaded(null);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploaded(null);
    setError(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>

      {uploaded ? (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
          <span className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span className="truncate">{uploaded.fileName}</span>
          </span>
          <button type="button" onClick={reset} className="text-slate-500 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm transition",
            dragging
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-200 bg-white/60 hover:border-emerald-300"
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
          ) : (
            <UploadCloud className="h-5 w-5 text-slate-400" />
          )}
          <span className="text-slate-500">
            {uploading ? "Uploading..." : "Drop file here or click to upload"}
          </span>
          <span className="text-[11px] text-slate-400">JPG, PNG or PDF, up to 5 MB</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
};
