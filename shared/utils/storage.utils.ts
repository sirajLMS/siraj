// Whitelist of allowed MIME types for uploads
export const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
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

// Map MIME types to file extensions
export const mimeToExtensions: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg", ".jpe"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/plain": [".txt", ".text"],
  "application/zip": [".zip"],
  "application/vnd.rar": [".rar"],
  "video/mp4": [".mp4"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "font/otf": [".otf"],
  "font/ttf": [".ttf"],
  "font/woff": [".woff"],
  "font/woff2": [".woff2"],
};

/**
 * Infer MIME type from a File object
 * Checks browser-detected MIME type first, falls back to extension
 */
export const inferContentType = (file: File): string => {
  // Try to use browser-detected MIME type if it's in our allowed list
  if (file.type && isAllowedMimeType(file.type)) {
    return file.type;
  }

  // Fallback: infer from extension
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext && extToMime[ext]) {
    return extToMime[ext];
  }

  // Default fallback
  return "text/plain";
};
