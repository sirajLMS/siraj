/**
 * Type guards, classification, item-extraction, categorization, and summary
 * helpers for scripts/unused/knip-categorize.ts.
 */

import type { Summary } from "@/scripts/unused/__shared__/types";
import {
  ALL_KNIP_TYPES,
  type CategorizedData,
  type KnipFileIssues,
  type KnipReport,
  type KnipType,
  LAYERS,
  type Layer,
} from "@/scripts/unused/knip-categorize.types";

// ─── Type Guards ────────────────────────────────────────────────────────────

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isKnipReport(value: unknown): value is KnipReport {
  if (!isRecord(value) || !Array.isArray(value.issues)) {
    return false;
  }
  return value.issues.every((item): item is KnipFileIssues => isRecord(item) && typeof item.file === "string");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const LAYER_SET = new Set<string>(LAYERS);

/**
 * Type guard: check if a string is a valid Layer.
 */
function isLayer(value: string): value is Layer {
  return LAYER_SET.has(value);
}

/**
 * Classify a file path into its architectural layer based on the first path segment.
 */
function classifyLayer(filePath: string): Layer | "other" {
  const firstSegment = filePath.split("/")[0];
  if (isLayer(firstSegment)) {
    return firstSegment;
  }
  return "other";
}

/**
 * Get the top-level directory (first two path segments, or first if only one).
 */
function classifyDirectory(filePath: string): string {
  const segments = filePath.split("/");
  return segments.length >= 2 ? `${segments[0]}/${segments[1]}` : segments[0];
}

/**
 * Slugify a file path for safe filename usage.
 */
export function slugify(filePath: string): string {
  return filePath
    .replace(/\//g, "-")
    .replace(/\.tsx?$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

/**
 * Count items in a per-file entry for a given issue type.
 */
function countItems(type: KnipType, fileIssues: KnipFileIssues): number {
  if (type === "duplicates") {
    return Array.isArray(fileIssues.duplicates) ? fileIssues.duplicates.length : 0;
  }
  return getItemsForType(type, fileIssues).length;
}

/**
 * Safely coerce an unknown item to a Record<string, unknown>.
 */
function toRecord(item: unknown): Record<string, unknown> {
  if (isRecord(item)) return item;
  return {};
}

/**
 * Extract a string value from an unknown, returning "" if not a string.
 */
function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Extract issue items (as a consistent shape) from a per-file entry for a given type.
 * For `duplicates`, each group is an array of items — we flatten to one record per group.
 */
function extractItems(type: KnipType, fileIssues: KnipFileIssues): Array<Record<string, unknown>> {
  if (type === "duplicates") {
    const groups = fileIssues.duplicates;
    if (!Array.isArray(groups)) return [];
    return groups.map((group, i) => {
      const members = Array.isArray(group) ? group.map(toRecord) : [];
      return {
        groupIndex: i,
        memberCount: members.length,
        members,
      };
    });
  }
  // For all non-duplicate types, access the array directly
  return getItemsForType(type, fileIssues).map(toRecord);
}

/**
 * Get the items array for a non-duplicate knip type. Returns [] if not an array.
 */
function getItemsForType(type: KnipType, fileIssues: KnipFileIssues): unknown[] {
  switch (type) {
    case "binaries":
      return fileIssues.binaries;
    case "catalog":
      return fileIssues.catalog;
    case "catalogReferences":
      return fileIssues.catalogReferences;
    case "dependencies":
      return fileIssues.dependencies;
    case "devDependencies":
      return fileIssues.devDependencies;
    case "enumMembers":
      return fileIssues.enumMembers;
    case "exports":
      return fileIssues.exports;
    case "files":
      return fileIssues.files;
    case "namespaceMembers":
      return fileIssues.namespaceMembers;
    case "optionalPeerDependencies":
      return fileIssues.optionalPeerDependencies;
    case "types":
      return fileIssues.types;
    case "unlisted":
      return fileIssues.unlisted;
    case "unresolved":
      return fileIssues.unresolved;
    default:
      return [];
  }
}

// ─── Categorization ────────────────────────────────────────────────────────

export function categorize(report: KnipReport): CategorizedData {
  const data: CategorizedData = {
    byType: {},
    byLayer: {},
    byDirectory: {},
    byFile: {},
  };

  for (const fileIssues of report.issues) {
    categorizeFileIssues(fileIssues, data);
  }

  return data;
}

/**
 * Categorize all issue items from a single file's knip output.
 */
function categorizeFileIssues(fileIssues: KnipFileIssues, data: CategorizedData): void {
  const layer = classifyLayer(fileIssues.file);
  const dir = classifyDirectory(fileIssues.file);

  for (const type of ALL_KNIP_TYPES) {
    const count = countItems(type, fileIssues);
    if (count === 0) continue;

    const items = extractItems(type, fileIssues);

    if (!data.byFile[fileIssues.file]) {
      data.byFile[fileIssues.file] = {};
    }
    data.byFile[fileIssues.file][type] = count;

    pushItemRecords(fileIssues.file, type, layer, dir, items, data);
  }
}

/**
 * Push extracted item records into byType, byLayer, and byDirectory buckets.
 */
function pushItemRecords(
  filePath: string,
  type: KnipType,
  layer: Layer | "other",
  dir: string,
  items: Array<Record<string, unknown>>,
  data: CategorizedData
): void {
  for (const item of items) {
    const record: Record<string, unknown> = { file: filePath, ...item };

    if (!data.byType[type]) data.byType[type] = [];
    data.byType[type].push(record);

    if (!data.byLayer[layer]) data.byLayer[layer] = [];
    data.byLayer[layer].push({ type, ...record });

    if (!data.byDirectory[dir]) data.byDirectory[dir] = [];
    data.byDirectory[dir].push({ type, ...record });
  }
}

export function buildSummary(report: KnipReport, data: CategorizedData): Summary {
  const byTypeCount: Record<string, number> = {};
  for (const [type, items] of Object.entries(data.byType)) {
    byTypeCount[type] = items.length;
  }

  const byLayerCount: Record<string, number> = {};
  for (const [layer, items] of Object.entries(data.byLayer)) {
    byLayerCount[layer] = items.length;
  }

  // Top directories
  const dirCounts = Object.entries(data.byDirectory).map(([dir, items]) => ({
    directory: dir,
    count: items.length,
  }));
  const sortedDirCounts = dirCounts.toSorted((a, b) => b.count - a.count);

  // Top files by total issue count
  const fileCounts = Object.entries(data.byFile).map(([file, types]) => {
    const total = Object.values(types).reduce((sum, n) => sum + (typeof n === "number" ? n : 0), 0);
    return { file, count: total };
  });
  const sortedFileCounts = fileCounts.toSorted((a, b) => b.count - a.count);

  // Top enum members (these tend to be the largest single-source issue)
  const topEnumMembers = [...(data.byType.enumMembers ?? [])].slice(0, 50).map(r => ({
    file: getString(r.file),
    name: getString(r.name),
    namespace: typeof r.namespace === "string" ? r.namespace : undefined,
  }));

  const topExports = [...(data.byType.exports ?? [])]
    .slice(0, 50)
    .map(r => ({ file: getString(r.file), name: getString(r.name) }));

  const topTypes = [...(data.byType.types ?? [])]
    .slice(0, 50)
    .map(r => ({ file: getString(r.file), name: getString(r.name) }));

  const topUnusedFiles = (data.byType.files ?? []).map(r => getString(r.name)).slice(0, 100);

  const topDependencies = [...(data.byType.dependencies ?? [])]
    .slice(0, 50)
    .map(r => ({ file: getString(r.file), name: getString(r.name) }));

  const topDevDependencies = [...(data.byType.devDependencies ?? [])]
    .slice(0, 50)
    .map(r => ({ file: getString(r.file), name: getString(r.name) }));

  const filesWithFindings = Object.keys(data.byFile).length;

  const totalIssues = Object.values(byTypeCount).reduce((sum, n) => sum + n, 0);

  return {
    totalIssues,
    filesAnalyzed: report.issues.length,
    filesWithFindings,
    byType: byTypeCount,
    byLayer: byLayerCount,
    topDirectories: sortedDirCounts.slice(0, 20),
    topFiles: sortedFileCounts.slice(0, 20),
    topEnumMembers,
    topExports,
    topTypes,
    topUnusedFiles,
    topDependencies,
    topDevDependencies,
  };
}
