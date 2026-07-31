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

async function processNamespaceExport(
  exportVal: unknown,
  hash: ReturnType<typeof createHash>
): Promise<{ total: number; written: number }> {
  if (!exportVal || typeof exportVal !== "object") return { total: 0, written: 0 };

  const config = getNamespaceConfig(exportVal as Parameters<typeof getNamespaceConfig>[0]);
  const id = getNamespaceId(exportVal as Parameters<typeof getNamespaceId>[0]);

  if (!config || !id) return { total: 0, written: 0 };

  let total = 0;
  let written = 0;

  for (const locale of LOCALES) {
    const loader = config.load[locale];
    if (!loader) continue;

    total++;
    const labels = await loader();
    const json = serializeLabels(labels);
    hash.update(`${id}:${locale}:${json}`);

    const targetFile = join(OUTPUT_DIR, locale, `${id}.json`);
    if (writeSnapshotFile(targetFile, json)) {
      written++;
    }
  }

  return { total, written };
}

async function main() {
  const namespaceFiles = walkNamespaceFiles(NAMESPACES_DIR);
  const hash = createHash("sha256");
  let totalSnapshots = 0;
  let writtenSnapshots = 0;

  for (const filePath of namespaceFiles) {
    const relPath = relative(process.cwd(), filePath);
    const moduleExports = await import(`@/${relPath}`);

    for (const exportVal of Object.values(moduleExports)) {
      const res = await processNamespaceExport(exportVal, hash);
      totalSnapshots += res.total;
      writtenSnapshots += res.written;
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
