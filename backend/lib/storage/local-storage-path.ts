import path from "node:path";
import { getStringEnv } from "@/backend/lib/env";
import { getAbsolutePath } from "@/backend/storage/disk/local/utils";

const DEFAULT_STORAGE_DIR = "storage";

function getConfiguredStoragePath(): string {
  return getStringEnv("LOCAL_STORAGE_PATH") ?? `./${DEFAULT_STORAGE_DIR}/`;
}

export function getLocalStorageBasePath(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), getConfiguredStoragePath());
}

export function resolveLocalStoragePath(relativePath: string): string {
  const basePath = getLocalStorageBasePath();
  return getAbsolutePath(basePath, relativePath);
}

export function resolvePublicStoragePath(subPath: string): string {
  const basePath = getLocalStorageBasePath();
  const publicRoot = path.join(/* turbopackIgnore: true */ basePath, "public");
  return getAbsolutePath(publicRoot, subPath);
}
