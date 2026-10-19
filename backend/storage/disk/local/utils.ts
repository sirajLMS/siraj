import crypto from "node:crypto";
import { createReadStream, lstatSync, realpathSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { StorageValidationError } from "@/backend/storage/disk/storage.service.interface";

export function cleanLocalPath(inputPath: string): string {
  if (!inputPath || inputPath.length === 0) {
    return "";
  }
  return inputPath.replace(/^\/+/, "").replace(/\/$/, "");
}

function assertContained(basePath: string, candidatePath: string): void {
  const relative = path.relative(basePath, candidatePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new StorageValidationError("Path traversal detected");
  }
}

/**
 * Resolve a relative path under a base directory, rejecting lexical escapes
 * and symlinks that resolve outside the real base directory. Paths that do
 * not exist yet (e.g. upload destinations) fall back to the closest existing
 * ancestor so planted symlinked directories are still caught; if nothing on
 * the chain exists there is nothing to dereference and the lexical check
 * stands.
 */
export function getAbsolutePath(basePath: string, relativePath: string): string {
  if (relativePath.includes("\0") || relativePath.toLowerCase().includes("%00")) {
    throw new StorageValidationError("Path traversal attempt detected: null byte in path");
  }
  const resolvedPath = path.resolve(basePath, relativePath);
  assertContained(basePath, resolvedPath);

  try {
    assertContained(realpathSync(basePath), realpathSync(resolvedPath));
  } catch (error) {
    if (error instanceof StorageValidationError) {
      throw error;
    }
    try {
      assertContained(
        realpathSync(basePath),
        path.resolve(realpathSync(path.dirname(resolvedPath)), path.basename(resolvedPath))
      );
    } catch (ancestorError) {
      if (ancestorError instanceof StorageValidationError) {
        throw ancestorError;
      }
      // ENOENT here means a missing final component OR a dangling symlink; a
      // dangling symlink must not pass — the caller's open would follow it
      // outside the base — so reject when the final component is a symlink.
      if (lstatSync(resolvedPath, { throwIfNoEntry: false })?.isSymbolicLink()) {
        throw new StorageValidationError("Path traversal attempt detected: symlinked path component");
      }
    }
  }

  return resolvedPath;
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
}

export async function calculateFileHash(filePath: string): Promise<string> {
  const hash = crypto.createHash("sha256");
  const stream = createReadStream(filePath);

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest("base64");
}
