#!/usr/bin/env bun

/**
 * Usage:
 *   bun run scripts/claim_file.ts claim   → prints the file path and marks its tasks [-]
 *   bun run scripts/claim_file.ts done <file>  → marks that file's tasks [x]
 */

import { readFileSync, writeFileSync } from "node:fs";

const ERRORS_FILE = new URL("../all_errors.txt", import.meta.url).pathname;
const [, , command, targetFile] = process.argv;

const content = readFileSync(ERRORS_FILE, "utf8");
const lines = content.split("\n");

function findFirstPending(): string | null {
	for (const line of lines) {
		const m = RegExp(/^\[ \] File: (.+)/).exec(line);
		if (m) return m[1].trim();
	}
	return null;
}

function markFile(file: string, from: string, to: string): boolean {
	let changed = false;
	// We need to mark every task block that belongs to this file.
	// A block starts with `[?] File: <file>` and its task lines follow.
	// Strategy: replace `[from] File: <file>` → `[to] File: <file>`
	const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp(`^\\[${from}\\] File: ${escaped}$`, "gm");
	const updated = content.replace(re, (match) => {
		changed = true;
		return match.replace(`[${from}]`, `[${to}]`);
	});

	if (changed) writeFileSync(ERRORS_FILE, updated, "utf8");
	return changed;
}

if (command === "claim") {
	const file = findFirstPending();
	if (!file) {
		console.error("No pending files.");
		process.exit(1);
	}
	markFile(file, " ", "-");
	// Print just the path so callers can capture it
	console.log(file);
} else if (command === "done") {
	if (!targetFile) {
		console.error("Usage: claim_file.ts done <file>");
		process.exit(1);
	}
	const ok = markFile(targetFile, "-", "x");
	if (!ok) {
		console.error(`No in-progress tasks found for: ${targetFile}`);
		process.exit(1);
	}
	console.log(`Marked done: ${targetFile}`);
} else {
	console.error("Usage: claim_file.ts <claim|done> [file]");
	process.exit(1);
}
