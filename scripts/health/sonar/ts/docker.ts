import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { logError, logInfo, logSuccess, SONAR_DIR } from "./config";

let resolvedDockerBin: string | null = null;

function resolveDockerBin(): string {
  if (resolvedDockerBin) return resolvedDockerBin;

  const bin = "docker";
  try {
    const isWin = os.platform() === "win32";
    const searchCmd = isWin ? String.raw`C:\Windows\System32\where.exe` : "/usr/bin/which";

    const result = spawnSync(searchCmd, [bin], {
      encoding: "utf8",
      env: { ...process.env, PATH: process.env.PATH },
    });

    if (result.status === 0 && result.stdout) {
      const absolutePath = result.stdout.split("\n")[0].trim();
      if (fs.existsSync(absolutePath)) {
        resolvedDockerBin = absolutePath;
        return absolutePath;
      }
    }
  } catch {
    // Fallback
  }

  resolvedDockerBin = bin;
  return bin;
}

export function checkDocker(): void {
  const dockerBin = resolveDockerBin();
  const result = spawnSync(dockerBin, ["--version"]);
  if (result.status !== 0) {
    logError("Docker is not installed. Please install Docker: https://docs.docker.com/get-docker/");
    process.exit(1);
  }
  logSuccess("Docker is installed");
}

export function checkDockerCompose(): void {
  const dockerBin = resolveDockerBin();
  const result = spawnSync(dockerBin, ["compose", "version"]);
  if (result.status !== 0) {
    logError(
      "Docker Compose is not installed. Please install Docker Compose: https://docs.docker.com/compose/install/"
    );
    process.exit(1);
  }
  logSuccess("Docker Compose is installed");
}

export function startSonarQube(): void {
  logInfo("Checking SonarQube container status...");

  const dockerBin = resolveDockerBin();
  const psResult = spawnSync(dockerBin, ["ps", "-a", "--format", "{{.Names}}"], {
    encoding: "utf8",
  });
  const containers = psResult.stdout.split("\n");

  if (containers.includes("sonarqube-cad")) {
    const runningResult = spawnSync(dockerBin, ["ps", "--format", "{{.Names}}"], { encoding: "utf8" });
    const runningContainers = runningResult.stdout.split("\n");

    if (runningContainers.includes("sonarqube-cad")) {
      logSuccess("SonarQube container is already running");
    } else {
      logInfo("Starting existing SonarQube container...");
      spawnSync(dockerBin, ["start", "sonarqube-cad"]);
      logSuccess("SonarQube container started");
    }
  } else {
    logInfo("Creating and starting SonarQube container...");
    spawnSync(dockerBin, ["compose", "up", "-d"], { cwd: SONAR_DIR });
    logSuccess("SonarQube container created and started");
  }
}
