#!/usr/bin/env bun
/**
 * Sanitize prebuilt deployment refs after `vercel build` (postbuild).
 *
 * The @vercel/next builder records every traced repo file in each function's
 * `.vc-config.json` `filePathMap`. When deploying with `vercel deploy
 * --prebuilt`, the CLI re-adds those paths to the upload list (buildFileTree
 * prebuilt refs). Two failure modes hit the archive/extract steps:
 *
 * 1. Refs whose target does not exist in the working tree (logs/, scratch/
 *    and other runtime-only output, or files removed since the build) fail
 *    the local archive step with:
 *      ENOENT: no such file or directory, lstat '/vercel/path0/...'
 * 2. If a `.vercelignore`/`.nowignore` is present, refs it excludes survive
 *    the CLI's collision check as a warning ("...excludes N files the
 *    prebuilt functions need") and fail Vercel's server-side extract step on
 *    the same ENOENT, because the file is absent from the uploaded archive.
 *    (This repo deleted `.vercelignore` for exactly that reason — the rules
 *    below stay as a guard in case an ignore file returns.)
 *
 * This script drops filePathMap entries that are either missing on disk or
 * excluded by a user ignore file — mirroring the CLI's own matching semantics
 * (clearRelative rule parsing, default exceptions for dependency/output paths
 * such as node_modules, .next, .yarn/cache, pnp store, venv, __pycache__, target).
 * filePathMap values are
 * repo-relative source refs consumed only as upload refs — the function
 * launcher never reads them — so pruning is runtime-safe. Stray `.nft.json`
 * trace files under the output (non-adapter consumers) are pruned the same
 * way.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import ignore from "ignore";

const OUTPUT_DIR = join(process.cwd(), ".vercel", "output");
const FUNCTIONS_DIR = join(OUTPUT_DIR, "functions");

/**
 * Default-ignored paths the CLI keeps in the upload set even when a user
 * ignore file matches them (vercel CLI buildFileTree FILEPATHMAP_VERCELIGNORE_EXCEPTIONS).
 */
const FILEPATHMAP_VERCELIGNORE_EXCEPTIONS = [
  "node_modules",
  ".next",
  ".yarn/cache",
  ".pnp*",
  ".venv",
  "venv",
  "__pycache__",
  "/target",
];

interface VcConfig {
  filePathMap?: Record<string, string>;
  [key: string]: unknown;
}

/** Mirrors the CLI's clearRelative: strips a leading `./` per rule line. */
function clearRelative(rules: string): string {
  return rules.replace(/(\n|^)\.\//g, "$1");
}

interface UserIgnore {
  ig: ReturnType<typeof ignore>;
  ignoreFileName: string;
}

function readUserIgnore(repoRoot: string): UserIgnore | null {
  const vercelignore = join(repoRoot, ".vercelignore");
  const nowignore = join(repoRoot, ".nowignore");
  const hasVercelignore = existsSync(vercelignore);
  const hasNowignore = existsSync(nowignore);
  if (hasVercelignore && hasNowignore) {
    throw new Error("Cannot use both a `.vercelignore` and `.nowignore` file. Please delete the `.nowignore` file.");
  }
  if (!hasVercelignore && !hasNowignore) return null;
  const ignoreFile = hasVercelignore ? vercelignore : nowignore;
  const ig = ignore();
  ig.add(clearRelative(readFileSync(ignoreFile, "utf-8")));
  return { ig, ignoreFileName: hasVercelignore ? ".vercelignore" : ".nowignore" };
}

const filePathMapIgnoreExceptions = ignore().add(FILEPATHMAP_VERCELIGNORE_EXCEPTIONS.join("\n"));

function isFilePathMapIgnoreException(posixRel: string): boolean {
  return filePathMapIgnoreExceptions.ignores(posixRel);
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

function sanitizeFilePathMap(configPath: string, repoRoot: string, userIgnore: UserIgnore | null): number {
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
    if (userIgnore?.ig.ignores(value) && !isFilePathMapIgnoreException(value)) {
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
  const userIgnore = readUserIgnore(repoRoot);
  let prunedRefs = 0;
  let prunedTraces = 0;

  if (existsSync(FUNCTIONS_DIR)) {
    for (const configPath of walk(FUNCTIONS_DIR)) {
      if (!configPath.endsWith(".vc-config.json")) continue;
      prunedRefs += sanitizeFilePathMap(configPath, repoRoot, userIgnore);
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

export { main, sanitizeFilePathMap, sanitizeNftJson };
