import { COLORS, CONFIG, logWarning } from "@/scripts/health/sonar/ts/config";
import { SEVERITY_COLORS, SEVERITY_MAP, SEVERITY_SYMBOLS } from "@/scripts/health/sonar/ts/results.constants";
import type { SonarIssue, SonarResponse } from "@/scripts/health/sonar/ts/results.types";

export async function fetchAllIssues(token: string): Promise<SonarIssue[]> {
  const pageSize = 500;
  const authHeader = `Basic ${btoa(token + ":")}`;

  const fetchPage = async (page: number): Promise<SonarResponse> => {
    const url = `${CONFIG.SONAR_HOST}/api/issues/search?componentKeys=${CONFIG.PROJECT_KEY}&statuses=OPEN,CONFIRMED&p=${page}&ps=${pageSize}`;
    const response = await fetch(url, {
      headers: { Authorization: authHeader },
    });

    if (!response.ok) {
      if (response.status === 400 && page * pageSize > 10000) {
        logWarning("Reached SonarQube's 10,000 issues pagination limit. Some issues may not be included.");
        return { total: 0, p: page, ps: pageSize, paging: { pageIndex: page, pageSize, total: 0 }, issues: [] };
      }
      throw new Error(`SonarQube API error: ${response.status}`);
    }

    const data: SonarResponse = await response.json();
    return data;
  };

  const fetchNext = async (page: number, allIssues: SonarIssue[]): Promise<SonarIssue[]> => {
    const data = await fetchPage(page);
    allIssues.push(...data.issues);

    if (allIssues.length >= data.paging.total || allIssues.length >= 10000) return allIssues;
    return fetchNext(page + 1, allIssues);
  };

  return fetchNext(1, []);
}

export function printIssues(issues: SonarIssue[]): void {
  if (issues.length === 0) {
    globalThis.console.log(`\n${COLORS.GREEN}✨ No code quality issues found!${COLORS.NC}\n`);
    return;
  }

  const grouped = groupIssuesByFile(issues);
  const sortedFiles = Array.from(grouped.keys()).toSorted((a, b) => a.localeCompare(b));

  globalThis.console.log(
    `\n${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`
  );
  globalThis.console.log(`${COLORS.CYAN}  CODE QUALITY ISSUES${COLORS.NC}`);
  globalThis.console.log(
    `${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.NC}`
  );

  for (const filePath of sortedFiles) {
    const fileIssues = grouped.get(filePath);
    if (!fileIssues) continue;

    globalThis.console.log(`\n${COLORS.NC}${filePath}`);
    for (const issue of fileIssues) {
      globalThis.console.log(formatIssue({ issue, filePath }));
    }
  }

  const summary = calculateSummary(issues);
  const totalProblems = summary.errors + summary.warnings + summary.infos;
  globalThis.console.log("");
  globalThis.console.log(
    `${COLORS.RED}✖ ${String(totalProblems)} problems ${COLORS.NC}(${COLORS.RED}${String(summary.errors)} errors${COLORS.NC}, ${COLORS.YELLOW}${String(summary.warnings)} warnings${COLORS.NC}, ${COLORS.BLUE}${String(summary.infos)} infos${COLORS.NC})`
  );
  globalThis.console.log("");
}

function calculateSummary(issues: SonarIssue[]): {
  errors: number;
  warnings: number;
  infos: number;
} {
  let errors = 0,
    warnings = 0,
    infos = 0;
  for (const issue of issues) {
    const severity = SEVERITY_MAP[issue.severity] ?? "warning";
    if (severity === "error") errors++;
    else if (severity === "warning") warnings++;
    else infos++;
  }
  return { errors, warnings, infos };
}

function groupIssuesByFile(issues: SonarIssue[]): Map<string, SonarIssue[]> {
  const grouped = new Map<string, SonarIssue[]>();
  for (const issue of issues) {
    const filePath = issue.component.replace(`${CONFIG.PROJECT_KEY}:`, "");
    const fileIssues = grouped.get(filePath) ?? [];
    fileIssues.push(issue);
    grouped.set(filePath, fileIssues);
  }
  return grouped;
}

function formatIssue(options: { issue: SonarIssue; filePath: string }): string {
  const { issue, filePath } = options;
  const severity = SEVERITY_MAP[issue.severity] ?? "warning";
  const symbol = SEVERITY_SYMBOLS[severity] ?? "•";
  const color = SEVERITY_COLORS[severity] ?? COLORS.NC;
  const line = issue.line ?? issue.textRange?.startLine ?? 0;
  const column = issue.textRange?.startOffset ?? 0;

  return `  ${COLORS.NC}${filePath}:${line}:${column}  ${color}${symbol}${COLORS.NC}  ${issue.message}  ${COLORS.NC}${issue.rule}`;
}
