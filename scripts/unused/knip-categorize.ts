#!/usr/bin/env bun

/**
 * KNIP CATEGORIZE — Run `knip` (check:unused), capture JSON output, and categorize results.
 *
 * Mirrors the pattern of scripts/oxlint-categorize.ts:
 *   1. Spawn `knip --reporter json` and capture stdout to a `.log` file (raw output is very large).
 *   2. Parse the JSON and bucket issues by type, layer, directory, and file.
 *   3. Write categorized JSON files to `.unused/` (gitignored, same convention as `.oxlint/`).
 *   4. Write a `summary.json` with counts and top-N lists.
 *
 * Usage:
 *   bun run scripts/unused/knip-categorize.ts
 *
 * Output directory: `.unused/`
 *   - knip-results.log          (raw JSON from knip — kept as .log for easy viewing)
 *   - by-type-<type>.json       (one file per issue type)
 *   - by-layer-<layer>.json    (one file per architectural layer)
 *   - by-directory-<dir>.json   (one file per top-level directory)
 *   - by-file-<slug>.json      (top 50 files by issue count)
 *   - summary.json              (global summary with top-N stats)
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withProcessLock } from "@/scripts/lib/process-lock";

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single knip issue item with position info (used by most issue types). */
interface KnipItem {
  name: string;
  line?: number;
  col?: number;
  pos?: number;
  namespace?: string;
}

/** A duplicate group — knip returns an array of arrays of items. */
type KnipDuplicateGroup = KnipItem[];

/** Per-file issue bundle from knip JSON reporter. */
interface KnipFileIssues {
  file: string;
  binaries: { name: string }[];
  catalog: { name: string }[];
  catalogReferences: { name: string }[];
  dependencies: KnipItem[];
  devDependencies: KnipItem[];
  duplicates: KnipDuplicateGroup[];
  enumMembers: KnipItem[];
  exports: KnipItem[];
  files: { name: string }[];
  namespaceMembers: KnipItem[];
  optionalPeerDependencies: KnipItem[];
  types: KnipItem[];
  unlisted: { name: string }[];
  unresolved: { name: string }[];
}

interface KnipReport {
  issues: KnipFileIssues[];
}

// ─── Type Guards ────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKnipReport(value: unknown): value is KnipReport {
  if (!isRecord(value) || !Array.isArray(value.issues)) {
    return false;
  }
  return value.issues.every((item): item is KnipFileIssues => isRecord(item) && typeof item.file === "string");
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = join(PROJECT_ROOT, ".unused");
const RAW_OUTPUT_FILE = join(OUTPUT_DIR, "knip-results.log");

const ALL_KNIP_TYPES = [
  "binaries",
  "catalog",
  "catalogReferences",
  "dependencies",
  "devDependencies",
  "duplicates",
  "enumMembers",
  "exports",
  "files",
  "namespaceMembers",
  "optionalPeerDependencies",
  "types",
  "unlisted",
  "unresolved",
] as const;

type KnipType = (typeof ALL_KNIP_TYPES)[number];

/** The standard architectural layers in this project. */
const LAYERS = ["app", "backend", "frontend", "shared", "scripts", "test"] as const;

type Layer = (typeof LAYERS)[number];

export type { Layer };

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
function slugify(filePath: string): string {
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

interface CategorizedData {
  byType: Record<string, Array<Record<string, unknown>>>;
  byLayer: Record<string, Array<Record<string, unknown>>>;
  byDirectory: Record<string, Array<Record<string, unknown>>>;
  byFile: Record<string, Record<string, number>>; // file -> { type: count }
}

interface Summary {
  totalIssues: number;
  filesAnalyzed: number;
  filesWithFindings: number;
  byType: Record<string, number>;
  byLayer: Record<string, number>;
  topDirectories: Array<{ directory: string; count: number }>;
  topFiles: Array<{ file: string; count: number }>;
  topEnumMembers: Array<Record<string, unknown>>;
  topExports: Array<Record<string, unknown>>;
  topUnusedFiles: string[];
  topDependencies: Array<Record<string, unknown>>;
  topDevDependencies: Array<Record<string, unknown>>;
  topTypes: Array<Record<string, unknown>>;
}

function categorize(report: KnipReport): CategorizedData {
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

function buildSummary(report: KnipReport, data: CategorizedData): Summary {
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

// ─── Output Writers ─────────────────────────────────────────────────────────

function writeJSON(filePath: string, data: unknown): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function writeByType(data: CategorizedData): void {
  for (const type of Object.keys(data.byType)) {
    const items = data.byType[type];
    const file = join(OUTPUT_DIR, `by-type-${type}.json`);
    writeJSON(file, { type, count: items.length, issues: items });
  }
}

function writeByLayer(data: CategorizedData): void {
  for (const layer of Object.keys(data.byLayer)) {
    const items = data.byLayer[layer];
    const file = join(OUTPUT_DIR, `by-layer-${layer}.json`);
    writeJSON(file, { layer, count: items.length, issues: items });
  }
}

function writeByDirectory(data: CategorizedData): void {
  const sortedDirs = Object.entries(data.byDirectory).toSorted((a, b) => b[1].length - a[1].length);
  for (const [dir, items] of sortedDirs.slice(0, 50)) {
    const slug = dir.replace(/\//g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const file = join(OUTPUT_DIR, `by-directory-${slug}.json`);
    writeJSON(file, { directory: dir, count: items.length, issues: items });
  }
}

function writeByFileTop50(data: CategorizedData): void {
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

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await withProcessLock("knip-categorize", async () => {
    // Wipe and recreate output directory
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log("Running knip --reporter json ...");

    // Spawn knip with JSON reporter, capture stdout.
    // knip exits with code 1 when issues are found — this is expected and not an error.
    const proc = Bun.spawn(["bun", "run", "check:unused", "--reporter", "json", "--no-progress"], {
      stdout: "pipe",
      stderr: "pipe",
      cwd: PROJECT_ROOT,
    });

    const stdoutPromise = new Response(proc.stdout).text();
    const stderrPromise = new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    const stdout = await stdoutPromise;
    const stderr = await stderrPromise;

    // Write raw output to .log file (even on error, for debugging)
    writeFileSync(RAW_OUTPUT_FILE, stdout || stderr);

    if (exitCode !== 0 && exitCode !== 1) {
      console.error(`knip exited with code ${exitCode}`);
      console.error(stderr);
      process.exit(exitCode);
    }

    console.log(`Raw output saved to ${RAW_OUTPUT_FILE} (${(stdout.length / 1024).toFixed(1)} KB)`);

    // Parse JSON
    const rawData: unknown = JSON.parse(stdout);
    if (!isKnipReport(rawData)) {
      throw new Error("Invalid knip JSON output format — expected { issues: [{ file: string, ... }] }");
    }

    const report = rawData;

    // Categorize
    console.log("Categorizing issues...");
    const data = categorize(report);

    // Write categorized files
    writeByType(data);
    const typeKeys = Object.keys(data.byType);
    console.log(`  by-type: ${typeKeys.length} files (${typeKeys.join(", ")})`);

    writeByLayer(data);
    console.log(`  by-layer: ${Object.keys(data.byLayer).length} layers`);

    writeByDirectory(data);
    console.log(`  by-directory: top ${Math.min(50, Object.keys(data.byDirectory).length)} directories`);

    writeByFileTop50(data);
    console.log(`  by-file: top 50 files`);

    // Summary
    const summary = buildSummary(report, data);
    const summaryFile = join(OUTPUT_DIR, "summary.json");
    writeJSON(summaryFile, summary);
    console.log(`  summary.json written`);

    console.log("\n✅ Done! Categorized output in .unused/:");
    const dirList = Bun.spawnSync(["ls", "-1", OUTPUT_DIR]);
    console.log(dirList.stdout.toString().trim());
  });
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
