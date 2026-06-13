import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { join, relative } from "node:path";
import { clearCache } from "./cache";
import { checkSingleFile, runHealthCheck } from "./checker";
import {
  COLORS,
  CONFIG,
  getPowershellCmd,
  logError,
  logInfo,
  logSuccess,
  logWarning,
  PROJECT_ROOT,
  resolveCodesceneBin,
  SCRIPT_DIR,
} from "./config";
import { installCodeScene, isCsInstalled, promptAndSaveToken, showTokenInstructions } from "./installer";

function printHelp() {
  globalThis.console.log(`
${COLORS.BLUE}🔍 CodeScene Health Checker CLI${COLORS.NC}

${COLORS.YELLOW}Usage:${COLORS.NC}
  bun run codescene [flags]

${COLORS.YELLOW}Flags:${COLORS.NC}
  --scan        Run code health check on all TypeScript files
  --file <path> Check a single file
  --no-cache    Force full check of all files (ignore incremental cache)
  --reset       Clear incremental cache
  --help, -h    Display this help message

${COLORS.YELLOW}Examples:${COLORS.NC}
  bun run codescene --scan
  bun run codescene --scan --no-cache
  bun run codescene --file src/components/MyComponent.tsx
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

function maskToken(token: string): string {
  if (!token) return "(empty)";
  if (token.length <= 8) return "********";
  return `${token.slice(0, 4)}****${token.slice(-4)}`;
}

interface TokenSource {
  token: string;
  source: string;
}

function resolveTokenFromRegistry(): string | null {
  if (process.platform !== "win32") return null;

  const ps = spawnSync(
    getPowershellCmd(),
    ["-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('CS_ACCESS_TOKEN', 'User')"],
    { encoding: "utf8" }
  );
  return ps.status === 0 ? ps.stdout?.trim() || null : null;
}

function getInitialTokenSource(): TokenSource {
  if (CONFIG.CS_TOKEN) {
    if (fs.existsSync(CONFIG.TOKEN_FILE)) {
      const fileToken = fs.readFileSync(CONFIG.TOKEN_FILE, "utf8").trim();
      if (fileToken === CONFIG.CS_TOKEN) {
        return { token: CONFIG.CS_TOKEN, source: "Local File (token.txt)" };
      }
    }
    return { token: CONFIG.CS_TOKEN, source: "Environment" };
  }

  const regToken = resolveTokenFromRegistry();
  if (regToken) {
    CONFIG.CS_TOKEN = regToken;
    process.env.CS_ACCESS_TOKEN = regToken;
    return { token: regToken, source: "Windows Registry" };
  }

  return { token: "", source: "None" };
}

function verifyToken(token: string): { isValid: boolean; output: string } {
  const csBin = resolveCodesceneBin();
  const testFileRel = relative(PROJECT_ROOT, join(SCRIPT_DIR, "config.ts"));
  const testResult = spawnSync(csBin, ["check", testFileRel], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: { ...process.env, CS_ACCESS_TOKEN: token },
  });
  const testOutput = (testResult.stdout || "") + (testResult.stderr || "");
  const isValid =
    testResult.status === 0 && !/unauthorized|invalid.*token|authentication.*failed|license.*failed/i.test(testOutput);
  return { isValid, output: testOutput };
}

async function configureToken() {
  const initial = getInitialTokenSource();

  if (initial.token) {
    logInfo(`Testing CS_ACCESS_TOKEN from ${initial.source} (${maskToken(initial.token)})...`);
    const result = verifyToken(initial.token);
    if (result.isValid) {
      logSuccess(`Token from ${initial.source} is valid.`);
      return;
    }
    logWarning(`Token from ${initial.source} is invalid or license check failed.`);
    if (result.output) {
      globalThis.console.log(`${COLORS.YELLOW}CLI Output:${COLORS.NC}\n${result.output}`);
    }
  }

  const tokenSaved = await promptAndSaveToken();
  if (!tokenSaved) {
    logError("CS_ACCESS_TOKEN environment variable is not set");
    showTokenInstructions();
    process.exit(1);
  }

  logInfo(`Verifying new token (${maskToken(CONFIG.CS_TOKEN)})...`);
  const newResult = verifyToken(CONFIG.CS_TOKEN);
  if (!newResult.isValid) {
    logError(`The new token provided is also invalid or license check failed (Token: ${maskToken(CONFIG.CS_TOKEN)})`);
    if (newResult.output) {
      globalThis.console.log(`${COLORS.RED}CLI Output:${COLORS.NC}\n${newResult.output}`);
    }
    showTokenInstructions();
    process.exit(1);
  }

  logSuccess(`New token verified and ready to use (${maskToken(CONFIG.CS_TOKEN)})`);
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

  if (!isCsInstalled()) {
    logWarning("CodeScene CLI (cs) is not installed");
    if (!installCodeScene()) {
      process.exit(1);
    }
  }

  checkVersion();
  await configureToken();

  if (args.includes("--file")) {
    const fileIndex = args.indexOf("--file");
    const filePath = args[fileIndex + 1];
    if (!filePath) {
      logError("--file requires a path argument");
      process.exit(1);
    }
    checkSingleFile(filePath);
  } else if (args.includes("--scan")) {
    const noCache = args.includes("--no-cache");
    if (noCache) {
      logInfo("Running full check (ignoring cache)");
    }
    await runHealthCheck(noCache);
  } else {
    logError("Invalid arguments. Use --help for usage information.");
    process.exit(1);
  }

  globalThis.console.log("");
  logSuccess("All done! 🎉");
  globalThis.console.log("");
}

void main();
