/**
 * Recommendations and human-readable report generator for
 * scripts/unused/knip-analyze.ts.
 */

import {
  type DensityAnalysis,
  ENUM_BLOAT_THRESHOLD,
  type GlobalMetrics,
  HIGH_ISSUE_THRESHOLD,
  type HotspotAnalysis,
  type LayerBreakdownEntry,
  type PatternDetection,
  type TypeBreakdownEntry,
} from "@/scripts/unused/knip-analyze.types";

// ─── Recommendations ────────────────────────────────────────────────────────

export function generateRecommendations(
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

// ─── Report Generator ───────────────────────────────────────────────────────

export function generateReport(
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

function formatCountRow(
  label: string,
  labelWidth: number,
  count: number,
  percentOfTotal: number,
  suffix: string
): string {
  return `  ${label.padEnd(labelWidth)} ${String(count).padStart(6)} (${percentOfTotal.toFixed(1)}%)  ${suffix}`;
}

function appendTypeBreakdownSection(lines: string[], typeBreakdown: Array<TypeBreakdownEntry>): void {
  appendBreakdownSection(lines, "── ISSUE TYPE BREAKDOWN ──", typeBreakdown, entry =>
    formatCountRow(
      entry.type,
      25,
      entry.count,
      entry.percentOfTotal,
      `files: ${entry.fileCount}  avg: ${entry.avgPerFile.toFixed(1)}  risk: ${entry.riskLevel}`
    )
  );
}

function appendLayerBreakdownSection(lines: string[], layerBreakdown: Array<LayerBreakdownEntry>): void {
  appendBreakdownSection(lines, "── LAYER BREAKDOWN ──", layerBreakdown, entry =>
    formatCountRow(
      entry.layer,
      12,
      entry.count,
      entry.percentOfTotal,
      `top: ${entry.topIssueType} (${entry.topIssueCount})`
    )
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
