import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { COLORS, CONFIG, logError, logInfo, logSuccess } from "@/scripts/health/codescene/config";

export function isCsInstalled(): boolean {
  const platform = os.platform();
  const cmd = platform === "win32" ? String.raw`C:\Windows\System32\where.exe` : "/usr/bin/which";
  const result = spawnSync(cmd, ["cs"], {
    env: { ...process.env, PATH: process.env.PATH },
  });
  return result.status === 0;
}

export function installCodeScene(): boolean {
  const platform = os.platform();
  logInfo("📦 Installing CodeScene CLI...");

  if (platform === "win32") {
    logInfo("Running Windows installer...");
    // Run powershell to download and execute the installation script
    const ps = spawnSync(
      String.raw`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`,
      [
        "-NoProfile",
        "-Command",
        String.raw`Invoke-WebRequest -Uri 'https://downloads.codescene.io/enterprise/cli/install-cs-tool.ps1' -OutFile install-cs-tool.ps1; .\\install-cs-tool.ps1; Remove-Item install-cs-tool.ps1`,
      ],
      { encoding: "utf8" }
    );

    if (ps.status === 0) {
      logSuccess("CodeScene CLI installed successfully");
      // Add the newly installed CLI to the current process PATH
      const csPath = String.raw`${process.env.USERPROFILE || process.env.HOME}\AppData\Local\Programs\CodeScene`;
      process.env.PATH = `${csPath};${process.env.PATH}`;
      return true;
    } else {
      logError("Installation failed");
      globalThis.console.error(ps.stderr);
      return false;
    }
  }

  logInfo("Running installer...");
  // Equivalent to: echo "" | curl -fsSL ... | sh -- -y
  const curl = spawnSync(
    "/usr/bin/curl",
    ["-fsSL", "https://downloads.codescene.io/enterprise/cli/install-cs-tool.sh"],
    { encoding: "utf8" }
  );
  if (curl.status !== 0) {
    logError("Failed to download installer");
    return false;
  }

  // Pass -y (headless mode) so the installer skips the interactive
  // "Press enter to continue" prompt that reads from /dev/tty, which is
  // unavailable in non-TTY contexts and causes installation to fail with
  // "cannot open /dev/tty: No such device or address".
  const sh = spawnSync("/bin/sh", ["-s", "--", "-y"], {
    input: curl.stdout,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (sh.status === 0) {
    logSuccess("CodeScene CLI installed successfully");
    return true;
  }

  logError("Installation failed");
  return false;
}

export function showTokenInstructions(): void {
  const platform = os.platform();

  if (platform === "win32") {
    globalThis.console.log(`
${COLORS.YELLOW}🔑 Token Setup Instructions (Windows):${COLORS.NC}

1. Get your access token from your CodeScene administrator or generate one here:
   ${COLORS.BLUE}https://codescene.io/users/me/pat${COLORS.NC}

2. Set the CS_ACCESS_TOKEN environment variable:

   PowerShell (Temporary):
   ${COLORS.BLUE}$env:CS_ACCESS_TOKEN = "<your-access-token>"${COLORS.NC}

   Command Prompt / Permanent:
   ${COLORS.BLUE}SETX CS_ACCESS_TOKEN "<your-access-token>"${COLORS.NC}
   (Note: SETX requires a new terminal window to take effect)
`);
  } else {
    globalThis.console.log(`
${COLORS.YELLOW}🔑 Token Setup Instructions:${COLORS.NC}

1. Get your access token from your CodeScene administrator or generate one here:
   ${COLORS.BLUE}https://codescene.io/users/me/pat${COLORS.NC}

2. Set the CS_ACCESS_TOKEN environment variable:

   Temporary (current session):
   ${COLORS.BLUE}export CS_ACCESS_TOKEN=<your-access-token>${COLORS.NC}

   Permanent (add to your shell config file):
   ${COLORS.BLUE}echo 'export CS_ACCESS_TOKEN=<your-access-token>' >> ~/.bashrc${COLORS.NC}
   ${COLORS.BLUE}source ~/.bashrc${COLORS.NC}
`);
  }
}

// cspell:ignore SETX setx
function saveTokenLocal(token: string): boolean {
  try {
    const cacheDir = path.dirname(CONFIG.TOKEN_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.TOKEN_FILE, token, "utf8");
    return true;
  } catch (error) {
    logError(`Failed to save token locally: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function saveTokenWindows(token: string): boolean {
  saveTokenLocal(token);
  const cmd = spawnSync(String.raw`C:\Windows\System32\cmd.exe`, ["/c", `setx CS_ACCESS_TOKEN "${token}"`], {
    encoding: "utf8",
  });
  if (cmd.status !== 0) {
    logError("Failed to save token to Windows Environment");
    globalThis.console.error(cmd.stderr);
    return false;
  }
  return true;
}

function saveTokenUnix(token: string): boolean {
  saveTokenLocal(token);
  try {
    const home = process.env.HOME;
    if (home) {
      const exportCmd = `\nexport CS_ACCESS_TOKEN=${token}\n`;
      const bashrc = path.join(home, ".bashrc");
      const zshrc = path.join(home, ".zshrc");

      if (fs.existsSync(bashrc)) {
        fs.appendFileSync(bashrc, exportCmd);
      }
      if (fs.existsSync(zshrc)) {
        fs.appendFileSync(zshrc, exportCmd);
      }
    }
    return true;
  } catch (error) {
    logError(`Failed to save token to shell config files: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

export async function promptAndSaveToken(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  globalThis.console.log(`\n${COLORS.YELLOW}CodeScene PAT is missing.${COLORS.NC}`);
  globalThis.console.log(`Generate a PAT here: ${COLORS.BLUE}https://codescene.io/users/me/pat${COLORS.NC}\n`);

  const rl = readline.createInterface({ input, output });
  const token = await rl.question("Enter your CodeScene PAT (or press Enter to skip): ");
  rl.close();

  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return false;
  }

  logInfo("Saving token permanently...");
  const platform = os.platform();

  const saved = platform === "win32" ? saveTokenWindows(trimmedToken) : saveTokenUnix(trimmedToken);

  if (!saved) {
    return false;
  }

  process.env.CS_ACCESS_TOKEN = trimmedToken;
  CONFIG.CS_TOKEN = trimmedToken;
  logSuccess("Token saved successfully.");
  return true;
}
