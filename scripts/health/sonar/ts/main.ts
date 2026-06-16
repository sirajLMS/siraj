import { clearSonarCache, isProjectChanged, saveProjectFingerprint } from "./cache";
import { COLORS, logError, logInfo, logSuccess } from "./config";
import { checkDocker, checkDockerCompose, startSonarQube } from "./docker";
import { fetchAndDisplayResults, waitForAnalysisProcessing } from "./results";
import { installScanner, runAnalysis } from "./scanner";
import {
  changeAdminPassword,
  createProject,
  generateToken,
  waitForSonarQube,
  writeConnectionInfo,
} from "./sonarqube-api";
import { resetSetup } from "./state";

function printHelp() {
  globalThis.console.log(`
${COLORS.BLUE}🔍 SonarQube Analysis Runner CLI${COLORS.NC}

${COLORS.YELLOW}Usage:${COLORS.NC}
  bun run sonar-scan [flags]

${COLORS.YELLOW}Flags:${COLORS.NC}
  --scan        Run SonarQube analysis (skipped if no changes detected)
  --fresh       Force full SonarQube analysis (setup, scan, and results)
  --result      Fetch and display current analysis issues (no scan)
  --full        Fetch and display analysis issues with duplication metrics (no scan)
  --reset       Reset SonarQube setup state and clear cache
  --help, -h    Display this help message

${COLORS.YELLOW}Examples:${COLORS.NC}
  bun run sonar-scan --scan
  bun run sonar-scan --fresh
  bun run sonar-scan --result
  bun run sonar-scan --full
  bun run sonar-scan --reset
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (args.includes("--reset")) {
    resetSetup();
    clearSonarCache();
    return;
  }

  globalThis.console.log("");
  logInfo("🔍 SonarQube Analysis Runner");
  globalThis.console.log("");

  try {
    const isScanRequested = args.includes("--scan") || args.includes("--fresh");
    const forceScan = args.includes("--fresh");

    if (isScanRequested) {
      const changed = await isProjectChanged();
      if (!changed && !forceScan) {
        logSuccess("✨ No changes detected since last scan. Skipping analysis phase.");
        const token = await generateToken();
        await fetchAndDisplayResults({ token, includeDuplications: true, outputFilename: "sonar-result.json" });
        return;
      }

      if (forceScan) {
        logInfo("🔄 Force scan requested. Ignoring cache.");
      } else {
        logInfo("🔄 Changes detected. Starting analysis...");
      }

      checkDocker();
      checkDockerCompose();
      startSonarQube();
      await waitForSonarQube();
      await changeAdminPassword();
      const token = await generateToken();
      await createProject(token);
      writeConnectionInfo(token);
      await installScanner();
      const scanStartTime = runAnalysis(token);
      await waitForAnalysisProcessing(token, scanStartTime);
      await saveProjectFingerprint();
      await fetchAndDisplayResults({ token, includeDuplications: true, outputFilename: "sonar-result.json" });
    } else if (args.includes("--result")) {
      const token = await generateToken();
      writeConnectionInfo(token);
      await fetchAndDisplayResults({ token, includeDuplications: false, outputFilename: "sonar-result.json" });
    } else if (args.includes("--full")) {
      const token = await generateToken();
      writeConnectionInfo(token);
      await fetchAndDisplayResults({ token, includeDuplications: true, outputFilename: "sonar-full.json" });
    } else {
      logError("Invalid arguments. Use --help for usage information.");
      process.exit(1);
    }

    globalThis.console.log("");
    logSuccess("All done! 🎉");
    globalThis.console.log("");
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

void main();
