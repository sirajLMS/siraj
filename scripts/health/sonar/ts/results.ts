import { COLORS, CONFIG, logInfo, logSuccess, logWarning } from "@/scripts/health/sonar/ts/config";
import {
  fetchAndPrintDuplicatedBlocks,
  fetchDuplicationMetrics,
  printDuplicationMetrics,
} from "@/scripts/health/sonar/ts/results.duplications";
import { fetchAllIssues, printIssues } from "@/scripts/health/sonar/ts/results.issues";
import { saveResultsJson } from "@/scripts/health/sonar/ts/results.output";
import type {
  DuplicationFileDetails,
  FetchResultsOptions,
  SonarIssue,
  SonarMeasure,
} from "@/scripts/health/sonar/ts/results.types";

async function isAnalysisReady(options: {
  authHeader: string;
  scanStartTime: number;
}): Promise<{ ready: boolean; date?: string }> {
  try {
    const response = await fetch(
      `${CONFIG.SONAR_HOST}/api/project_analyses/search?project=${CONFIG.PROJECT_KEY}&ps=1`,
      { headers: { Authorization: options.authHeader } }
    );

    if (!response.ok) return { ready: false };

    const data: { analyses: Array<{ date: string }> } = await response.json();
    if (data.analyses.length === 0) return { ready: false };

    const analysisDate = data.analyses[0].date;
    const analysisTimestamp = new Date(analysisDate).getTime();

    return { ready: analysisTimestamp >= options.scanStartTime, date: analysisDate };
  } catch (err) {
    logWarning(`Error while checking analysis: ${err instanceof Error ? err.message : String(err)}`);
    return { ready: false };
  }
}

export async function waitForAnalysisProcessing(token: string, scanStartTime: number): Promise<void> {
  logInfo("Waiting for analysis to be processed...");

  const maxAttempts = 30;
  const authHeader = `Basic ${btoa(token + ":")}`;

  const poll = async (attempt: number): Promise<void> => {
    if (attempt >= maxAttempts) {
      globalThis.console.log("");
      logWarning("Analysis results may not be fully processed yet, but continuing...");
      return;
    }

    const { ready, date } = await isAnalysisReady({ authHeader, scanStartTime });
    if (ready) {
      logSuccess(`Fresh analysis results are ready (analyzed at: ${date})`);
      return;
    }

    process.stdout.write(".");
    await new Promise(resolve => setTimeout(resolve, 2000));
    return poll(attempt + 1);
  };

  await poll(0);
}

export async function fetchAndDisplayResults(options: FetchResultsOptions): Promise<void> {
  const { token, includeDuplications = true, outputFilename = "sonar-result.json" } = options;
  logInfo("Fetching analysis results...");

  try {
    const fetchTasks: [Promise<SonarIssue[]>, Promise<SonarMeasure[]> | Promise<null>] = [
      fetchAllIssues(token),
      includeDuplications ? fetchDuplicationMetrics(token) : Promise.resolve(null),
    ];

    const [issues, duplicationMetrics] = await Promise.all(fetchTasks);

    let duplicatedBlocksDetails: DuplicationFileDetails[] | null = null;
    if (includeDuplications && duplicationMetrics) {
      printDuplicationMetrics(duplicationMetrics);
      duplicatedBlocksDetails = await fetchAndPrintDuplicatedBlocks(token);
    }

    printIssues(issues);

    saveResultsJson(issues, duplicationMetrics, duplicatedBlocksDetails, outputFilename);

    globalThis.console.log(
      `\n  View detailed report: ${COLORS.BLUE}${CONFIG.SONAR_HOST}/dashboard?id=${CONFIG.PROJECT_KEY}${COLORS.NC}\n`
    );
  } catch (error) {
    logWarning(`Error fetching results: ${error instanceof Error ? error.message : String(error)}`);
  }
}
