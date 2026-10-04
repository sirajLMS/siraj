import fs from "node:fs";
import path from "node:path";
import { CONFIG, logSuccess, logWarning } from "@/scripts/health/sonar/ts/config";
import type { DuplicationFileDetails, SonarIssue, SonarMeasure } from "@/scripts/health/sonar/ts/results.types";

function simplifyIssue(issue: SonarIssue) {
  return {
    rule: issue.rule,
    severity: issue.severity,
    component: issue.component?.replace(`${CONFIG.PROJECT_KEY}:`, ""),
    line: issue.line,
    message: issue.message,
    textRange: issue.textRange,
    flows:
      issue.flows && issue.flows.length > 0
        ? issue.flows.map(f => ({
            locations: f.locations?.map(l => ({
              component: l.component?.replace(`${CONFIG.PROJECT_KEY}:`, ""),
              textRange: l.textRange,
              msg: l.msg,
            })),
          }))
        : undefined,
  };
}

/** Persist fetched issues and duplication details as JSON under .scannerwork/. */
export function saveResultsJson(
  issues: SonarIssue[],
  duplicationMetrics: SonarMeasure[] | null,
  duplicatedBlocksDetails: DuplicationFileDetails[] | null,
  outputFilename: string
): void {
  try {
    const outDir = path.join(process.cwd(), ".scannerwork");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, outputFilename);

    const simplifiedIssues = issues.map(simplifyIssue);

    const resultData = {
      issues: simplifiedIssues,
      ...(duplicationMetrics ? { duplicationMetrics } : {}),
      ...(duplicatedBlocksDetails ? { duplicatedBlocksDetails } : {}),
    };
    fs.writeFileSync(outPath, JSON.stringify(resultData, null, 2), "utf8");
    logSuccess(`Results saved to ${outPath}`);
  } catch (fsError) {
    logWarning(`Failed to save results to JSON: ${fsError instanceof Error ? fsError.message : String(fsError)}`);
  }
}
