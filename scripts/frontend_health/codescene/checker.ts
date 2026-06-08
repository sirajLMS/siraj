import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { glob } from "glob";
import {
	ensureCacheDir,
	getCachedMtime,
	getCachedResult,
	getFileMtime,
	saveResult,
	updateCachedMtime,
} from "./cache";
import { COLORS, logError, logInfo, logSuccess, PROJECT_ROOT } from "./config";

interface CheckResults {
	perfectCount: number;
	warningCount: number;
	errorCount: number;
	cachedCount: number;
	warningFiles: string[];
	errorFiles: string[];
}

export async function runHealthCheck(forceFull = false): Promise<void> {
	ensureCacheDir();

	logInfo("Finding all TypeScript files...");
	const files = await glob("src/**/*.{ts,tsx}", { cwd: PROJECT_ROOT });

	if (files.length === 0) {
		logError("No TypeScript files found in src/");
		return;
	}

	logInfo(`📊 Found ${files.length} TypeScript files`);

	const filesToCheck = files.filter((file) => {
		if (forceFull) return true;
		const currentMtime = getFileMtime(join(PROJECT_ROOT, file));
		const cachedMtime = getCachedMtime(file);
		return currentMtime !== cachedMtime;
	});

	if (filesToCheck.length === 0) {
		logSuccess("✨ All files are up to date (no changes detected)");
	} else {
		logInfo(`🔄 Checking ${filesToCheck.length} changed file(s)`);
		logInfo(
			`⚡ Skipping ${files.length - filesToCheck.length} unchanged file(s)`,
		);
	}

	const results: CheckResults = {
		perfectCount: 0,
		warningCount: 0,
		errorCount: 0,
		cachedCount: 0,
		warningFiles: [],
		errorFiles: [],
	};

	for (const file of files) {
		const isChanged = filesToCheck.includes(file);
		if (isChanged) {
			processChangedFile(file, results);
		} else {
			processCachedFile(file, results);
		}
	}

	printSummary(results);

	if (results.errorCount > 0 || results.warningCount > 0) {
		process.exit(1);
	}
}

function processChangedFile(file: string, results: CheckResults): void {
	const filePath = join(PROJECT_ROOT, file);
	const result = spawnSync("cs", ["check", filePath], { encoding: "utf8" });
	const output = result.stdout + result.stderr;

	if (output.includes("warn:")) {
		results.warningCount++;
		results.warningFiles.push(file);
		globalThis.console.log(`${COLORS.YELLOW}⚠️  ${file}${COLORS.NC}`);
		const warnings = output
			.split("\n")
			.filter((line) => line.includes("warn:"))
			.map((l) => `    ${l.trim()}`)
			.join("\n");
		globalThis.console.log(warnings);
		saveResult(file, "warning", warnings);
	} else if (output.includes("error:")) {
		results.errorCount++;
		results.errorFiles.push(file);
		globalThis.console.log(`${COLORS.RED}❌ ${file}${COLORS.NC}`);
		const errors = output
			.split("\n")
			.filter((line) => line.includes("error:"))
			.map((l) => `    ${l.trim()}`)
			.join("\n");
		globalThis.console.log(errors);
		saveResult(file, "error", errors);
	} else {
		results.perfectCount++;
		globalThis.console.log(`${COLORS.GREEN}✅ ${file}${COLORS.NC}`);
		saveResult(file, "perfect", "");
	}
	updateCachedMtime(file, getFileMtime(filePath));
}

function processCachedFile(file: string, results: CheckResults): void {
	const cached = getCachedResult(file);
	if (cached) {
		if (cached.status === "perfect") {
			results.perfectCount++;
		} else if (cached.status === "warning") {
			results.warningCount++;
			results.warningFiles.push(file);
			globalThis.console.log(`${COLORS.YELLOW}⚠️  ${file}${COLORS.NC}`);
			if (cached.details) globalThis.console.log(cached.details);
		} else if (cached.status === "error") {
			results.errorCount++;
			results.errorFiles.push(file);
			globalThis.console.log(`${COLORS.RED}❌ ${file}${COLORS.NC}`);
			if (cached.details) globalThis.console.log(cached.details);
		}
	}
	results.cachedCount++;
}

function printSummary(results: CheckResults): void {
	const {
		perfectCount: perfect,
		warningCount: warning,
		errorCount: error,
		cachedCount: cached,
		warningFiles,
		errorFiles,
	} = results;

	globalThis.console.log("");
	globalThis.console.log(
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
	);
	globalThis.console.log("📈 Code Health Summary");
	globalThis.console.log(
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
	);
	globalThis.console.log(
		`${COLORS.GREEN}✅ Perfect health: ${perfect} files${COLORS.NC}`,
	);
	globalThis.console.log(
		`${COLORS.YELLOW}⚠️  With warnings: ${warning} files${COLORS.NC}`,
	);
	globalThis.console.log(
		`${COLORS.RED}❌ With errors: ${error} files${COLORS.NC}`,
	);
	if (cached > 0) {
		globalThis.console.log(
			`${COLORS.BLUE}⚡ Cached results: ${cached} files${COLORS.NC}`,
		);
	}
	globalThis.console.log(
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
	);

	if (warningFiles.length > 0) {
		globalThis.console.log(
			`\n${COLORS.YELLOW}Files with warnings:${COLORS.NC}`,
		);
		warningFiles.forEach((f) => {
			globalThis.console.log(`  - ${f}`);
		});
	}

	if (errorFiles.length > 0) {
		globalThis.console.log(`\n${COLORS.RED}Files with errors:${COLORS.NC}`);
		errorFiles.forEach((f) => {
			globalThis.console.log(`  - ${f}`);
		});
	}
}
