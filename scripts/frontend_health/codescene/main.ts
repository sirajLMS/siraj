import { spawnSync } from "node:child_process";
import { clearCache } from "./cache";
import { runHealthCheck } from "./checker";
import {
  COLORS,
  CONFIG,
  getPowershellCmd,
  logError,
  logInfo,
  logSuccess,
  logWarning,
  resolveCodesceneBin,
} from "./config";
import { installCodeScene, isCsInstalled, promptAndSaveToken, showTokenInstructions } from "./installer";

function printHelp() {
  globalThis.console.log(`
${COLORS.BLUE}🔍 CodeScene Health Checker CLI${COLORS.NC}

${COLORS.YELLOW}Usage:${COLORS.NC}
  bun run codescene [flags]

${COLORS.YELLOW}Flags:${COLORS.NC}
  --scan        Run code health check on all TypeScript files
  --full        Force full check of all files (ignore incremental cache)
  --reset       Clear incremental cache
  --help, -h    Display this help message

${COLORS.YELLOW}Examples:${COLORS.NC}
  bun run codescene --scan
  bun run codescene --scan --full
  bun run codescene --reset
`);
}

function checkVersion() {
  const csBin = resolveCodesceneBin();
  const csVersionResult = spawnSync(csBin, ["version"], {
    encoding: "utf8",
    env: process.env,
  });
  if (csVersionResult.error) {
    logError("Failed to execute CodeScene CLI: " + csVersionResult.error.message);
    process.exit(1);
  }
  const version = csVersionResult.stdout?.trim() || "unknown";
  logSuccess(`CodeScene CLI installed: ${COLORS.BLUE}${version}${COLORS.NC}`);
}

async function configureToken() {
  if (!CONFIG.CS_TOKEN && process.platform === "win32") {
    // Attempt to read directly from User Environment to bypass VS Code terminal inheritance issues
    const ps = spawnSync(
      getPowershellCmd(),
      ["-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('CS_ACCESS_TOKEN', 'User')"],
      { encoding: "utf8" }
    );
    const regToken = ps.stdout?.trim();
    if (ps.status === 0 && regToken) {
      CONFIG.CS_TOKEN = regToken;
      process.env.CS_ACCESS_TOKEN = regToken;
      logInfo("Loaded token from Windows User Registry");
    }
  }

  if (!CONFIG.CS_TOKEN) {
    const tokenSaved = await promptAndSaveToken();
    if (!tokenSaved) {
      logError("CS_ACCESS_TOKEN environment variable is not set");
      showTokenInstructions();
      process.exit(1);
    }
  }
  logSuccess("CS_ACCESS_TOKEN is configured");

  // Test token
  const csBin = resolveCodesceneBin();
  const testResult = spawnSync(csBin, ["check", "--help"], {
    encoding: "utf8",
    env: process.env,
  });
  const testOutput = (testResult.stdout || "") + (testResult.stderr || "");
  if (/unauthorized|invalid.*token|authentication.*failed/i.test(testOutput)) {
    logError("CodeScene token appears to be invalid");
    showTokenInstructions();
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (args.includes("--reset")) {
    clearCache();
    logSuccess("Cache cleared.");
    return;
  }

  globalThis.console.log("");
  logInfo("🔍 CodeScene Health Checker");
  globalThis.console.log("");

  // Check installation
  if (!isCsInstalled()) {
    logWarning("CodeScene CLI (cs) is not installed");
    if (!installCodeScene()) {
      process.exit(1);
    }
  }

  checkVersion();
  await configureToken();

  if (args.includes("--scan")) {
    const forceFull = args.includes("--full");
    if (forceFull) {
      logInfo("Running full check (ignoring cache)");
    }
    await runHealthCheck(forceFull);
  } else {
    logError("Invalid arguments. Use --help for usage information.");
    process.exit(1);
  }

  globalThis.console.log("");
  logSuccess("All done! 🎉");
  globalThis.console.log("");
}

void main();
