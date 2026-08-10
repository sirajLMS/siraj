#!/usr/bin/env bun
/**
 * generate-subagent-prompts.ts
 *
 * Reads ALL `.oxlint/by-file-*.json` files, applies the SUB_AGENT_PROMPT_TEMPLATE.md
 * template with substitutions, and writes one prompt file per source file to
 * `.oxlint/prompts/`.
 *
 * Also generates by-file JSONs for files beyond the top-50 cap of the
 * categorize script (via `--generate-missing` flag or automatically).
 *
 * Usage:
 *   bun run .agents/skills/fix-oxlint/generate-subagent-prompts.ts
 *   bun run .agents/skills/fix-oxlint/generate-subagent-prompts.ts --generate-missing
 *   bun run .agents/skills/fix-oxlint/generate-subagent-prompts.ts --pool-size 36
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OxlintSpan {
  offset: number;
  length: number;
  line: number;
  column: number;
}

interface OxlintLabel {
  label?: string;
  span: OxlintSpan;
}

interface OxlintIssue {
  message: string;
  code: string;
  severity: "warning" | "error";
  causes: unknown[];
  url: string;
  help?: string;
  filename: string;
  labels: OxlintLabel[];
  related: unknown[];
}

interface ByFileJson {
  file: string;
  count: number;
  issues: OxlintIssue[];
}

interface RawOxlintOutput {
  diagnostics: OxlintIssue[];
}

interface ManifestEntry {
  index: number;
  file_path: string;
  json_file: string;
  prompt_file: string;
  issue_count: number;
  issue_rules: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SCRIPT_DIR = dirname(import.meta.path);
const PROJECT_ROOT = join(SCRIPT_DIR, "..", "..", "..");
const OXLINT_DIR = join(PROJECT_ROOT, ".oxlint");
const RESULTS_FILE = join(OXLINT_DIR, "oxlint-results.json");
const PROMPTS_DIR = join(OXLINT_DIR, "prompts");
const TEMPLATE_FILE = join(SCRIPT_DIR, "SUB_AGENT_PROMPT_TEMPLATE.md");

// ─── Type Guards ──────────────────────────────────────────────────────────────

function isRawOxlintOutput(value: unknown): value is RawOxlintOutput {
  return (
    typeof value === "object" &&
    value !== null &&
    "diagnostics" in value &&
    Array.isArray((value as Record<string, unknown>).diagnostics)
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeFileName(filePath: string): string {
  return filePath.replace(/\//g, "-").replace(/\.tsx?$/, "");
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

/** Format issue details into a readable summary block for the prompt. */
function formatIssuesSummary(issues: OxlintIssue[]): string {
  const lines: string[] = [];

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i]!;
    const label = issue.labels[0];
    const line = label?.span.line ?? "?";
    const column = label?.span.column ?? "?";

    lines.push(`### Issue ${i + 1} of ${issues.length}`);
    lines.push(`- **Rule**: ${issue.code}`);
    lines.push(`- **Severity**: ${issue.severity}`);
    lines.push(`- **Line**: ${line}, **Column**: ${column}`);
    lines.push(`- **Message**: ${issue.message}`);

    if (issue.help) {
      lines.push(`- **Help**: ${issue.help}`);
    }

    if (issue.labels.length > 1) {
      for (let j = 1; j < issue.labels.length; j++) {
        const lbl = issue.labels[j]!;
        if (lbl.label) {
          lines.push(`  - ${lbl.label} (line ${lbl.span.line}, column ${lbl.span.column})`);
        }
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

/** Collect all unique rule codes from an issues array. */
function collectRuleCodes(issues: OxlintIssue[]): string[] {
  const codes = new Set<string>();
  for (const issue of issues) {
    codes.add(issue.code);
  }
  return [...codes].sort();
}

// ─── Generate missing by-file JSONs ──────────────────────────────────────────

/**
 * The categorize script caps by-file output at 50 files.
 * This function creates by-file JSONs for ALL files using oxlint-results.json.
 */
function generateAllByFileJsons(): number {
  if (!existsSync(RESULTS_FILE)) {
    console.error("❌ No oxlint-results.json found. Run `bun run scripts/oxlint-categorize.ts` first.");
    process.exit(1);
  }

  const raw = readJson<unknown>(RESULTS_FILE);
  if (!isRawOxlintOutput(raw)) {
    console.error("❌ Invalid oxlint-results.json format.");
    process.exit(1);
  }

  const byFile: Record<string, OxlintIssue[]> = {};
  for (const d of raw.diagnostics) {
    if (!byFile[d.filename]) byFile[d.filename] = [];
    byFile[d.filename].push(d);
  }

  let created = 0;
  for (const [filePath, issues] of Object.entries(byFile)) {
    const safeName = safeFileName(filePath);
    const jsonFile = join(OXLINT_DIR, `by-file-${safeName}.json`);

    if (!existsSync(jsonFile)) {
      const data: ByFileJson = { file: filePath, count: issues.length, issues };
      writeFileSync(jsonFile, JSON.stringify(data, null, 2));
      created++;
    }
  }

  return created;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const generateMissing = args.includes("--generate-missing");
  const poolSizeArg = args.find((a, i) => args[i - 1] === "--pool-size");
  const poolSize = poolSizeArg ? Math.max(1, Math.min(36, parseInt(poolSizeArg, 10) || 36)) : 36;

  // Ensure oxlint results exist
  if (!existsSync(OXLINT_DIR) || !existsSync(RESULTS_FILE)) {
    console.error("❌ No .oxlint/ directory or oxlint-results.json found.");
    console.error("   Run `bun run scripts/oxlint-categorize.ts` first.");
    process.exit(1);
  }

  // Generate missing by-file JSONs (files beyond top-50 cap)
  const missing = generateAllByFileJsons();
  if (missing > 0) {
    console.log(`📦 Generated ${missing} missing by-file JSONs (beyond top-50 cap).`);
  }

  // Gather all by-file JSONs
  const byFileJsons = readdirSync(OXLINT_DIR)
    .filter((f) => f.startsWith("by-file-") && f.endsWith(".json"))
    .sort();

  if (byFileJsons.length === 0) {
    console.log("✅ No by-file JSONs found — no oxlint issues to fix.");
    process.exit(0);
  }

  // Read template
  if (!existsSync(TEMPLATE_FILE)) {
    console.error("❌ SUB_AGENT_PROMPT_TEMPLATE.md not found at:", TEMPLATE_FILE);
    process.exit(1);
  }
  const template = readFileSync(TEMPLATE_FILE, "utf-8");

  // Prepare prompts directory
  if (existsSync(PROMPTS_DIR)) {
    // Clear old prompts
    for (const f of readdirSync(PROMPTS_DIR)) {
      if (f.endsWith(".prompt.md") || f === "_manifest.json") {
        writeFileSync(join(PROMPTS_DIR, f), ""); // Clear
      }
    }
  }
  mkdirSync(PROMPTS_DIR, { recursive: true });

  // Process each by-file JSON and generate prompt
  const manifest: ManifestEntry[] = [];
  let totalIssues = 0;

  for (let idx = 0; idx < byFileJsons.length; idx++) {
    const jsonFileName = byFileJsons[idx]!;
    const jsonPath = join(OXLINT_DIR, jsonFileName);
    const data = readJson<ByFileJson>(jsonPath);

    if (data.issues.length === 0) continue;

    totalIssues += data.issues.length;

    // Build issues summary
    const issuesSummary = formatIssuesSummary(data.issues);
    const issueRules = collectRuleCodes(data.issues);

    // Apply template substitutions
    let prompt = template;
    prompt = prompt.replaceAll("{{FILE_PATH}}", data.file);
    prompt = prompt.replaceAll("{{JSON_FILE_PATH}}", `.oxlint/${jsonFileName}`);
    prompt = prompt.replaceAll("{{ISSUE_COUNT}}", String(data.count));
    prompt = prompt.replaceAll("{{ISSUES_SUMMARY}}", issuesSummary);

    // Write prompt file
    const safeName = safeFileName(data.file);
    const promptFileName = `${String(idx).padStart(3, "0")}-${safeName}.prompt.md`;
    const promptPath = join(PROMPTS_DIR, promptFileName);
    writeFileSync(promptPath, prompt);

    manifest.push({
      index: idx,
      file_path: data.file,
      json_file: `.oxlint/${jsonFileName}`,
      prompt_file: `.oxlint/prompts/${promptFileName}`,
      issue_count: data.count,
      issue_rules: issueRules,
    });
  }

  // Write manifest
  const manifestPath = join(PROMPTS_DIR, "_manifest.json");
  writeFileSync(manifestPath, JSON.stringify({
    total_files: manifest.length,
    total_issues: totalIssues,
    pool_size: poolSize,
    generated_at: new Date().toISOString(),
    entries: manifest,
  }, null, 2));

  // Summary
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("  📋 Subagent Prompt Generation Complete");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Total files with issues: ${manifest.length}`);
  console.log(`  Total issues to fix:     ${totalIssues}`);
  console.log(`  Pool size:               ${poolSize}`);
  console.log("");
  console.log("  Prompts written to: .oxlint/prompts/");
  console.log("  Manifest:           .oxlint/prompts/_manifest.json");
  console.log("");

  // Rule breakdown
  const ruleCounts: Record<string, number> = {};
  for (const entry of manifest) {
    for (const rule of entry.issue_rules) {
      ruleCounts[rule] = (ruleCounts[rule] ?? 0) + 1;
    }
  }
  const sortedRules = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]);
  console.log("  Issue rule breakdown:");
  for (const [rule, count] of sortedRules) {
    console.log(`    ${rule}: ${count} files`);
  }
  console.log("");
  console.log("  Next step: dispatch pool of subagents using prompts.");
  console.log("  Read each prompt file and pass its content as the Task prompt.");
  console.log("");
}

main();
