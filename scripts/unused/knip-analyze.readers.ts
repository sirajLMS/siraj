/**
 * Type guards and JSON file readers for scripts/unused/knip-analyze.ts.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { LayerFile, Summary, TypeFile } from "@/scripts/unused/__shared__/types";
import { UNUSED_DIR } from "@/scripts/unused/knip-analyze.types";

// ─── Type Guards ────────────────────────────────────────────────────────────

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function isSummary(value: unknown): value is Summary {
  if (!isRecord(value)) return false;
  return (
    typeof value.totalIssues === "number" &&
    typeof value.filesAnalyzed === "number" &&
    typeof value.filesWithFindings === "number" &&
    isRecord(value.byType) &&
    isRecord(value.byLayer) &&
    Array.isArray(value.topDirectories) &&
    Array.isArray(value.topFiles)
  );
}

export function isTypeFile(value: unknown): value is TypeFile {
  if (!isRecord(value)) return false;
  return typeof value.type === "string" && typeof value.count === "number" && Array.isArray(value.issues);
}

export function isLayerFile(value: unknown): value is LayerFile {
  if (!isRecord(value)) return false;
  return typeof value.layer === "string" && typeof value.count === "number" && Array.isArray(value.issues);
}

// ─── JSON File Reader ───────────────────────────────────────────────────────

export function readJSONFile(filePath: string): unknown {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

export function readFilteredFiles<T>(
  prefix: string,
  isMatch: (value: unknown) => value is T,
  getKey: (value: T) => string
): Map<string, T> {
  const result = new Map<string, T>();
  const files = readdirSync(UNUSED_DIR);
  for (const file of files) {
    if (!file.startsWith(prefix) || !file.endsWith(".json")) continue;
    const filePath = join(UNUSED_DIR, file);
    const data = readJSONFile(filePath);
    if (isMatch(data)) {
      const key = getKey(data);
      if (key) result.set(key, data);
    }
  }
  return result;
}

export function readAllTypeFiles(): Map<string, TypeFile> {
  return readFilteredFiles<TypeFile>("by-type-", isTypeFile, d => d.type);
}

export function readAllLayerFiles(): Map<string, LayerFile> {
  return readFilteredFiles<LayerFile>("by-layer-", isLayerFile, d => d.layer);
}
