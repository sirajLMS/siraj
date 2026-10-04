import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "@/backend/lib/logger";
import { c, PROJECT_ROOT, SONAR_RESULT_PATH } from "@/scripts/sonar-interactive-fixer.constants";
export interface SonarIssue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  line?: number;
  message: string;
  status: string;
  type: string;
}

export interface SonarResult {
  issues: SonarIssue[];
}

export interface FileIssues {
  filePath: string;
  relatedFiles: string[];
  issues: SonarIssue[];
}

export type RunnerMode = "vscode" | "copilot";

function isSonarIssue(value: unknown): value is SonarIssue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const v = Object.fromEntries(Object.entries(value));
  return (
    typeof v.key === "string" &&
    typeof v.rule === "string" &&
    typeof v.severity === "string" &&
    typeof v.component === "string" &&
    typeof v.message === "string" &&
    typeof v.status === "string" &&
    typeof v.type === "string"
  );
}

function isSonarResult(value: unknown): value is SonarResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const v = Object.fromEntries(Object.entries(value));
  return Array.isArray(v.issues) && v.issues.every(isSonarIssue);
}

export function severityBadge(severity?: string): string {
  const sev = (severity ?? "UNKNOWN").toUpperCase();
  switch (sev) {
    case "BLOCKER":
      return `${c.bgRed}${c.brightWhite}${c.bold} BLOCKER ${c.reset}`;
    case "CRITICAL":
      return `${c.red}${c.bold}CRITICAL${c.reset}`;
    case "MAJOR":
      return `${c.yellow}${c.bold}MAJOR${c.reset}`;
    case "MINOR":
      return `${c.blue}MINOR${c.reset}`;
    case "INFO":
      return `${c.cyan}INFO${c.reset}`;
    default:
      return `${c.gray}${sev}${c.reset}`;
  }
}

export function typeBadge(type?: string): string {
  const t = (type ?? "UNKNOWN").toUpperCase();
  switch (t) {
    case "BUG":
      return `${c.brightRed}🐛 BUG${c.reset}`;
    case "VULNERABILITY":
      return `${c.brightMagenta}🛡️ VULNERABILITY${c.reset}`;
    case "CODE_SMELL":
      return `${c.yellow}☣️ CODE SMELL${c.reset}`;
    default:
      return `${c.gray}${t}${c.reset}`;
  }
}

export function clearScreen(): void {
  process.stdout.write("\x1Bc");
}

/**
 * Load and parse sonar-result.json
 */
export function loadSonarResults(): SonarResult | null {
  const fullPath = join(PROJECT_ROOT, SONAR_RESULT_PATH);

  if (!existsSync(fullPath)) {
    logger.error(`SonarQube result file not found: ${fullPath}`);
    console.log(
      `\n${c.red}${c.bold}✖ Error:${c.reset} SonarQube result file not found at ${c.cyan}${fullPath}${c.reset}`
    );
    console.log(`${c.yellow}💡 Hint:${c.reset} Run ${c.bold}bun sonar-scan${c.reset} first to generate results.\n`);
    return null;
  }

  try {
    const content = readFileSync(fullPath, "utf-8");
    const parsed: unknown = JSON.parse(content);
    if (!isSonarResult(parsed)) {
      throw new Error("Parsed JSON does not match expected SonarResult shape");
    }
    return parsed;
  } catch (error) {
    logger.error("Failed to parse sonar-result.json", { error });
    console.log(`\n${c.red}${c.bold}✖ Error:${c.reset} Failed to parse ${c.cyan}${SONAR_RESULT_PATH}${c.reset}\n`);
    return null;
  }
}

/**
 * Group issues by file path
 */
export function groupIssuesByFile(result: SonarResult): Map<string, SonarIssue[]> {
  const fileIssuesMap = new Map<string, SonarIssue[]>();

  for (const issue of result.issues) {
    const filePath = issue.component;

    let issues = fileIssuesMap.get(filePath);
    if (!issues) {
      issues = [];
      fileIssuesMap.set(filePath, issues);
    }

    issues.push(issue);
  }

  return fileIssuesMap;
}

export function findRelatedFiles(_filePath: string): string[] {
  return [];
}

export function isTestFile(filePath: string): boolean {
  return filePath.includes(".test.") || filePath.includes(".spec.");
}

export function getFileLanguage(filePath: string): string {
  if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) return "typescript";
  if (filePath.endsWith(".jsx") || filePath.endsWith(".js")) return "javascript";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".sql")) return "sql";
  if (filePath.endsWith(".css")) return "css";
  if (filePath.endsWith(".md")) return "markdown";
  return "";
}

// ── Chat Prompt & Session Launch ────────────────────────────────────────────

export function generateChatPrompt(fileIssues: FileIssues): string {
  const { filePath, issues } = fileIssues;
  const isTest = isTestFile(filePath);
  const lang = getFileLanguage(filePath);

  let fileContentBlock = "";
  const fullPath = join(PROJECT_ROOT, filePath);
  if (existsSync(fullPath)) {
    try {
      const content = readFileSync(fullPath, "utf-8");
      fileContentBlock = `\`\`\`${lang}\n${content}\n\`\`\``;
    } catch {
      fileContentBlock = `(Unable to read file content from ${filePath})`;
    }
  }

  const issuesJsonStr = JSON.stringify(
    issues.map(i => ({
      key: i.key,
      rule: i.rule,
      severity: i.severity,
      line: i.line,
      message: i.message,
      type: i.type,
    })),
    null,
    2
  );

  const instructions: string[] = [
    `Please fix all SonarQube issues in file '${filePath}' with strict adherence to high code quality, clean architecture, and project standards.`,
    ``,
    `Target File: ${filePath}`,
    ``,
    `File Content:`,
    fileContentBlock,
    ``,
    `Issues to resolve (from SonarQube results):`,
    `\`\`\`json`,
    issuesJsonStr,
    `\`\`\``,
    ``,
    `Core Quality Directives:`,
    `- Fix root causes cleanly without introducing hacky fallbacks, suppressing types with 'any', or masking symptoms.`,
    `- Preserve existing architecture, layer boundaries, and API contracts.`,
    `- Keep code readable, modular, and maintainable.`,
    `- CRITICAL RESTRICTION: NEVER run codescene with '--reset' or '--full' flags. Only run codescene with the target file parameter (via sub-loop or direct file argument).`,
    ``,
    `Workflow & Verification Steps:`,
    `1. Refactor and fix the issues in '${filePath}' listed in the JSON payload above.`,
  ];

  let stepNum = 2;

  if (isTest) {
    instructions.push(
      `${stepNum}. Run log-captured test verification to ensure all test assertions pass cleanly without regressions:`,
      `   bun run scripts/run-test/run-test.ts ${filePath}`
    );
    stepNum++;
  }

  instructions.push(
    `${stepNum}. Run the progressive sub-loop health check to verify static analysis (tsgo -> biome -> lint -> codescene, targeted strictly to '${filePath}'):`,
    `   bun run scripts/health/sub-loop.ts ${filePath} --lifecycle codescene`
  );
  stepNum++;

  instructions.push(
    `${stepNum}. Once all verification checks pass clean, remove the resolved issues from Sonar manager results:`,
    `   bun scripts/sonar-manager.ts delete --file ${filePath}`
  );

  return instructions.join("\n");
}
