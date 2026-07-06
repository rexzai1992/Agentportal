/**
 * Triggers a browser download from an authenticated GET/POST endpoint that
 * returns a binary (e.g. XLSX export). Bypasses apiFetch (which is JSON-only).
 */
export async function downloadFile(
  url: string,
  init?: RequestInit,
  fallbackName = "download"
): Promise<void> {
  const response = await fetch(url, { credentials: "include", ...init });

  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {
      // non-JSON error body; keep default message
    }
    throw new Error(message);
  }

  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match?.[1] || fallbackName;

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
