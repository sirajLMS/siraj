#!/usr/bin/env bun
/**
 * Sanitize prebuilt deployment refs after `vercel build` (postbuild).
 *
 * The @vercel/next builder records every traced repo file in each function's
 * `.vc-config.json` `filePathMap`. When deploying with `vercel deploy
 * --prebuilt`, the CLI re-adds those paths to the upload list (buildFileTree
 * prebuilt refs), which bypasses the `.vercelignore` filter that applies only
 * to the directory walk. Any traced path that does not exist in the working
 * tree (logs/, scratch/ and other runtime-only output, or files removed since
 * the build) then fails the archive step with:
 *   ENOENT: no such file or directory, lstat '/vercel/path0/...'
 *
 * This script drops filePathMap entries whose target does not exist on disk.
 * filePathMap values are repo-relative source refs consumed only as upload
 * refs — the function launcher never reads them — so pruning is runtime-safe.
 * Stray `.nft.json` trace files under the output (non-adapter consumers) are
 * pruned the same way.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const OUTPUT_DIR = join(process.cwd(), ".vercel", "output");
const FUNCTIONS_DIR = join(OUTPUT_DIR, "functions");

interface VcConfig {
  filePathMap?: Record<string, string>;
  [key: string]: unknown;
}

function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

function sanitizeFilePathMap(configPath: string, repoRoot: string): number {
  let config: VcConfig;
  try {
    config = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch (error) {
    process.stderr.write(
      `[sanitize-prebuilt-refs] WARN: failed to parse ${configPath}: ${error instanceof Error ? error.message : String(error)}\n`
    );
    return 0;
  }

  const filePathMap = config.filePathMap;
  if (!filePathMap) return 0;

  const kept: Record<string, string> = {};
  let pruned = 0;
  for (const [key, value] of Object.entries(filePathMap)) {
    if (typeof value !== "string" || !existsSync(resolve(repoRoot, value))) {
      pruned++;
      continue;
    }
    kept[key] = value;
  }

  if (pruned > 0) {
    config.filePathMap = kept;
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  }
  return pruned;
}

function sanitizeNftJson(tracePath: string, traceDir: string): number {
  let content: { files?: string[]; fileHashes?: string[]; [key: string]: unknown };
  try {
    content = JSON.parse(readFileSync(tracePath, "utf-8"));
  } catch (error) {
    process.stderr.write(
      `[sanitize-prebuilt-refs] WARN: failed to parse ${tracePath}: ${error instanceof Error ? error.message : String(error)}\n`
    );
    return 0;
  }
  if (!Array.isArray(content.files)) return 0;

  const hashes = Array.isArray(content.fileHashes) ? content.fileHashes : null;
  const files: string[] = [];
  const hashesOut: string[] | null = hashes ? [] : null;
  let pruned = 0;

  content.files.forEach((file, index) => {
    const target = resolve(traceDir, file);
    if (!existsSync(target)) {
      pruned++;
      return;
    }
    files.push(file);
    if (hashesOut && hashes) hashesOut.push(hashes[index]);
  });

  if (pruned > 0) {
    content.files = files;
    if (hashesOut) content.fileHashes = hashesOut;
    writeFileSync(tracePath, `${JSON.stringify(content)}\n`);
  }
  return pruned;
}

function main(): void {
  if (!existsSync(OUTPUT_DIR)) {
    process.stderr.write("[sanitize-prebuilt-refs] No .vercel/output — nothing to sanitize\n");
    return;
  }

  const repoRoot = process.cwd();
  let prunedRefs = 0;
  let prunedTraces = 0;

  if (existsSync(FUNCTIONS_DIR)) {
    for (const configPath of walk(FUNCTIONS_DIR)) {
      if (!configPath.endsWith(".vc-config.json")) continue;
      prunedRefs += sanitizeFilePathMap(configPath, repoRoot);
    }
  }

  for (const tracePath of walk(OUTPUT_DIR)) {
    if (!tracePath.endsWith(".nft.json")) continue;
    prunedTraces += sanitizeNftJson(tracePath, dirname(tracePath));
  }

  process.stderr.write(
    `[sanitize-prebuilt-refs] Pruned ${prunedRefs} filePathMap refs and ${prunedTraces} trace entries (repoRoot: ${repoRoot}${sep})\n`
  );
}

if (import.meta.main) {
  main();
}

export { isInside, main, sanitizeFilePathMap, sanitizeNftJson };
