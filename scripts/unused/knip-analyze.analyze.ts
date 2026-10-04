/**
 * Analysis functions for scripts/unused/knip-analyze.ts: global metrics, type
 * and layer breakdowns, density, hotspots, and pattern detection.
 */

import type { LayerFile, Summary, TypeFile } from "@/scripts/unused/__shared__/types";
import { getString } from "@/scripts/unused/knip-analyze.readers";
import {
  CUMULATIVE_COVERAGE_TARGET,
  type DensityAnalysis,
  ENUM_BLOAT_THRESHOLD,
  type GlobalMetrics,
  HIGH_ISSUE_THRESHOLD,
  type HotspotAnalysis,
  type LayerBreakdownEntry,
  type PatternDetection,
  type RiskLevel,
  TOP_HOTSPOT_LIMIT,
  TYPE_DESCRIPTIONS,
  type TypeBreakdownEntry,
} from "@/scripts/unused/knip-analyze.types";

// ─── Analysis Functions ─────────────────────────────────────────────────────

function classifyRisk(count: number, total: number): RiskLevel {
  const pct = total > 0 ? (count / total) * 100 : 0;
  if (pct > 30) return "high";
  if (pct > 10) return "medium";
  return "low";
}

export function analyzeGlobalMetrics(summary: Summary): GlobalMetrics {
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

export function analyzeTypes(summary: Summary, typeFiles: Map<string, TypeFile>): Array<TypeBreakdownEntry> {
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

export function analyzeLayers(summary: Summary, layerFiles: Map<string, LayerFile>): Array<LayerBreakdownEntry> {
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

export function analyzeDensity(summary: Summary): DensityAnalysis {
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

export function analyzeHotspots(summary: Summary, typeFiles: Map<string, TypeFile>): HotspotAnalysis {
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

export function analyzePatterns(summary: Summary, typeFiles: Map<string, TypeFile>): PatternDetection {
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
