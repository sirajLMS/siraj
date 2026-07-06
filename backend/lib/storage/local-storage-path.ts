import path from "node:path";

const DEFAULT_STORAGE_DIR = "storage";

function getConfiguredStoragePath(): string {
  return process.env.LOCAL_STORAGE_PATH ?? `./${DEFAULT_STORAGE_DIR}/`;
}

export function getLocalStorageBasePath(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), getConfiguredStoragePath());
}

export function resolveLocalStoragePath(relativePath: string): string {
  const basePath = getLocalStorageBasePath();
  const resolvedPath = path.resolve(/* turbopackIgnore: true */ basePath, relativePath);
  const relativeToBase = path.relative(basePath, resolvedPath);

  if (relativeToBase.startsWith("..") || path.isAbsolute(relativeToBase)) {
    throw new Error("Path traversal detected");
  }

  return resolvedPath;
}

export function resolvePublicStoragePath(subPath: string): string {
  return path.join(/* turbopackIgnore: true */ getLocalStorageBasePath(), "public", subPath);
}
