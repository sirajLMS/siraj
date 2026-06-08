import {
	existsSync,
	mkdirSync,
	readFileSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { CONFIG } from "./config";

export interface CachedResult {
	file: string;
	status: "perfect" | "warning" | "error";
	details: string;
}

export function ensureCacheDir(): void {
	if (!existsSync(CONFIG.CACHE_DIR)) {
		mkdirSync(CONFIG.CACHE_DIR, { recursive: true });
	}
}

export function getFileMtime(filePath: string): number {
	try {
		return Math.floor(statSync(filePath).mtimeMs / 1000);
	} catch {
		return 0;
	}
}

export function getCachedMtime(filePath: string): number {
	if (!existsSync(CONFIG.TIMESTAMP_FILE)) return 0;
	const content = readFileSync(CONFIG.TIMESTAMP_FILE, "utf8");
	const line = content.split("\n").find((l) => l.startsWith(`${filePath} `));
	if (!line) return 0;
	return parseInt(line.split(" ")[1], 10);
}

export function updateCachedMtime(filePath: string, mtime: number): void {
	let content = "";
	if (existsSync(CONFIG.TIMESTAMP_FILE)) {
		content = readFileSync(CONFIG.TIMESTAMP_FILE, "utf8");
	}
	const lines = content
		.split("\n")
		.filter((l) => l.trim() && !l.startsWith(`${filePath} `));
	lines.push(`${filePath} ${mtime}`);
	writeFileSync(CONFIG.TIMESTAMP_FILE, lines.join("\n") + "\n");
}

export function saveResult(
	filePath: string,
	status: string,
	details: string,
): void {
	let content = "";
	if (existsSync(CONFIG.RESULTS_FILE)) {
		content = readFileSync(CONFIG.RESULTS_FILE, "utf8");
	}
	const lines = content
		.split("\n")
		.filter((l) => l.trim() && !l.startsWith(`${filePath}§§§`));
	// Encode newlines
	const encodedDetails = details.replace(/\n/g, "|||NEWLINE|||");
	lines.push(`${filePath}§§§${status}§§§${encodedDetails}`);
	writeFileSync(CONFIG.RESULTS_FILE, lines.join("\n") + "\n");
}

export function getCachedResult(filePath: string): CachedResult | null {
	if (!existsSync(CONFIG.RESULTS_FILE)) return null;
	const content = readFileSync(CONFIG.RESULTS_FILE, "utf8");
	const line = content.split("\n").find((l) => l.startsWith(`${filePath}§§§`));
	if (!line) return null;

	const parts = line.split("§§§");
	const status = parts[1] as "perfect" | "warning" | "error";
	return {
		file: parts[0],
		status,
		details: parts[2].replace(/\|\|\|NEWLINE\|\|\|/g, "\n"),
	};
}

export function clearCache(): void {
	if (existsSync(CONFIG.TIMESTAMP_FILE)) {
		unlinkSync(CONFIG.TIMESTAMP_FILE);
	}
	if (existsSync(CONFIG.RESULTS_FILE)) {
		unlinkSync(CONFIG.RESULTS_FILE);
	}
}
