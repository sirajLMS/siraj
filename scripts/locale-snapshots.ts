import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { getNamespaceConfig } from "@/shared/locale/client/namespace-registry";
import { getNamespaceId } from "@/shared/locale/namespaces/define-namespace";

const LOCALES: AppLocale[] = ["en", "ar"];
const NAMESPACES_DIR = join(process.cwd(), "shared/locale/namespaces");
const OUTPUT_DIR = join(process.cwd(), "public/static/locale-snapshots");
const VERSION_FILE = join(process.cwd(), ".next-locale-snapshots-version");

function walkNamespaceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walkNamespaceFiles(fullPath));
    } else if (fullPath.endsWith(".namespace.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function serializeLabels(labels: unknown): string {
  return JSON.stringify(
    labels,
    (_key, val) => {
      if (typeof val === "function") {
        return { __fn: Function.prototype.toString.call(val) };
      }
      return val;
    },
    2
  );
}

function writeSnapshotFile(targetFile: string, json: string): boolean {
  const targetDir = dirname(targetFile);

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  let existing: string | null = null;
  if (existsSync(targetFile)) {
    existing = readFileSync(targetFile, "utf8");
  }

  if (existing !== json) {
    writeFileSync(targetFile, json, "utf8");
    return true;
  }
  return false;
}

interface SnapshotUpdate {
  hashChunk: string;
  targetFile: string;
  json: string;
}

async function loadNamespaceSnapshot(exportVal: unknown): Promise<{ updates: SnapshotUpdate[] } | null> {
  if (!exportVal || typeof exportVal !== "object") return null;

  const config = getNamespaceConfig(exportVal as Parameters<typeof getNamespaceConfig>[0]);
  const id = getNamespaceId(exportVal);

  if (!config || !id) return null;

  const rawUpdates = await Promise.all(
    LOCALES.map(async (locale): Promise<SnapshotUpdate | null> => {
      const loader = config.load[locale];
      if (!loader) return null;
      const labels = await loader();
      const json = serializeLabels(labels);
      const targetFile = join(OUTPUT_DIR, locale, `${id}.json`);
      return { hashChunk: `${id}:${locale}:${json}`, targetFile, json };
    })
  );

  const updates: SnapshotUpdate[] = [];
  for (const update of rawUpdates) {
    if (update) updates.push(update);
  }

  return { updates };
}

async function main() {
  const namespaceFiles = walkNamespaceFiles(NAMESPACES_DIR);
  const hash = createHash("sha256");
  let totalSnapshots = 0;
  let writtenSnapshots = 0;

  // Load all namespace module exports and their snapshots in parallel.
  // Promise.all preserves array order, so the file/export/locale ordering
  // used below for hash updates is deterministic.
  const processedFiles = await Promise.all(
    namespaceFiles.map(async filePath => {
      const relPath = relative(process.cwd(), filePath);
      const moduleExports = await import(`@/${relPath}`);
      return Promise.all(Object.values(moduleExports).map(exportVal => loadNamespaceSnapshot(exportVal)));
    })
  );

  // Apply hash updates and file writes sequentially (no awaits here) to keep
  // the hash output stable regardless of parallel load completion order.
  for (const fileResults of processedFiles) {
    for (const result of fileResults) {
      if (!result) continue;
      for (const update of result.updates) {
        hash.update(update.hashChunk);
        totalSnapshots++;
        if (writeSnapshotFile(update.targetFile, update.json)) {
          writtenSnapshots++;
        }
      }
    }
  }

  const finalHash = hash.digest("hex").slice(0, 16);
  let existingVersion: string | null = null;
  if (existsSync(VERSION_FILE)) {
    existingVersion = readFileSync(VERSION_FILE, "utf8").trim();
  }

  if (existingVersion !== finalHash) {
    writeFileSync(VERSION_FILE, finalHash, "utf8");
  }

  console.log(
    `[locale-snapshots] Processed ${totalSnapshots} snapshots (${writtenSnapshots} written). Hash: ${finalHash}`
  );
}

main().catch(err => {
  console.error("[locale-snapshots] Failed to generate locale snapshots:", err);
  process.exit(1);
});
