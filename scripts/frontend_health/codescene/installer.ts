import { spawnSync } from "node:child_process";
import os from "node:os";
import { COLORS, logError, logInfo, logSuccess } from "./config";

export function isCsInstalled(): boolean {
	const platform = os.platform();
	const cmd = platform === "win32" ? "where" : "which";
	const result = spawnSync(cmd, ["cs"]);
	return result.status === 0;
}

export function installCodeScene(): boolean {
	const platform = os.platform();
	logInfo("📦 Installing CodeScene CLI...");

	if (platform === "win32") {
		logError("Automatic installation not supported on Windows.");
		globalThis.console.log(
			`Download binary from: ${COLORS.BLUE}https://codescene.io/docs/cli/index.html#${COLORS.NC}`,
		);
		return false;
	}

	logInfo("Running installer...");
	// Equivalent to: echo "" | curl -fsSL ... | sh
	const curl = spawnSync(
		"curl",
		[
			"-fsSL",
			"https://downloads.codescene.io/enterprise/cli/install-cs-tool.sh",
		],
		{ encoding: "utf8" },
	);
	if (curl.status !== 0) {
		logError("Failed to download installer");
		return false;
	}

	const sh = spawnSync("sh", [], { input: curl.stdout, encoding: "utf8" });
	if (sh.status === 0) {
		logSuccess("CodeScene CLI installed successfully");
		return true;
	}

	logError("Installation failed");
	return false;
}

export function showTokenInstructions(): void {
	globalThis.console.log(`
${COLORS.YELLOW}🔑 Token Setup Instructions:${COLORS.NC}

1. Get your access token from your CodeScene administrator
   (Projects configuration page)

2. Set the CS_ACCESS_TOKEN environment variable:

   Temporary (current session):
   ${COLORS.BLUE}export CS_ACCESS_TOKEN=<your-access-token>${COLORS.NC}

   Permanent (add to your shell config file):
   ${COLORS.BLUE}echo 'export CS_ACCESS_TOKEN=<your-access-token>' >> ~/.bashrc${COLORS.NC}
   ${COLORS.BLUE}source ~/.bashrc${COLORS.NC}
`);
}
