import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { CONFIG, logInfo, logSuccess, logWarning, PROJECT_ROOT } from "@/scripts/health/sonar/ts/config";
import { isStepCompleted, markStepCompleted } from "@/scripts/health/sonar/ts/state";

function getSearchCmd(): string {
  return os.platform() === "win32" ? String.raw`C:\Windows\System32\where.exe` : "/usr/bin/which";
}

function getScannerOsName(platform: NodeJS.Platform): string {
  if (platform === "win32") {
    return "windows";
  }

  if (platform === "darwin") {
    return "macosx";
  }

  return "linux";
}

function getScannerPath(platform: NodeJS.Platform, osName: string): { binDir: string; path: string } {
  const binDir = join(CONFIG.SCANNER_DIR, `sonar-scanner-${CONFIG.SCANNER_VERSION}-${osName}-x64`, "bin");
  const extension = platform === "win32" ? ".bat" : "";

  return {
    binDir,
    path: join(binDir, `sonar-scanner${extension}`),
  };
}

function hasScannerInPath(): boolean {
  const whichResult = spawnSync(getSearchCmd(), ["sonar-scanner"], {
    env: { ...process.env, PATH: process.env.PATH },
  });

  return whichResult.status === 0;
}

function unzipScanner(platform: NodeJS.Platform, zipPath: string): void {
  if (platform === "win32") {
    const unzipResult = spawnSync("tar", ["-xf", zipPath, "-C", CONFIG.SCANNER_DIR], {
      stdio: "inherit",
    });
    if (unzipResult.status !== 0) {
      throw new Error(`Failed to unzip scanner`);
    }
    return;
  }

  const unzipResult = spawnSync("/usr/bin/unzip", ["-o", "-q", zipPath, "-d", CONFIG.SCANNER_DIR]);
  if (unzipResult.status !== 0) {
    throw new Error(`Failed to unzip scanner: ${unzipResult.stderr?.toString() || "Unknown error"}`);
  }
}

export async function installScanner(): Promise<void> {
  if (isStepCompleted("scanner_installed")) {
    logSuccess("sonar-scanner is already installed");
    return;
  }

  const platform = os.platform();
  const arch = "x64";
  const osName = getScannerOsName(platform);
  const scanner = getScannerPath(platform, osName);

  if (existsSync(scanner.path)) {
    logSuccess("sonar-scanner is already installed");
    markStepCompleted("scanner_installed");
    return;
  }

  if (hasScannerInPath()) {
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
  unzipScanner(platform, zipPath);

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
  const osName = getScannerOsName(platform);
  const scanner = getScannerPath(platform, osName);

  let finalScannerPath = scanner.path;
  if (!existsSync(scanner.path)) {
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
      PATH: `${scanner.binDir}${platform === "win32" ? ";" : ":"}${process.env.PATH}`,
    },
  });

  if (result.status === 0) {
    logSuccess("Analysis complete");
  } else {
    logWarning("Analysis failed or returned non-zero exit code");
  }

  return Date.now();
}
