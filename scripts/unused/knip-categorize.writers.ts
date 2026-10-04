/**
 * Output writers for scripts/unused/knip-categorize.ts: by-type, by-layer,
 * by-directory, and by-file categorized JSON files.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { slugify } from "@/scripts/unused/knip-categorize.helpers";
import { type CategorizedData, OUTPUT_DIR } from "@/scripts/unused/knip-categorize.types";

export function writeJSON(filePath: string, data: unknown): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function writeByType(data: CategorizedData): void {
  for (const type of Object.keys(data.byType)) {
    const items = data.byType[type];
    const file = join(OUTPUT_DIR, `by-type-${type}.json`);
    writeJSON(file, { type, count: items.length, issues: items });
  }
}

export function writeByLayer(data: CategorizedData): void {
  for (const layer of Object.keys(data.byLayer)) {
    const items = data.byLayer[layer];
    const file = join(OUTPUT_DIR, `by-layer-${layer}.json`);
    writeJSON(file, { layer, count: items.length, issues: items });
  }
}

export function writeByDirectory(data: CategorizedData): void {
  const sortedDirs = Object.entries(data.byDirectory).toSorted((a, b) => b[1].length - a[1].length);
  for (const [dir, items] of sortedDirs.slice(0, 50)) {
    const slug = dir.replace(/\//g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const file = join(OUTPUT_DIR, `by-directory-${slug}.json`);
    writeJSON(file, { directory: dir, count: items.length, issues: items });
  }
}

export function writeByFileTop50(data: CategorizedData): void {
  const sortedFiles = Object.entries(data.byFile).toSorted((a, b) => {
    const totalA = Object.values(a[1]).reduce((s, n) => s + (typeof n === "number" ? n : 0), 0);
    const totalB = Object.values(b[1]).reduce((s, n) => s + (typeof n === "number" ? n : 0), 0);
    return totalB - totalA;
  });

  for (const [filePath, types] of sortedFiles.slice(0, 50)) {
    const total = Object.values(types).reduce((s, n) => s + (typeof n === "number" ? n : 0), 0);
    const slug = slugify(filePath);
    const file = join(OUTPUT_DIR, `by-file-${slug}.json`);
    writeJSON(file, { file: filePath, count: total, types });
  }
}
