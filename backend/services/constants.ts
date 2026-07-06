export const ACCESS_COOKIE = "wp_access_token";
export const REFRESH_COOKIE = "wp_refresh_token";

export const ACCESS_COOKIE_MAX_AGE = 60 * 15;
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// File upload (KPL/SSM docs, payment slips, announcement media)
export const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf"
] as const;
