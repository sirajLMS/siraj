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

import { existsSync, writeFileSync } from "node:fs";
import {
  analyzeDensity,
  analyzeGlobalMetrics,
  analyzeHotspots,
  analyzeLayers,
  analyzePatterns,
  analyzeTypes,
} from "@/scripts/unused/knip-analyze.analyze";
import { isSummary, readAllLayerFiles, readAllTypeFiles, readJSONFile } from "@/scripts/unused/knip-analyze.readers";
import { generateRecommendations, generateReport } from "@/scripts/unused/knip-analyze.report";
import {
  ANALYSIS_FILE,
  type Analysis,
  REPORT_FILE,
  SUMMARY_FILE,
  UNUSED_DIR,
} from "@/scripts/unused/knip-analyze.types";

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
