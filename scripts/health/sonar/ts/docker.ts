import { spawnSync } from "node:child_process";
import { resolveBinOnPATH } from "@/scripts/health/__shared__/bin-resolver";
import { logError, logInfo, logSuccess, SONAR_DIR } from "@/scripts/health/sonar/ts/config";

function resolveDockerBin(): string {
  return resolveBinOnPATH("docker");
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
