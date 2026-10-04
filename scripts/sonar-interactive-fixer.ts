#!/usr/bin/env bun

/**
 * Interactive SonarQube Issue Fixer
 *
 * Reads .scannerwork/sonar-result.json and provides a rich, interactive CLI
 * to inspect SonarQube issues per file and launch VS Code chat prompts.
 *
 * Usage:
 *   bun run scripts/sonar-interactive-fixer.ts
 *   bun run scripts/sonar-interactive-fixer.ts --dry-run
 */

import { logger } from "@/backend/lib/logger";
import { c, SONAR_RESULT_PATH } from "@/scripts/sonar-interactive-fixer.constants";
import {
  type FileIssues,
  findRelatedFiles,
  groupIssuesByFile,
  loadSonarResults,
  type RunnerMode,
} from "@/scripts/sonar-interactive-fixer.helpers";
import { interactiveMenu } from "@/scripts/sonar-interactive-fixer.parts";

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");

  let runner: RunnerMode = "vscode";
  if (process.argv.includes("--runner=copilot") || process.argv.includes("--copilot")) {
    runner = "copilot";
  }

  const sonarResult = loadSonarResults();
  if (!sonarResult) {
    process.exit(1);
  }

  const fileIssuesMap = groupIssuesByFile(sonarResult);

  if (fileIssuesMap.size === 0) {
    console.log(`\n${c.brightGreen}${c.bold}✨ No issues found in ${SONAR_RESULT_PATH}! Great job!${c.reset}\n`);
    process.exit(0);
  }

  const fileIssuesList: FileIssues[] = Array.from(fileIssuesMap.entries())
    .map(([filePath, issues]) => ({
      filePath,
      relatedFiles: findRelatedFiles(filePath),
      issues,
    }))
    .toSorted((a, b) => b.issues.length - a.issues.length);

  await interactiveMenu(fileIssuesList, runner, isDryRun);
}

if (import.meta.main) {
  main().catch(error => {
    logger.error("Fatal error in sonar-interactive-fixer", { error });
    console.error(`\n${c.red}${c.bold}Fatal Error:${c.reset}`, error);
    process.exit(1);
  });
}
