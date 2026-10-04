/**
 * Types, thresholds, and descriptions for scripts/unused/knip-analyze.ts.
 */

import { join } from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Analysis {
  generatedAt: string;
  globalMetrics: GlobalMetrics;
  typeBreakdown: Array<TypeBreakdownEntry>;
  layerBreakdown: Array<LayerBreakdownEntry>;
  densityAnalysis: DensityAnalysis;
  hotspotAnalysis: HotspotAnalysis;
  patternDetection: PatternDetection;
  recommendations: string[];
}

export interface GlobalMetrics {
  totalIssues: number;
  filesAnalyzed: number;
  filesWithFindings: number;
  filesWithZeroFindings: number;
  findingsDensityPercent: number;
  avgIssuesPerFile: number;
  maxIssuesInSingleFile: number;
  issueTypeCount: number;
}

export interface TypeBreakdownEntry {
  type: string;
  count: number;
  percentOfTotal: number;
  fileCount: number;
  avgPerFile: number;
  riskLevel: RiskLevel;
  description: string;
}

export type RiskLevel = "low" | "medium" | "high";

export interface LayerBreakdownEntry {
  layer: string;
  count: number;
  percentOfTotal: number;
  topIssueType: string;
  topIssueCount: number;
}

export interface DensityAnalysis {
  topDirectories: Array<{ directory: string; count: number; percentOfTotal: number }>;
  filesWithHighIssueCount: Array<{ file: string; count: number }>;
  enumMemberDominance: { file: string; count: number; percentOfAllEnumMembers: number } | null;
}

export interface HotspotAnalysis {
  topHotspotFiles: Array<{ file: string; count: number; primaryType: string }>;
  singleFileContributors: { file: string; count: number; issueType: string }[];
  cumulativeCoverage: { topFilesCoversPercent: number; topFilesCount: number };
}

export interface PatternDetection {
  duplicateExportsDetected: number;
  enumMemberBloat: { file: string; count: number; isLikelyGenerated: boolean }[];
  barrelFileIssues: { file: string; exportCount: number }[];
  typeDefinitionProliferation: { file: string; typeCount: number }[];
  unusedDependencyPackages: string[];
  unusedDevDependencyPackages: string[];
  unusedFileCount: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const PROJECT_ROOT = process.cwd();
export const UNUSED_DIR = join(PROJECT_ROOT, ".unused");
export const SUMMARY_FILE = join(UNUSED_DIR, "summary.json");
export const ANALYSIS_FILE = join(UNUSED_DIR, "analysis.json");
export const REPORT_FILE = join(UNUSED_DIR, "analysis-report.log");

export const HIGH_ISSUE_THRESHOLD = 20;
export const ENUM_BLOAT_THRESHOLD = 50;
export const TOP_HOTSPOT_LIMIT = 20;
export const CUMULATIVE_COVERAGE_TARGET = 0.8; // 80%

export const TYPE_DESCRIPTIONS: Record<string, string> = {
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
