// Whitelist of allowed MIME types for uploads
const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/vnd.rar",
  "video/mp4",
  "audio/mpeg",
  "audio/wav",
  "font/otf",
  "font/ttf",
  "font/woff",
  "font/woff2",
]);

export const isAllowedMimeType = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.has(mimeType);
};

// Map file extensions to MIME types
export const extToMime: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  text: "text/plain",
  zip: "application/zip",
  rar: "application/vnd.rar",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  otf: "font/otf",
  ttf: "font/ttf",
  woff: "font/woff",
  woff2: "font/woff2",
};

const FILE_NAME_PATTERN = /^[a-zA-Z0-9._\-\s()[\]]+$/;

export const validateFileName = (fileName: string): string | null => {
  if (!fileName || fileName.trim().length === 0) {
    return "File name cannot be empty";
  }
  if (!FILE_NAME_PATTERN.test(fileName)) {
    return "File name contains invalid characters";
  }
  if (fileName.length > 255) {
    return "File name is too long (max 255 characters)";
  }
  return null;
};
