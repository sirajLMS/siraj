import { spawnSync } from "node:child_process";
import { logError, logInfo, logSuccess, SONAR_DIR } from "./config";

export function checkDocker(): void {
	const result = spawnSync("docker", ["--version"]);
	if (result.status !== 0) {
		logError(
			"Docker is not installed. Please install Docker: https://docs.docker.com/get-docker/",
		);
		process.exit(1);
	}
	logSuccess("Docker is installed");
}

export function checkDockerCompose(): void {
	const result = spawnSync("docker", ["compose", "version"]);
	if (result.status !== 0) {
		logError(
			"Docker Compose is not installed. Please install Docker Compose: https://docs.docker.com/compose/install/",
		);
		process.exit(1);
	}
	logSuccess("Docker Compose is installed");
}

export function startSonarQube(): void {
	logInfo("Checking SonarQube container status...");

	const psResult = spawnSync("docker", ["ps", "-a", "--format", "{{.Names}}"], {
		encoding: "utf8",
	});
	const containers = psResult.stdout.split("\n");

	if (containers.includes("sonarqube-cad")) {
		const runningResult = spawnSync(
			"docker",
			["ps", "--format", "{{.Names}}"],
			{ encoding: "utf8" },
		);
		const runningContainers = runningResult.stdout.split("\n");

		if (runningContainers.includes("sonarqube-cad")) {
			logSuccess("SonarQube container is already running");
		} else {
			logInfo("Starting existing SonarQube container...");
			spawnSync("docker", ["start", "sonarqube-cad"]);
			logSuccess("SonarQube container started");
		}
	} else {
		logInfo("Creating and starting SonarQube container...");
		spawnSync("docker", ["compose", "up", "-d"], { cwd: SONAR_DIR });
		logSuccess("SonarQube container created and started");
	}
}
