#!/usr/bin/env bun

/**
 * KNIP ANALYZE — Read categorized output from knip-categorize and produce analysis insights.
 *
 * This script reads the `.unused/` directory produced by `knip-categorize.ts` and generates
 * deeper analysis: hotspots, density metrics, pattern detection, and an analysis report.
 * It does NOT run knip — it only reads pre-categorized data.
 *
 * Usage:
 *   bun run scripts/unused/knip-categorize.ts   # run this first
 *   bun run scripts/unused/knip-analyze.ts       # then run analysis
 *
 * Output directory: `.unused/`
 *   - analysis.json       (structured analysis data)
 *   - analysis-report.log  (human-readable report, .log for easy viewing)
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface TypeFile {
  type: string;
  count: number;
  issues: Array<Record<string, unknown>>;
}

interface LayerFile {
  layer: string;
  count: number;
  issues: Array<Record<string, unknown>>;
}

interface Analysis {
  generatedAt: string;
  globalMetrics: GlobalMetrics;
  typeBreakdown: Array<TypeBreakdownEntry>;
  layerBreakdown: Array<LayerBreakdownEntry>;
  densityAnalysis: DensityAnalysis;
  hotspotAnalysis: HotspotAnalysis;
  patternDetection: PatternDetection;
  recommendations: string[];
}

interface GlobalMetrics {
  totalIssues: number;
  filesAnalyzed: number;
  filesWithFindings: number;
  filesWithZeroFindings: number;
  findingsDensityPercent: number;
  avgIssuesPerFile: number;
  maxIssuesInSingleFile: number;
  issueTypeCount: number;
}

interface TypeBreakdownEntry {
  type: string;
  count: number;
  percentOfTotal: number;
  fileCount: number;
  avgPerFile: number;
  riskLevel: RiskLevel;
  description: string;
}

type RiskLevel = "low" | "medium" | "high";

interface LayerBreakdownEntry {
  layer: string;
  count: number;
  percentOfTotal: number;
  topIssueType: string;
  topIssueCount: number;
}

interface DensityAnalysis {
  topDirectories: Array<{ directory: string; count: number; percentOfTotal: number }>;
  filesWithHighIssueCount: Array<{ file: string; count: number }>;
  enumMemberDominance: { file: string; count: number; percentOfAllEnumMembers: number } | null;
}

interface HotspotAnalysis {
  topHotspotFiles: Array<{ file: string; count: number; primaryType: string }>;
  singleFileContributors: { file: string; count: number; issueType: string }[];
  cumulativeCoverage: { topFilesCoversPercent: number; topFilesCount: number };
}

interface PatternDetection {
  duplicateExportsDetected: number;
  enumMemberBloat: { file: string; count: number; isLikelyGenerated: boolean }[];
  barrelFileIssues: { file: string; exportCount: number }[];
  typeDefinitionProliferation: { file: string; typeCount: number }[];
  unusedDependencyPackages: string[];
  unusedDevDependencyPackages: string[];
  unusedFileCount: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();
const UNUSED_DIR = join(PROJECT_ROOT, ".unused");
const SUMMARY_FILE = join(UNUSED_DIR, "summary.json");
const ANALYSIS_FILE = join(UNUSED_DIR, "analysis.json");
const REPORT_FILE = join(UNUSED_DIR, "analysis-report.log");

const HIGH_ISSUE_THRESHOLD = 20;
const ENUM_BLOAT_THRESHOLD = 50;
const TOP_HOTSPOT_LIMIT = 20;
const CUMULATIVE_COVERAGE_TARGET = 0.8; // 80%

const TYPE_DESCRIPTIONS: Record<string, string> = {
  files: "Entire files that are unused — dead code that can be deleted.",
  exports: "Named exports never imported anywhere — safe to remove.",
  types: "TypeScript type exports never referenced — dead type definitions.",
  enumMembers: "Enum members never used in code — often from generated enums.",
  namespaceMembers: "Namespace members never accessed — dead exports within namespaces.",
  dependencies: "Production dependencies listed in package.json but never imported.",
  devDependencies: "Dev dependencies listed in package.json but never imported.",
  duplicates: "Duplicate exports where the same symbol is exported under multiple names.",
  unlisted: "Packages used in code but not listed in package.json.",
  binaries: "CLI binaries referenced but not installed or available.",
  catalog: "Workspace catalog references that are unused.",
  catalogReferences: "Catalog reference entries that are unused.",
  optionalPeerDependencies: "Optional peer dependencies that are unused.",
  unresolved: "Imports that could not be resolved to any module.",
};

// ─── Type Guards ────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isSummary(value: unknown): value is Summary {
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

function isTypeFile(value: unknown): value is TypeFile {
  if (!isRecord(value)) return false;
  return typeof value.type === "string" && typeof value.count === "number" && Array.isArray(value.issues);
}

function isLayerFile(value: unknown): value is LayerFile {
  if (!isRecord(value)) return false;
  return typeof value.layer === "string" && typeof value.count === "number" && Array.isArray(value.issues);
}

// ─── JSON File Reader ───────────────────────────────────────────────────────

function readJSONFile(filePath: string): unknown {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

function readFilteredFiles<T>(
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

function readAllTypeFiles(): Map<string, TypeFile> {
  return readFilteredFiles<TypeFile>("by-type-", isTypeFile, d => d.type);
}

function readAllLayerFiles(): Map<string, LayerFile> {
  return readFilteredFiles<LayerFile>("by-layer-", isLayerFile, d => d.layer);
}

// ─── Analysis Functions ─────────────────────────────────────────────────────

function classifyRisk(count: number, total: number): RiskLevel {
  const pct = total > 0 ? (count / total) * 100 : 0;
  if (pct > 30) return "high";
  if (pct > 10) return "medium";
  return "low";
}

function analyzeGlobalMetrics(summary: Summary): GlobalMetrics {
  const maxIssues = summary.topFiles.length > 0 ? summary.topFiles[0].count : 0;
  const filesWithZero = summary.filesAnalyzed - summary.filesWithFindings;
  return {
    totalIssues: summary.totalIssues,
    filesAnalyzed: summary.filesAnalyzed,
    filesWithFindings: summary.filesWithFindings,
    filesWithZeroFindings: filesWithZero,
    findingsDensityPercent: summary.filesAnalyzed > 0 ? (summary.filesWithFindings / summary.filesAnalyzed) * 100 : 0,
    avgIssuesPerFile: summary.filesAnalyzed > 0 ? summary.totalIssues / summary.filesAnalyzed : 0,
    maxIssuesInSingleFile: maxIssues,
    issueTypeCount: Object.keys(summary.byType).length,
  };
}

function analyzeTypes(summary: Summary, typeFiles: Map<string, TypeFile>): Array<TypeBreakdownEntry> {
  const total = summary.totalIssues;
  const entries: Array<TypeBreakdownEntry> = [];

  for (const [type, count] of Object.entries(summary.byType)) {
    const typeFile = typeFiles.get(type);
    const fileCount = typeFile ? new Set(typeFile.issues.map(i => getString(i.file))).size : 0;
    entries.push({
      type,
      count,
      percentOfTotal: total > 0 ? (count / total) * 100 : 0,
      fileCount,
      avgPerFile: fileCount > 0 ? count / fileCount : 0,
      riskLevel: classifyRisk(count, total),
      description: TYPE_DESCRIPTIONS[type] ?? "Unknown issue type.",
    });
  }

  return entries.toSorted((a, b) => b.count - a.count);
}

function analyzeLayers(summary: Summary, layerFiles: Map<string, LayerFile>): Array<LayerBreakdownEntry> {
  const total = summary.totalIssues;
  const entries: Array<LayerBreakdownEntry> = [];

  for (const [layer, count] of Object.entries(summary.byLayer)) {
    const layerFile = layerFiles.get(layer);
    const { topType, topCount } = findTopIssueType(layerFile);

    entries.push({
      layer,
      count,
      percentOfTotal: total > 0 ? (count / total) * 100 : 0,
      topIssueType: topType,
      topIssueCount: topCount,
    });
  }

  return entries.toSorted((a, b) => b.count - a.count);
}

/**
 * Find the most frequent issue type in a layer file's issues.
 */
function findTopIssueType(layerFile: LayerFile | undefined): { topType: string; topCount: number } {
  if (!layerFile) return { topType: "", topCount: 0 };
  const typeCounts: Record<string, number> = {};
  for (const issue of layerFile.issues) {
    const t = getString(issue.type);
    if (t) {
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    }
  }
  const sorted = Object.entries(typeCounts).toSorted((a, b) => b[1] - a[1]);
  return {
    topType: sorted.length > 0 ? sorted[0][0] : "",
    topCount: sorted.length > 0 ? sorted[0][1] : 0,
  };
}

function analyzeDensity(summary: Summary): DensityAnalysis {
  const total = summary.totalIssues;

  const topDirectories = summary.topDirectories.map(d => ({
    directory: d.directory,
    count: d.count,
    percentOfTotal: total > 0 ? (d.count / total) * 100 : 0,
  }));

  const filesWithHighIssueCount = summary.topFiles
    .filter(f => f.count >= HIGH_ISSUE_THRESHOLD)
    .map(f => ({ file: f.file, count: f.count }));

  const enumMemberDominance = detectEnumDominance(summary);

  return { topDirectories, filesWithHighIssueCount, enumMemberDominance };
}

/**
 * Detect if a single file dominates enum member issues.
 */
function detectEnumDominance(summary: Summary): DensityAnalysis["enumMemberDominance"] {
  const enumCount = summary.byType.enumMembers ?? 0;
  if (enumCount <= 0 || summary.topEnumMembers.length === 0) return null;

  const enumByFile: Record<string, number> = {};
  for (const item of summary.topEnumMembers) {
    const file = getString(item.file);
    if (!file) continue;
    enumByFile[file] = (enumByFile[file] ?? 0) + 1;
  }
  const enumFile = Object.entries(enumByFile).toSorted((a, b) => b[1] - a[1])[0];
  if (!enumFile) return null;

  const topFileMatch = summary.topFiles.find(f => f.file === enumFile[0]);
  const count = topFileMatch?.count ?? enumFile[1];
  return {
    file: enumFile[0],
    count,
    percentOfAllEnumMembers: enumCount > 0 ? (count / enumCount) * 100 : 0,
  };
}

function analyzeHotspots(summary: Summary, typeFiles: Map<string, TypeFile>): HotspotAnalysis {
  const topHotspotFiles = findTopHotspotFiles(summary, typeFiles);
  const singleFileContributors = findSingleFileContributors(typeFiles);
  const cumulativeCoverage = computeCumulativeCoverage(summary);
  return { topHotspotFiles, singleFileContributors, cumulativeCoverage };
}

/**
 * Find the primary issue type for each top file.
 */
function findTopHotspotFiles(summary: Summary, typeFiles: Map<string, TypeFile>): HotspotAnalysis["topHotspotFiles"] {
  const result: HotspotAnalysis["topHotspotFiles"] = [];
  for (const topFile of summary.topFiles.slice(0, TOP_HOTSPOT_LIMIT)) {
    let primaryType = "";
    let maxForFile = 0;
    for (const [type, typeFile] of typeFiles) {
      const fileIssues = typeFile.issues.filter(i => i.file === topFile.file);
      if (fileIssues.length > maxForFile) {
        maxForFile = fileIssues.length;
        primaryType = type;
      }
    }
    result.push({ file: topFile.file, count: topFile.count, primaryType });
  }
  return result;
}

/**
 * Find types where one file contributes >50% of the type's issues.
 */
function findSingleFileContributors(typeFiles: Map<string, TypeFile>): HotspotAnalysis["singleFileContributors"] {
  const result: HotspotAnalysis["singleFileContributors"] = [];
  for (const [type, typeFile] of typeFiles) {
    if (typeFile.count <= 10) continue;
    const fileCounts: Record<string, number> = {};
    for (const issue of typeFile.issues) {
      const file = getString(issue.file);
      if (!file) continue;
      fileCounts[file] = (fileCounts[file] ?? 0) + 1;
    }
    const sorted = Object.entries(fileCounts).toSorted((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] > typeFile.count * 0.5) {
      result.push({ file: sorted[0][0], count: sorted[0][1], issueType: type });
    }
  }
  return result;
}

/**
 * Compute cumulative coverage of issues by top files.
 */
function computeCumulativeCoverage(summary: Summary): HotspotAnalysis["cumulativeCoverage"] {
  let cumulative = 0;
  let topFilesCount = 0;
  const target = summary.totalIssues * CUMULATIVE_COVERAGE_TARGET;
  for (const f of summary.topFiles) {
    cumulative += f.count;
    topFilesCount++;
    if (cumulative >= target) break;
  }
  return {
    topFilesCoversPercent: summary.totalIssues > 0 ? (cumulative / summary.totalIssues) * 100 : 0,
    topFilesCount,
  };
}

function analyzePatterns(summary: Summary, typeFiles: Map<string, TypeFile>): PatternDetection {
  const duplicateExports = typeFiles.get("duplicates");
  const duplicateExportsDetected = duplicateExports ? duplicateExports.count : 0;

  const enumMemberBloat = detectEnumMemberBloat(typeFiles.get("enumMembers"));
  const barrelFileIssues = detectBarrelFileIssues(typeFiles.get("exports"));
  const typeDefinitionProliferation = detectTypeProliferation(typeFiles.get("types"));
  const unusedDependencyPackages = extractUniqueNames(typeFiles.get("dependencies"));
  const unusedDevDependencyPackages = extractUniqueNames(typeFiles.get("devDependencies"));

  const unusedFileCount = summary.byType.files ?? 0;

  return {
    duplicateExportsDetected,
    enumMemberBloat,
    barrelFileIssues,
    typeDefinitionProliferation,
    unusedDependencyPackages,
    unusedDevDependencyPackages,
    unusedFileCount,
  };
}

/**
 * Detect files with enum member counts above the bloat threshold.
 */
function detectEnumMemberBloat(enumMembers: TypeFile | undefined): PatternDetection["enumMemberBloat"] {
  if (!enumMembers) return [];
  const enumByFile: Record<string, number> = {};
  for (const issue of enumMembers.issues) {
    const file = getString(issue.file);
    if (!file) continue;
    enumByFile[file] = (enumByFile[file] ?? 0) + 1;
  }
  const result: PatternDetection["enumMemberBloat"] = [];
  for (const [file, count] of Object.entries(enumByFile)) {
    if (count >= ENUM_BLOAT_THRESHOLD) {
      const isLikelyGenerated = file.includes("timezone") || file.includes("country") || file.includes("iana");
      result.push({ file, count, isLikelyGenerated });
    }
  }
  return result.toSorted((a, b) => b.count - a.count);
}

/**
 * Detect barrel files (index.ts) with 5+ unused exports.
 */
function detectBarrelFileIssues(exportsFile: TypeFile | undefined): PatternDetection["barrelFileIssues"] {
  if (!exportsFile) return [];
  const exportByFile: Record<string, number> = {};
  for (const issue of exportsFile.issues) {
    const file = getString(issue.file);
    if (!file) continue;
    exportByFile[file] = (exportByFile[file] ?? 0) + 1;
  }
  const result: PatternDetection["barrelFileIssues"] = [];
  for (const [file, exportCount] of Object.entries(exportByFile)) {
    if (file.endsWith("index.ts") && exportCount >= 5) {
      result.push({ file, exportCount });
    }
  }
  return result.toSorted((a, b) => b.exportCount - a.exportCount);
}

/**
 * Detect files with 5+ unused type exports.
 */
function detectTypeProliferation(typesFile: TypeFile | undefined): PatternDetection["typeDefinitionProliferation"] {
  if (!typesFile) return [];
  const typeByFile: Record<string, number> = {};
  for (const issue of typesFile.issues) {
    const file = getString(issue.file);
    if (!file) continue;
    typeByFile[file] = (typeByFile[file] ?? 0) + 1;
  }
  const result: PatternDetection["typeDefinitionProliferation"] = [];
  for (const [file, typeCount] of Object.entries(typeByFile)) {
    if (typeCount >= 5) {
      result.push({ file, typeCount });
    }
  }
  return result.toSorted((a, b) => b.typeCount - a.typeCount);
}

/**
 * Extract unique package names from a dependency type file.
 */
function extractUniqueNames(depsFile: TypeFile | undefined): string[] {
  if (!depsFile) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const issue of depsFile.issues) {
    const name = getString(issue.name);
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

function generateRecommendations(
  typeBreakdown: Array<TypeBreakdownEntry>,
  density: DensityAnalysis,
  patterns: PatternDetection
): string[] {
  const recs: string[] = [];

  addHighRiskRec(recs, typeBreakdown);
  addEnumDominanceRec(recs, density);
  addBarrelFileRec(recs, patterns);
  addTypeProliferationRec(recs, patterns);
  addDependencyRecs(recs, patterns);
  addDuplicateExportsRec(recs, patterns);
  addUnusedFileRec(recs, patterns);

  if (recs.length === 0) {
    recs.push("No major patterns detected. The unused code footprint is relatively dispersed.");
  }

  return recs;
}

function addHighRiskRec(recs: string[], typeBreakdown: Array<TypeBreakdownEntry>): void {
  const highRiskTypes = typeBreakdown.filter(t => t.riskLevel === "high");
  if (highRiskTypes.length > 0) {
    recs.push(
      `High-risk issue types: ${highRiskTypes.map(t => t.type).join(", ")}. These account for >30% of all issues individually.`
    );
  }
}

function addEnumDominanceRec(recs: string[], density: DensityAnalysis): void {
  if (!density.enumMemberDominance) return;
  const dom = density.enumMemberDominance;
  const suffix = dom.file.includes("timezone")
    ? " This is likely a generated enum — consider excluding it from knip analysis."
    : "";
  recs.push(
    `Enum members from "${dom.file}" dominate ${dom.percentOfAllEnumMembers.toFixed(1)}% of all enumMember issues (${dom.count} entries).${suffix}`
  );
}

function addBarrelFileRec(recs: string[], patterns: PatternDetection): void {
  if (patterns.barrelFileIssues.length > 0) {
    recs.push(
      `${patterns.barrelFileIssues.length} barrel files (index.ts) have 5+ unused exports. These re-export files accumulate dead exports as code shifts.`
    );
  }
}

function addTypeProliferationRec(recs: string[], patterns: PatternDetection): void {
  if (patterns.typeDefinitionProliferation.length > 0) {
    recs.push(
      `${patterns.typeDefinitionProliferation.length} files have 5+ unused type exports. Consider merging or removing dead type definitions.`
    );
  }
}

function addDependencyRecs(recs: string[], patterns: PatternDetection): void {
  if (patterns.unusedDependencyPackages.length > 0) {
    recs.push(
      `${patterns.unusedDependencyPackages.length} production dependencies appear unused: ${patterns.unusedDependencyPackages.slice(0, 10).join(", ")}${patterns.unusedDependencyPackages.length > 10 ? "..." : ""}`
    );
  }
  if (patterns.unusedDevDependencyPackages.length > 0) {
    recs.push(
      `${patterns.unusedDevDependencyPackages.length} dev dependencies appear unused: ${patterns.unusedDevDependencyPackages.slice(0, 10).join(", ")}${patterns.unusedDevDependencyPackages.length > 10 ? "..." : ""}`
    );
  }
}

function addDuplicateExportsRec(recs: string[], patterns: PatternDetection): void {
  if (patterns.duplicateExportsDetected > 0) {
    recs.push(
      `${patterns.duplicateExportsDetected} duplicate export groups detected — same symbol exported under multiple names.`
    );
  }
}

function addUnusedFileRec(recs: string[], patterns: PatternDetection): void {
  if (patterns.unusedFileCount > 50) {
    recs.push(`${patterns.unusedFileCount} entire files are unused — these are strong candidates for deletion.`);
  }
}

// ─── Report Generator ──────────────────────────────────────────────────────

function generateReport(
  metrics: GlobalMetrics,
  typeBreakdown: Array<TypeBreakdownEntry>,
  layerBreakdown: Array<LayerBreakdownEntry>,
  density: DensityAnalysis,
  hotspots: HotspotAnalysis,
  patterns: PatternDetection,
  recommendations: string[]
): string {
  const lines: string[] = [];

  lines.push("=".repeat(80));
  lines.push("  KNIP UNUSED CODE ANALYSIS REPORT");
  lines.push(`  Generated: ${new Date().toISOString()}`);
  lines.push("=".repeat(80));
  lines.push("");

  appendMetricsSection(lines, metrics);
  appendTypeBreakdownSection(lines, typeBreakdown);
  appendLayerBreakdownSection(lines, layerBreakdown);
  appendDensitySection(lines, density);
  appendHotspotSection(lines, hotspots);
  appendPatternSection(lines, patterns);

  lines.push("── RECOMMENDATIONS ──");
  for (let i = 0; i < recommendations.length; i++) {
    lines.push(`  ${i + 1}. ${recommendations[i]}`);
  }
  lines.push("");
  lines.push("=".repeat(80));
  lines.push("  END OF REPORT");
  lines.push("=".repeat(80));

  return lines.join("\n");
}

function appendMetricsSection(lines: string[], metrics: GlobalMetrics): void {
  lines.push("── GLOBAL METRICS ──");
  lines.push(`  Total issues:           ${metrics.totalIssues}`);
  lines.push(`  Files analyzed:         ${metrics.filesAnalyzed}`);
  lines.push(`  Files with findings:    ${metrics.filesWithFindings} (${metrics.findingsDensityPercent.toFixed(1)}%)`);
  lines.push(`  Files with zero issues: ${metrics.filesWithZeroFindings}`);
  lines.push(`  Avg issues per file:    ${metrics.avgIssuesPerFile.toFixed(2)}`);
  lines.push(`  Max issues in one file: ${metrics.maxIssuesInSingleFile}`);
  lines.push(`  Issue type categories:  ${metrics.issueTypeCount}`);
  lines.push("");
}

function appendBreakdownSection<T>(
  lines: string[],
  heading: string,
  entries: T[],
  formatRow: (entry: T) => string
): void {
  lines.push(heading);
  for (const entry of entries) {
    lines.push(formatRow(entry));
  }
  lines.push("");
}

function appendTypeBreakdownSection(lines: string[], typeBreakdown: Array<TypeBreakdownEntry>): void {
  appendBreakdownSection(
    lines,
    "── ISSUE TYPE BREAKDOWN ──",
    typeBreakdown,
    entry =>
      `  ${entry.type.padEnd(25)} ${String(entry.count).padStart(6)} (${entry.percentOfTotal.toFixed(1)}%)  ` +
      `files: ${entry.fileCount}  avg: ${entry.avgPerFile.toFixed(1)}  risk: ${entry.riskLevel}`
  );
}

function appendLayerBreakdownSection(lines: string[], layerBreakdown: Array<LayerBreakdownEntry>): void {
  appendBreakdownSection(
    lines,
    "── LAYER BREAKDOWN ──",
    layerBreakdown,
    entry =>
      `  ${entry.layer.padEnd(12)} ${String(entry.count).padStart(6)} (${entry.percentOfTotal.toFixed(1)}%)  ` +
      `top: ${entry.topIssueType} (${entry.topIssueCount})`
  );
}

function appendDensitySection(lines: string[], density: DensityAnalysis): void {
  lines.push("── DENSITY ANALYSIS ──");
  lines.push("  Top directories:");
  for (const d of density.topDirectories.slice(0, 10)) {
    lines.push(`    ${d.directory.padEnd(40)} ${String(d.count).padStart(6)} (${d.percentOfTotal.toFixed(1)}%)`);
  }
  lines.push("");
  if (density.filesWithHighIssueCount.length > 0) {
    lines.push(`  Files with ${HIGH_ISSUE_THRESHOLD}+ issues:`);
    for (const f of density.filesWithHighIssueCount) {
      lines.push(`    ${f.file.padEnd(60)} ${f.count}`);
    }
    lines.push("");
  }
  if (density.enumMemberDominance) {
    const dom = density.enumMemberDominance;
    lines.push(
      `  Enum member dominance: "${dom.file}" → ${dom.count} (${dom.percentOfAllEnumMembers.toFixed(1)}% of all enumMembers)`
    );
    lines.push("");
  }
}

function appendHotspotSection(lines: string[], hotspots: HotspotAnalysis): void {
  lines.push("── HOTSPOT ANALYSIS ──");
  lines.push("  Top hotspot files:");
  for (const f of hotspots.topHotspotFiles) {
    lines.push(`    ${f.file.padEnd(60)} ${String(f.count).padStart(5)}  type: ${f.primaryType}`);
  }
  lines.push("");
  if (hotspots.singleFileContributors.length > 0) {
    lines.push("  Single-file dominant contributors:");
    for (const sfc of hotspots.singleFileContributors.slice(0, 10)) {
      lines.push(`    ${sfc.file.padEnd(60)} ${String(sfc.count).padStart(5)}  type: ${sfc.issueType}`);
    }
    lines.push("");
  }
  lines.push(
    `  Cumulative coverage: top ${hotspots.cumulativeCoverage.topFilesCount} files ` +
      `cover ${hotspots.cumulativeCoverage.topFilesCoversPercent.toFixed(1)}% of all issues`
  );
  lines.push("");
}

function appendPatternSection(lines: string[], patterns: PatternDetection): void {
  lines.push("── PATTERN DETECTION ──");
  lines.push(`  Duplicate exports:         ${patterns.duplicateExportsDetected}`);
  lines.push(`  Unused files:             ${patterns.unusedFileCount}`);
  lines.push(`  Unused dependencies:      ${patterns.unusedDependencyPackages.length}`);
  lines.push(`  Unused dev dependencies:  ${patterns.unusedDevDependencyPackages.length}`);
  lines.push("");

  appendEnumBloatLines(lines, patterns);
  appendBarrelFileLines(lines, patterns);
  appendTypeProliferationLines(lines, patterns);

  if (patterns.unusedDependencyPackages.length > 0) {
    lines.push("  Unused production dependencies:");
    lines.push(`    ${patterns.unusedDependencyPackages.join(", ")}`);
    lines.push("");
  }
  if (patterns.unusedDevDependencyPackages.length > 0) {
    lines.push("  Unused dev dependencies:");
    lines.push(`    ${patterns.unusedDevDependencyPackages.join(", ")}`);
    lines.push("");
  }
}

function appendEnumBloatLines(lines: string[], patterns: PatternDetection): void {
  if (patterns.enumMemberBloat.length === 0) return;
  lines.push(`  Enum member bloat (${ENUM_BLOAT_THRESHOLD}+ members):`);
  for (const e of patterns.enumMemberBloat) {
    lines.push(
      `    ${e.file.padEnd(60)} ${String(e.count).padStart(5)}${e.isLikelyGenerated ? "  [likely generated]" : ""}`
    );
  }
  lines.push("");
}

function appendBarrelFileLines(lines: string[], patterns: PatternDetection): void {
  if (patterns.barrelFileIssues.length === 0) return;
  lines.push("  Barrel files with 5+ unused exports:");
  for (const b of patterns.barrelFileIssues.slice(0, 15)) {
    lines.push(`    ${b.file.padEnd(60)} ${String(b.exportCount).padStart(5)}`);
  }
  lines.push("");
}

function appendTypeProliferationLines(lines: string[], patterns: PatternDetection): void {
  if (patterns.typeDefinitionProliferation.length === 0) return;
  lines.push("  Type definition proliferation (5+ unused types):");
  for (const t of patterns.typeDefinitionProliferation.slice(0, 15)) {
    lines.push(`    ${t.file.padEnd(60)} ${String(t.typeCount).padStart(5)}`);
  }
  lines.push("");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  if (!existsSync(UNUSED_DIR)) {
    console.error("Error: .unused/ directory not found. Run knip-categorize.ts first.");
    process.exit(1);
  }
  if (!existsSync(SUMMARY_FILE)) {
    console.error("Error: summary.json not found. Run knip-categorize.ts first.");
    process.exit(1);
  }

  console.log("Reading categorized data from .unused/ ...");

  const summary = readJSONFile(SUMMARY_FILE);
  if (!isSummary(summary)) {
    console.error("Error: summary.json has invalid format.");
    process.exit(1);
  }

  const typeFiles = readAllTypeFiles();
  const layerFiles = readAllLayerFiles();

  console.log(`  Loaded ${typeFiles.size} type files, ${layerFiles.size} layer files`);

  console.log("Analyzing...");

  const globalMetrics = analyzeGlobalMetrics(summary);
  const typeBreakdown = analyzeTypes(summary, typeFiles);
  const layerBreakdown = analyzeLayers(summary, layerFiles);
  const density = analyzeDensity(summary);
  const hotspots = analyzeHotspots(summary, typeFiles);
  const patterns = analyzePatterns(summary, typeFiles);
  const recommendations = generateRecommendations(typeBreakdown, density, patterns);

  const analysis: Analysis = {
    generatedAt: new Date().toISOString(),
    globalMetrics,
    typeBreakdown,
    layerBreakdown,
    densityAnalysis: density,
    hotspotAnalysis: hotspots,
    patternDetection: patterns,
    recommendations,
  };

  // Write structured analysis
  writeFileSync(ANALYSIS_FILE, JSON.stringify(analysis, null, 2));
  console.log(`  analysis.json written`);

  // Write human-readable report
  const report = generateReport(
    globalMetrics,
    typeBreakdown,
    layerBreakdown,
    density,
    hotspots,
    patterns,
    recommendations
  );
  writeFileSync(REPORT_FILE, report);
  console.log(`  analysis-report.log written`);

  console.log("\n✅ Done! Analysis output in .unused/:");
  console.log(`    analysis.json`);
  console.log(`    analysis-report.log`);
}

main();
