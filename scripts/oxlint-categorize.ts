#!/usr/bin/env bun

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

interface OxlintIssue {
  message: string;
  code: string;
  severity: "warning" | "error";
  causes: unknown[];
  url: string;
  help: string;
  filename: string;
  labels: Array<{ label: string; span: { offset: number; length: number; line: number; column: number } }>;
  related: unknown[];
}

interface OxlintOutput {
  diagnostics: OxlintIssue[];
}

// Type guard for oxlint output
function isOxlintOutput(value: unknown): value is OxlintOutput {
  return (
    typeof value === "object" &&
    value !== null &&
    "diagnostics" in value &&
    Array.isArray((value as Record<string, unknown>).diagnostics)
  );
}

const OXLINT_DIR = join(import.meta.dir, "..", ".oxlint");
const OUTPUT_FILE = join(OXLINT_DIR, "oxlint-results.json");

async function main() {
  console.log("Running oxlint...");

  // Run oxlint and capture JSON output (oxlint exits with 1 when issues found, which is expected)
  const proc = Bun.spawn(["oxlint", "--ignore-path", ".gitignore", "--format", "json"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const output = await new Response(proc.stdout).text();
  await proc.exited;

  // Write raw results
  writeFileSync(OUTPUT_FILE, output);
  console.log(`Raw results saved to ${OUTPUT_FILE}`);

  // Parse JSON
  const rawData = JSON.parse(output) as unknown;
  if (!isOxlintOutput(rawData)) {
    throw new Error("Invalid oxlint output format");
  }
  const issues: OxlintIssue[] = rawData.diagnostics || [];

  // Categorize
  const bySeverity: Record<string, OxlintIssue[]> = {};
  const byRule: Record<string, OxlintIssue[]> = {};
  const byFile: Record<string, OxlintIssue[]> = {};

  for (const issue of issues) {
    // By severity
    if (!bySeverity[issue.severity]) bySeverity[issue.severity] = [];
    bySeverity[issue.severity].push(issue);

    // By rule
    if (!byRule[issue.code]) byRule[issue.code] = [];
    byRule[issue.code].push(issue);

    // By file
    if (!byFile[issue.filename]) byFile[issue.filename] = [];
    byFile[issue.filename].push(issue);
  }

  // Write categorized files
  // By severity
  for (const [severity, items] of Object.entries(bySeverity)) {
    const file = join(OXLINT_DIR, `by-severity-${severity}.json`);
    writeFileSync(file, JSON.stringify({ severity, count: items.length, issues: items }, null, 2));
    console.log(`  by-severity-${severity}.json: ${items.length} issues`);
  }

  // By rule (top 50)
  const sortedRules = Object.entries(byRule).toSorted((a, b) => b[1].length - a[1].length);
  for (const [rule, items] of sortedRules.slice(0, 50)) {
    const safeRule = rule.replace(/[()]/g, "").replace(/\//g, "-");
    const file = join(OXLINT_DIR, `by-rule-${safeRule}.json`);
    writeFileSync(file, JSON.stringify({ rule, count: items.length, issues: items }, null, 2));
  }
  console.log(`  Created ${Math.min(50, sortedRules.length)} rule files (top 50)`);

  // By file (top 50)
  const sortedFiles = Object.entries(byFile).toSorted((a, b) => b[1].length - a[1].length);
  for (const [filePath, items] of sortedFiles.slice(0, 50)) {
    const safeName = filePath.replace(/\//g, "-").replace(/\.tsx?$/, "");
    const file = join(OXLINT_DIR, `by-file-${safeName}.json`);
    writeFileSync(file, JSON.stringify({ file: filePath, count: items.length, issues: items }, null, 2));
  }
  console.log(`  Created ${Math.min(50, sortedFiles.length)} file files (top 50)`);

  // Summary file
  const summary = {
    totalIssues: issues.length,
    bySeverity: Object.fromEntries(Object.entries(bySeverity).map(([k, v]) => [k, v.length])),
    topRules: sortedRules.slice(0, 20).map(([k, v]) => ({ rule: k, count: v.length })),
    topFiles: sortedFiles.slice(0, 20).map(([k, v]) => ({ file: k, count: v.length })),
  };
  writeFileSync(join(OXLINT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  console.log("  summary.json created");

  console.log("\nDone! Files in .oxlint/:");
  const files = await $`ls -la .oxlint/`.quiet();
  console.log(files.stdout.toString());
}

main().catch(console.error);
