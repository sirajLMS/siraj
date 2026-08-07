/**
 * AI AGENT PROMPT:
 * Use this script to manage Sonar results found in .scannerwork/sonar-result.json.
 * **Do NOT run a new Sonar analysis command.** Work ONLY with existing results.
 *
 * RESOLUTION ORDER:
 * 1. FIX DUPLICATIONS: Run `bun scripts/sonar-manager.ts list-duplicates`.
 *    - Assign ALL files in a duplication group to a SINGLE sub-agent.
 *    - After fixing, run `bun scripts/sonar-manager.ts delete --file <path>` for each file.
 * 2. FIX ISSUES: Once duplicates are empty, run `bun scripts/sonar-manager.ts list-files`.
 *    - Assign EACH file to a separate sub-agent (e.g., generalist).
 *    - Sub-agent task: `list-issues --file <path>`, apply fixes, then `delete --file <path>`.
 *
 * NOTES:
 * - Use `--all-duplicates` to clear the entire duplication list at once if needed.
 * - Always verify with `list-duplicates` and `list-files` until both are empty.
 */
import fs from "node:fs";
import path from "node:path";

const SONAR_RESULT_PATH = path.join(process.cwd(), ".scannerwork", "sonar-result.json");
const STATE_FILE = path.join(process.cwd(), ".quality-gate-state.json");

interface QualityState {
  stage: string;
  owner: string;
  lifecycle: string;
  lastRun: string;
}

function updateQualityStateIfOwned(result: SonarResult) {
  const hasIssues = result.issues && result.issues.length > 0;
  const hasDuplicates = result.duplicatedBlocksDetails && result.duplicatedBlocksDetails.length > 0;

  if (!hasIssues && !hasDuplicates && fs.existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as QualityState;
      if (state.owner === "sonar-manager") {
        state.owner = "quality-gate";
        state.stage = "SONAR_RESULTS";
        state.lifecycle = "NEED_CONFIRM";
        state.lastRun = new Date().toISOString();
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
        console.log("\n✅ All Sonar issues cleared. Ownership transferred back to quality-gate.");
        console.log("ℹ️ Rerun 'bun quality-gate' to confirm perfect health.");
      }
    } catch {
      // Ignore state update errors
    }
  }
}

interface TextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

interface SonarIssue {
  rule: string;
  severity: string;
  component: string;
  line: number;
  message: string;
  textRange?: TextRange;
}

interface DuplicationBlock {
  refPath: string;
  from: number;
  to: number;
  size: number;
}

interface DuplicationGroup {
  blocks: DuplicationBlock[];
}

interface DuplicatedBlocksDetail {
  file: string;
  blockCount: number;
  groups: DuplicationGroup[];
}

interface DuplicationMetric {
  metric: string;
  value?: string;
  bestValue?: boolean;
}

interface SonarResult {
  issues: SonarIssue[];
  duplicationMetrics?: DuplicationMetric[];
  duplicatedBlocksDetails?: DuplicatedBlocksDetail[];
}

function readSonarResult(): SonarResult {
  if (!fs.existsSync(SONAR_RESULT_PATH)) {
    console.error(`File not found: ${SONAR_RESULT_PATH}`);
    process.exit(1);
  }
  const content = fs.readFileSync(SONAR_RESULT_PATH, "utf-8");
  return JSON.parse(content) as SonarResult;
}

function writeSonarResult(result: SonarResult) {
  fs.writeFileSync(SONAR_RESULT_PATH, JSON.stringify(result, null, 2), "utf-8");
}

function listFiles(result: SonarResult) {
  if (!result.issues || result.issues.length === 0) {
    console.log("No files with issues found.");
    return;
  }
  const files = [...new Set(result.issues.map(i => i.component))].toSorted((a, b) => a.localeCompare(b));
  console.log("Files with issues:");
  for (const f of files) {
    console.log(`- ${f}`);
  }
}

function listDuplicates(result: SonarResult, fileArg: string | null) {
  if (!result.duplicatedBlocksDetails || result.duplicatedBlocksDetails.length === 0) {
    console.log("No duplications found.");
    return;
  }

  let details = result.duplicatedBlocksDetails;
  if (fileArg) details = details.filter(d => d.file === fileArg);

  console.log("Duplicated Blocks:");
  details.forEach((d, idx) => {
    console.log(`\n[${idx}] File: ${d.file} (${d.blockCount} blocks)`);
    d.groups.forEach((g, gIdx) => {
      console.log(`  Group ${gIdx + 1}:`);
      g.blocks.forEach(b => {
        console.log(`    - ${b.refPath} (Lines ${b.from}-${b.to}, size: ${b.size})`);
      });
    });
  });
}

function listIssues(result: SonarResult, fileArg: string | null, ruleArg: string | null, groupByRule: boolean) {
  let issues = result.issues;
  if (fileArg) issues = issues.filter(i => i.component === fileArg);
  if (ruleArg) issues = issues.filter(i => i.rule === ruleArg);

  if (groupByRule) {
    const groups: Record<string, SonarIssue[]> = {};
    for (const i of issues) {
      groups[i.rule] = groups[i.rule] || [];
      groups[i.rule].push(i);
    }
    for (const [rule, ruleIssues] of Object.entries(groups)) {
      console.log(`\nRule: ${rule} (${ruleIssues.length} issues)`);
      for (const i of ruleIssues) {
        console.log(`  - ${i.component}:${i.line}: ${i.message}`);
      }
    }
  } else {
    issues.forEach((i, idx) => {
      console.log(`[${idx}] ${i.component}:${i.line} (${i.rule}): ${i.message}`);
    });
  }
}

function deleteIssues(result: SonarResult, fileArg: string | null, ruleArg: string | null, allDuplicates: boolean) {
  if (!fileArg && !ruleArg && !allDuplicates) {
    console.error("Error: Must specify --file, --rule, or --all-duplicates to delete.");
    process.exit(1);
  }

  let deletedIssuesCount = 0;
  if (result.issues) {
    const initialCount = result.issues.length;
    let newIssues = result.issues;
    if (fileArg) newIssues = newIssues.filter(i => i.component !== fileArg);
    if (ruleArg) newIssues = newIssues.filter(i => i.rule !== ruleArg);
    deletedIssuesCount = initialCount - newIssues.length;
    result.issues = newIssues;
  }

  let deletedDuplicatesCount = 0;
  if (result.duplicatedBlocksDetails) {
    if (allDuplicates) {
      deletedDuplicatesCount = result.duplicatedBlocksDetails.length;
      result.duplicatedBlocksDetails = [];
    } else if (fileArg) {
      const initialCount = result.duplicatedBlocksDetails.length;
      result.duplicatedBlocksDetails = result.duplicatedBlocksDetails.filter(d => d.file !== fileArg);
      deletedDuplicatesCount = initialCount - result.duplicatedBlocksDetails.length;
    }
  }

  writeSonarResult(result);
  console.log(`Deleted ${deletedIssuesCount} issues and ${deletedDuplicatesCount} duplicate entries.`);
  updateQualityStateIfOwned(result);
}

function showHelp() {
  console.log(`
Sonar Issue Manager Script

Usage:
  bun scripts/sonar-manager.ts [action] [options]

Actions:
  list-files            List all files with issues
  list-issues           List issues
  list-duplicates       List duplicated blocks
  delete                Delete issues/duplicates (use with flags)
  help                  Show this help

Options:
  --file <path>         Filter by file path
  --rule <rule>         Filter by issue rule/type
  --all-duplicates      Delete all duplication entries
  --group-by-rule       Group output by rule (for list-issues)

Examples:
  bun scripts/sonar-manager.ts list-files
  bun scripts/sonar-manager.ts list-duplicates
  bun scripts/sonar-manager.ts list-issues --file app/api/storage/upload/[id]/route.ts
  bun scripts/sonar-manager.ts delete --file app/api/storage/upload/[id]/route.ts
  bun scripts/sonar-manager.ts delete --all-duplicates
`);
}

function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  if (!action || action === "help" || args.includes("--help")) {
    showHelp();
    return;
  }

  const result = readSonarResult();
  const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
  const ruleArg = args.includes("--rule") ? args[args.indexOf("--rule") + 1] : null;
  const groupByRule = args.includes("--group-by-rule");
  const allDuplicates = args.includes("--all-duplicates");

  switch (action) {
    case "list-files":
      listFiles(result);
      updateQualityStateIfOwned(result);
      break;

    case "list-issues":
      listIssues(result, fileArg, ruleArg, groupByRule);
      break;

    case "list-duplicates":
      listDuplicates(result, fileArg);
      updateQualityStateIfOwned(result);
      break;

    case "delete":
      deleteIssues(result, fileArg, ruleArg, allDuplicates);
      break;

    default:
      console.error(`Unknown action: ${action}`);
      showHelp();
      process.exit(1);
  }
}

main();
