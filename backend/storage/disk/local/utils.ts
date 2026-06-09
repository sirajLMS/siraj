import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { StorageValidationError } from "../storage.service.interface";

export function cleanLocalPath(inputPath: string): string {
  if (!inputPath || inputPath.length === 0) {
    return "";
  }
  return inputPath.replace(/^\/+/, "").replace(/\/$/, "");
}

export function getAbsolutePath(basePath: string, relativePath: string): string {
  const resolvedPath = path.resolve(basePath, relativePath);
  const relativeToBase = path.relative(basePath, resolvedPath);

  if (relativeToBase.startsWith("..") || path.isAbsolute(relativeToBase)) {
    throw new StorageValidationError("Path traversal detected");
  }

  return resolvedPath;
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
}

export async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("base64");
}
