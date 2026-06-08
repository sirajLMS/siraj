import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import {
	CONFIG,
	logInfo,
	logSuccess,
	logWarning,
	PROJECT_ROOT,
} from "./config";
import { markStepCompleted } from "./state";

export async function installScanner(): Promise<void> {
	const platform = os.platform();
	const arch = "x64"; // Assuming x64 for now as in the bash script
	const osName = platform === "darwin" ? "macosx" : "linux";
	const scannerBinDir = join(
		CONFIG.SCANNER_DIR,
		`sonar-scanner-${CONFIG.SCANNER_VERSION}-${platform === "darwin" ? "macosx" : "linux"}-x64`,
		"bin",
	);
	const scannerPath = join(
		scannerBinDir,
		`sonar-scanner${platform === "win32" ? ".bat" : ""}`,
	);

	if (existsSync(scannerPath)) {
		logSuccess("sonar-scanner is already installed");
		markStepCompleted("scanner_installed");
		return;
	}

	// Check if it's in PATH
	const whichResult = spawnSync(platform === "win32" ? "where" : "which", [
		"sonar-scanner",
	]);
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
		spawnSync("powershell", [
			"-Command",
			`Expand-Archive -Path "${zipPath}" -DestinationPath "${CONFIG.SCANNER_DIR}" -Force`,
		]);
	} else {
		spawnSync("unzip", ["-o", "-q", zipPath, "-d", CONFIG.SCANNER_DIR]);
	}

	spawnSync(platform === "win32" ? "del" : "rm", [zipPath]);

	logSuccess("sonar-scanner installed");
	markStepCompleted("scanner_installed");
}

export function runAnalysis(token: string): number {
	logInfo("Running SonarQube analysis...");

	const platform = os.platform();
	const scannerBinDir = join(
		CONFIG.SCANNER_DIR,
		`sonar-scanner-${CONFIG.SCANNER_VERSION}-${platform === "darwin" ? "macosx" : "linux"}-x64`,
		"bin",
	);
	const scannerPath = join(
		scannerBinDir,
		`sonar-scanner${platform === "win32" ? ".bat" : ""}`,
	);

	const finalScannerPath = existsSync(scannerPath)
		? scannerPath
		: "sonar-scanner";

	const result = spawnSync(
		finalScannerPath,
		[`-Dsonar.host.url=${CONFIG.SONAR_HOST}`, `-Dsonar.token=${token}`],
		{
			cwd: PROJECT_ROOT,
			stdio: "inherit",
			env: {
				...process.env,
				PATH: `${scannerBinDir}${platform === "win32" ? ";" : ":"}${process.env.PATH}`,
			},
		},
	);

	if (result.status !== 0) {
		logWarning("Analysis failed or returned non-zero exit code");
	} else {
		logSuccess("Analysis complete");
	}

	return Date.now();
}
