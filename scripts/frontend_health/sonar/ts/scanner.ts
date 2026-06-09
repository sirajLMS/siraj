import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { CONFIG, logInfo, logSuccess, logWarning, PROJECT_ROOT } from "./config";
import { markStepCompleted } from "./state";

function getSearchCmd(): string {
  return os.platform() === "win32" ? String.raw`C:\Windows\System32\where.exe` : "/usr/bin/which";
}

function getPowershellCmd(): string {
  return String.raw`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`;
}

export async function installScanner(): Promise<void> {
  const platform = os.platform();
  const arch = "x64"; // Assuming x64 for now as in the bash script
  const osName = platform === "darwin" ? "macosx" : "linux";
  const scannerBinDir = join(
    CONFIG.SCANNER_DIR,
    `sonar-scanner-${CONFIG.SCANNER_VERSION}-${platform === "darwin" ? "macosx" : "linux"}-x64`,
    "bin"
  );
  const scannerPath = join(scannerBinDir, `sonar-scanner${platform === "win32" ? ".bat" : ""}`);

  if (existsSync(scannerPath)) {
    logSuccess("sonar-scanner is already installed");
    markStepCompleted("scanner_installed");
    return;
  }

  // Check if it's in PATH
  const whichResult = spawnSync(getSearchCmd(), ["sonar-scanner"], {
    env: { ...process.env, PATH: process.env.PATH },
  });
  if (whichResult.status === 0) {
    logSuccess("sonar-scanner is already in PATH");
    markStepCompleted("scanner_installed");
    return;
  }

  logInfo("Installing sonar-scanner...");
  const scannerZip = `sonar-scanner-cli-${CONFIG.SCANNER_VERSION}-${osName}-${arch}.zip`;
  const downloadUrl = `https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/${scannerZip}`;

  if (!existsSync(CONFIG.SCANNER_DIR)) {
    mkdirSync(CONFIG.SCANNER_DIR, { recursive: true });
  }

  const zipPath = join(CONFIG.SCANNER_DIR, "scanner.zip");

  logInfo(`Downloading from ${downloadUrl}...`);
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download sonar-scanner: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  writeFileSync(zipPath, Buffer.from(buffer));

  logInfo("Unzipping...");
  // Use system unzip or powershell Expand-Archive
  if (platform === "win32") {
    spawnSync(getPowershellCmd(), [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Path "${zipPath}" -DestinationPath "${CONFIG.SCANNER_DIR}" -Force`,
    ]);
  } else {
    spawnSync("/usr/bin/unzip", ["-o", "-q", zipPath, "-d", CONFIG.SCANNER_DIR]);
  }

  try {
    unlinkSync(zipPath);
  } catch {
    logWarning(`Failed to delete temporary zip file: ${zipPath}`);
  }

  logSuccess("sonar-scanner installed");
  markStepCompleted("scanner_installed");
}

export function runAnalysis(token: string): number {
  logInfo("Running SonarQube analysis...");

  const platform = os.platform();
  const scannerBinDir = join(
    CONFIG.SCANNER_DIR,
    `sonar-scanner-${CONFIG.SCANNER_VERSION}-${platform === "darwin" ? "macosx" : "linux"}-x64`,
    "bin"
  );
  const scannerPath = join(scannerBinDir, `sonar-scanner${platform === "win32" ? ".bat" : ""}`);

  let finalScannerPath = scannerPath;
  if (!existsSync(scannerPath)) {
    // Try to resolve from PATH securely
    const whichResult = spawnSync(getSearchCmd(), ["sonar-scanner"], {
      env: { ...process.env, PATH: process.env.PATH },
    });
    if (whichResult.status === 0 && whichResult.stdout) {
      finalScannerPath = whichResult.stdout.toString().split("\n")[0].trim();
    } else {
      finalScannerPath = "sonar-scanner"; // Fallback
    }
  }

  const result = spawnSync(finalScannerPath, [`-Dsonar.host.url=${CONFIG.SONAR_HOST}`, `-Dsonar.token=${token}`], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `${scannerBinDir}${platform === "win32" ? ";" : ":"}${process.env.PATH}`,
    },
  });

  if (result.status === 0) {
    logSuccess("Analysis complete");
  } else {
    logWarning("Analysis failed or returned non-zero exit code");
  }

  return Date.now();
}
