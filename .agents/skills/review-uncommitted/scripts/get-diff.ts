/**
 * GET-DIFF — Uncommitted diff report generator + snapshot system for the
 * review-uncommitted skill.
 *
 * Produces AI-friendly structured JSON output for orchestrator routing and
 * per-file diff analysis. Replaces the previous shell script (`get-diff.sh`)
 * with a richer TypeScript implementation that parses diff hunks into structured
 * data, enabling review subagents to query specific hunks/lines without reading
 * raw diff text.
 *
 * ## Modes
 *
 * **Default (`--output-dir`)** — capture and write diff artifacts in one shot:
 *   bun run .agents/skills/review-uncommitted/scripts/get-diff.ts --output-dir <path>
 *
 * **Snapshot capture (`--capture --output-dir <path>`)** — same as default plus
 * writes `snapshot.json` with git metadata (HEAD SHA, branch, tree hash, porcelain
 * status) for later resumability:
 *   bun run ... --capture --output-dir <path>
 *
 * **Resume from snapshot (`--resume <snapshot.json>`)** — loads a previously
 * captured snapshot and rebuilds the `DiffReport` from the captured artifacts
 * without re-running git, so the review proceeds against the *captured* diffs
 * even if the working tree has since changed:
 *   bun run ... --resume .ai/plans/review-uncommitted/<datetime>/snapshot.json
 *
 * ## Architecture
 *
 *   - CLI: `bun run .agents/skills/review-uncommitted/scripts/get-diff.ts [flags]`
 *   - Programmatic:
 *       import { generateDiffReport, captureSnapshot, loadSnapshot, verifySnapshot }
 *       from "@/agents/skills/review-uncommitted/scripts/get-diff"
 *   - Uses shared project utilities: `@/scripts/health/__shared__/sub-loop-types` (runCommand)
 *   - Uses `@/scripts/health/__shared__/log.ts` for colored log output
 *
 * ## Output structure (all under <output-dir>/)
 *
 *   summary.json     — High-level stats (file count, status breakdown, hunk totals)
 *   manifest.json    — Per-file metadata + parsed hunk summaries (no diff content)
 *   diffs/<safe>.json — Per-file structured diff: hunks parsed into objects with
 *                       old/new line ranges, content lines classified as added/
 *                       deleted/context, and per-line metadata
 *   full.diff        — Raw `git diff HEAD` for reference (not structured)
 *   snapshot.json    — (only with --capture) Git metadata header for resumability
 *
 * ## snapshot.json schema (capture mode only)
 *
 *   {
 *     "schemaVersion": 1,
 *     "timestamp": "2026-08-18T02:19:00Z",
 *     "headSha": "abc123...",
 *     "branch": "feature/foo",
 *     "treeHash": "def456...",               // git write-tree of the index (= working state snapshot)
 *     "porcelainStatus": " M file1\0?? file2\0", // raw git status --porcelain -uall -z
 *     "artifacts": {
 *       "summary": "summary.json",
 *       "manifest": "manifest.json",
 *       "diffsDir": "diffs",
 *       "fullDiff": "full.diff"
 *     }
 *   }
 *
 * manifest.json schema (see above in file header docs)
 * diffs/<safe>.json schema (see above in file header docs)
 *
 * ## Exit codes
 *   0 — success (even if there are uncommitted changes)
 *   1 — not inside a git repository / runtime error
 *   2 — invalid arguments or snapshot not found / corrupt
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { parseArgs } from "node:util";

import {
  type CommandRunResult,
  runCommand,
} from "@/scripts/health/__shared__/sub-loop-types";
import {
  COLORS,
  logError,
  logInfo,
  logSuccess,
  logWarning,
} from "@/scripts/health/__shared__/log";

// ─── Types ──────────────────────────────────────────────────────────────────

/** File change status as classified from git porcelain XY codes. */
export type FileStatus = "modified" | "added" | "deleted" | "untracked";

/** A single line within a diff hunk — classified as context, added, or deleted. */
export interface DiffLine {
  /** Line classification: context (unchanged), added, or deleted. */
  type: "context" | "added" | "deleted";
  /** Source line number in the original file (HEAD). `null` for added lines. */
  oldLine: number | null;
  /** Line number in the new file (working tree). `null` for deleted lines. */
  newLine: number | null;
  /** Raw line content including the +/-/space prefix. */
  content: string;
}

/** A parsed hunk from a unified diff. */
export interface ParsedHunk {
  /** Raw hunk header line (e.g. `@@ -8,17 +8,10 @@ context`). */
  header: string;
  /** Starting line number in the original file. */
  oldStart: number;
  /** Number of lines in the original file covered by this hunk. */
  oldLines: number;
  /** Starting line number in the new file. */
  newStart: number;
  /** Number of lines in the new file covered by this hunk. */
  newLines: number;
  /** Parsed individual lines within this hunk. */
  lines: DiffLine[];
}

/** Summary of a hunk including line counts (no content lines). */
export interface HunkSummary {
  /** Zero-based hunk index within the file. */
  index: number;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  /** Number of added lines in this hunk. */
  added: number;
  /** Number of deleted lines in this hunk. */
  deleted: number;
  /** Number of context (unchanged) lines in this hunk. */
  context: number;
}

/** Per-file metadata for the manifest. */
export interface FileEntry {
  /** Repository-relative file path. */
  path: string;
  /** Classified change status. */
  status: FileStatus;
  /** Relative path to the per-file structured diff JSON. */
  diffFile: string;
  /** Total added lines across all hunks. */
  addedLines: number;
  /** Total deleted lines across all hunks. */
  deletedLines: number;
  /** Number of hunks in this file's diff. */
  hunkCount: number;
  /** Summaries of each hunk (no content lines — keep manifest small). */
  hunks: HunkSummary[];
}

/** Per-file structured diff (full content with parsed hunks). */
export interface FileDiff {
  path: string;
  status: FileStatus;
  hunks: ParsedHunk[];
}

/** High-level summary statistics. */
export interface DiffSummary {
  totalFiles: number;
  modified: number;
  added: number;
  deleted: number;
  untracked: number;
  totalHunks: number;
  totalAddedLines: number;
  totalDeletedLines: number;
  zeroHunkFiles: number;
}

/** The complete manifest written to `manifest.json`. */
export interface DiffManifest {
  timestamp: string;
  fileCount: number;
  summary: DiffSummary;
  files: FileEntry[];
}

/** Result of the full report generation — returned by the programmatic API. */
export interface DiffReport {
  manifest: DiffManifest;
  fileDiffs: Map<string, FileDiff>;
}

/**
 * Snapshot artifacts — pointers to the diff files written alongside snapshot.json.
 * All paths are relative to the snapshot directory (where snapshot.json lives).
 */
export interface SnapshotArtifacts {
  /** Relative path to summary.json. */
  summary: string;
  /** Relative path to manifest.json. */
  manifest: string;
  /** Relative path to the diffs/ directory. */
  diffsDir: string;
  /** Relative path to full.diff. */
  fullDiff: string;
}

/**
 * Git metadata captured at snapshot time for resumability verification.
 *
 * Stored as `snapshot.json` alongside the diff artifacts. Contains enough git
 * context to (a) verify the working tree hasn't drifted since capture, and
 * (b) reproduce the review against the captured diffs even after branch
 * switches, pulls, or further edits.
 */
export interface Snapshot {
  /** Schema version for future migrations. */
  schemaVersion: number;
  /** ISO timestamp when the snapshot was captured. */
  timestamp: string;
  /** HEAD commit SHA the diff was generated against (`git rev-parse HEAD`). */
  headSha: string;
  /** Current branch name at capture time (human reference; empty in detached HEAD). */
  branch: string;
  /**
   * Tree object hash of the index at capture time (`git write-tree`).
   * Read-only operation — creates an unreachable tree object that is GC'd harmlessly.
   * Used to detect whether the index has changed since capture.
   */
  treeHash: string;
  /**
   * Raw `git status --porcelain -uall -z` output (NUL-delimited).
   * Captures the exact XY state of every changed file for forensic reproduction.
   */
  porcelainStatus: string;
  /** Relative paths to the diff artifacts co-located with this snapshot. */
  artifacts: SnapshotArtifacts;
}

/** Result of verifying a snapshot against the current git state. */
export interface SnapshotVerification {
  /** True if HEAD matches the snapshot's headSha. */
  headMatches: boolean;
  /** True if the index tree hash matches the snapshot's treeHash. */
  treeMatches: boolean;
  /** Current HEAD SHA (for logging). */
  currentHeadSha: string;
  /** Current index tree hash (for logging). */
  currentTreeHash: string;
  /** Human-readable warnings (empty if everything matches). */
  warnings: string[];
}

// ─── Git Helpers ────────────────────────────────────────────────────────────

/**
 * Check if the current working directory is inside a git repository.
 * Returns the repo root path if true, throws otherwise.
 */
function getGitRoot(): string {
  const result = runCommand("git", ["rev-parse", "--show-toplevel"]);
  if (result.exitCode !== 0 || !result.output.trim()) {
    throw new Error("Not inside a git repository");
  }
  return result.output.trim();
}

/**
 * Get porcelain status of all uncommitted changes (staged + unstaged + untracked).
 * Returns a map of filepath → XY status code.
 */
function getPorcelainStatus(): Map<string, string> {
  const result = runCommand("git", ["status", "--porcelain", "-uall", "-z"]);
  if (result.exitCode !== 0) {
    throw new Error(`git status failed: ${result.output}`);
  }

  const statusMap = new Map<string, string>();
  const entries = result.output.split("\0");
  let i = 0;

  while (i < entries.length) {
    const entry = entries[i];
    if (!entry) {
      i++;
      continue;
    }

    const xy = entry.substring(0, 2);
    const isRename = xy[0] === "R" || xy[1] === "R";

    if (isRename) {
      // For renames: entry i is "R  old/path", entry i+1 is new/path
      const newPath = entries[i + 1];
      if (newPath) {
        statusMap.set(newPath, xy);
      }
      i += 2;
      continue;
    }

    const filePath = entry.substring(3);
    if (filePath) {
      statusMap.set(filePath, xy);
    }
    i++;
  }

  return statusMap;
}

/**
 * Get the full list of changed files (unstaged + staged + untracked), deduped and sorted.
 */
function getChangedFiles(statusMap: Map<string, string>): string[] {
  return [...statusMap.keys()].sort((a, b) => a.localeCompare(b));
}

/**
 * Classify a file's status from its porcelain XY code.
 */
function classifyStatus(xy: string): FileStatus {
  if (xy === "??") return "untracked";
  const x = xy[0];
  const y = xy[1];
  if (x === "A" || y === "A") return "added";
  if (x === "D" || y === "D") return "deleted";
  return "modified";
}

/**
 * Get the per-file diff content for a given file.
 * - Untracked files: use `git diff --no-index /dev/null <file>` to show entire file as added.
 * - Tracked files: use `git diff HEAD -- <file>`.
 */
function getFileDiffContent(filePath: string, status: FileStatus): string {
  if (status === "untracked") {
    if (!existsSync(filePath)) return "";
    const result = runCommand("git", [
      "diff",
      "--no-index",
      "/dev/null",
      filePath,
    ]);
    return result.output;
  }

  // Use -c core.quotepath=false to handle non-ASCII paths correctly
  const result = runCommand("git", [
    "-c",
    "core.quotepath=false",
    "diff",
    "HEAD",
    "--",
    filePath,
  ]);
  return result.output;
}

// ─── Diff Parsing ───────────────────────────────────────────────────────────

/** Regex to match a unified diff hunk header: `@@ -oldStart,oldLines +newStart,newLines @@ context`. */
const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;

/**
 * Parse a raw unified diff into structured hunks.
 *
 * Handles:
 *   - Hunk headers (`@@ -a,b +c,d @@ context`)
 *   - Context lines (starting with space)
 *   - Added lines (starting with `+`)
 *   - Deleted lines (starting with `-`)
 *   - No-newline-at-end-of-file markers (`\ No newline at end of file`)
 *   - File headers (`diff --git`, `index`, `---`, `+++`) are skipped
 *
 * @param rawDiff — Raw `git diff` output for a single file
 * @returns Array of parsed hunks with structured line data
 */
export function parseDiff(rawDiff: string): ParsedHunk[] {
  if (!rawDiff.trim()) return [];

  const lines = rawDiff.split("\n");
  const hunks: ParsedHunk[] = [];
  let currentHunk: ParsedHunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    const headerMatch = HUNK_HEADER_REGEX.exec(line);

    if (headerMatch) {
      // Finalize previous hunk
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      // Start new hunk
      const oldStart = parseInt(headerMatch[1], 10);
      const oldLines = headerMatch[2] ? parseInt(headerMatch[2], 10) : 1;
      const newStart = parseInt(headerMatch[3], 10);
      const newLines = headerMatch[4] ? parseInt(headerMatch[4], 10) : 1;

      currentHunk = {
        header: line,
        oldStart,
        oldLines,
        newStart,
        newLines,
        lines: [],
      };
      oldLineNum = oldStart;
      newLineNum = newStart;
      continue;
    }

    if (!currentHunk) {
      // Skip file headers and metadata lines before the first hunk
      // (diff --git, index, ---, +++, \ No newline...)
      continue;
    }

    // Skip "\ No newline at end of file" markers (attach to preceding line)
    if (line.startsWith("\\ ")) continue;

    // Classify the line
    if (line.startsWith("+")) {
      currentHunk.lines.push({
        type: "added",
        oldLine: null,
        newLine: newLineNum,
        content: line,
      });
      newLineNum++;
    } else if (line.startsWith("-")) {
      currentHunk.lines.push({
        type: "deleted",
        oldLine: oldLineNum,
        newLine: null,
        content: line,
      });
      oldLineNum++;
    } else if (line.startsWith(" ")) {
      currentHunk.lines.push({
        type: "context",
        oldLine: oldLineNum,
        newLine: newLineNum,
        content: line,
      });
      oldLineNum++;
      newLineNum++;
    } else if (line === "") {
      // Empty lines in diff are context lines with just a space stripped by some
      // git versions. Treat as context.
      currentHunk.lines.push({
        type: "context",
        oldLine: oldLineNum,
        newLine: newLineNum,
        content: " ",
      });
      oldLineNum++;
      newLineNum++;
    }
  }

  // Finalize last hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Create a hunk summary (without content lines) from a parsed hunk.
 */
function summarizeHunk(hunk: ParsedHunk, index: number): HunkSummary {
  let added = 0;
  let deleted = 0;
  let context = 0;

  for (const line of hunk.lines) {
    if (line.type === "added") added++;
    else if (line.type === "deleted") deleted++;
    else context++;
  }

  return {
    index,
    oldStart: hunk.oldStart,
    oldLines: hunk.oldLines,
    newStart: hunk.newStart,
    newLines: hunk.newLines,
    added,
    deleted,
    context,
  };
}

// ─── Filename Helpers ───────────────────────────────────────────────────────

/**
 * Convert a file path to a filesystem-safe filename for the diffs/ directory.
 * Uses `__` for path separators, `_` for other unsafe characters.
 */
function safeFilename(filePath: string): string {
  return filePath
    .replace(/\//g, "__")
    .replace(/[^A-Za-z0-9._-]/g, "_");
}

// ─── Report Generation ──────────────────────────────────────────────────────

/**
 * Generate a complete diff report from the current uncommitted changes.
 *
 * This is the core function — both the CLI and programmatic API use it.
 *
 * @returns A `DiffReport` containing the manifest and per-file structured diffs
 */
export function generateDiffReport(): DiffReport {
  const gitRoot = getGitRoot();
  // Ensure we're operating from the repo root for all git commands
  const originalCwd = process.cwd();
  if (originalCwd !== gitRoot) {
    process.chdir(gitRoot);
  }

  try {
    const statusMap = getPorcelainStatus();
    const changedFiles = getChangedFiles(statusMap);
    const timestamp = new Date().toISOString();

    const fileEntries: FileEntry[] = [];
    const fileDiffs = new Map<string, FileDiff>();

    let totalHunks = 0;
    let totalAddedLines = 0;
    let totalDeletedLines = 0;
    let zeroHunkFiles = 0;
    let modifiedCount = 0;
    let addedCount = 0;
    let deletedCount = 0;
    let untrackedCount = 0;

    for (const filePath of changedFiles) {
      const xy = statusMap.get(filePath) ?? " M";
      const status = classifyStatus(xy);
      const rawDiff = getFileDiffContent(filePath, status);
      const hunks = parseDiff(rawDiff);
      const hunkSummaries = hunks.map((h, i) => summarizeHunk(h, i));

      const addedLines = hunkSummaries.reduce((sum, h) => sum + h.added, 0);
      const deletedLines = hunkSummaries.reduce((sum, h) => sum + h.deleted, 0);
      const safe = safeFilename(filePath);
      const diffFile = `diffs/${safe}.json`;

      fileEntries.push({
        path: filePath,
        status,
        diffFile,
        addedLines,
        deletedLines,
        hunkCount: hunks.length,
        hunks: hunkSummaries,
      });

      fileDiffs.set(filePath, {
        path: filePath,
        status,
        hunks,
      });

      // Track totals
      totalHunks += hunks.length;
      totalAddedLines += addedLines;
      totalDeletedLines += deletedLines;
      if (hunks.length === 0) zeroHunkFiles++;
      if (status === "modified") modifiedCount++;
      else if (status === "added") addedCount++;
      else if (status === "deleted") deletedCount++;
      else if (status === "untracked") untrackedCount++;
    }

    const summary: DiffSummary = {
      totalFiles: changedFiles.length,
      modified: modifiedCount,
      added: addedCount,
      deleted: deletedCount,
      untracked: untrackedCount,
      totalHunks,
      totalAddedLines,
      totalDeletedLines,
      zeroHunkFiles,
    };

    const manifest: DiffManifest = {
      timestamp,
      fileCount: changedFiles.length,
      summary,
      files: fileEntries,
    };

    return { manifest, fileDiffs };
  } finally {
    // Restore original cwd
    if (process.cwd() !== originalCwd) {
      process.chdir(originalCwd);
    }
  }
}

/**
 * Write a diff report to an output directory.
 *
 * Creates:
 *   - `<output-dir>/summary.json` — high-level stats
 *   - `<output-dir>/manifest.json` — per-file metadata + hunk summaries
 *   - `<output-dir>/diffs/<safe>.json` — per-file structured diffs with parsed hunks
 *   - `<output-dir>/full.diff` — raw `git diff HEAD` for reference
 */
export function writeDiffReport(
  report: DiffReport,
  outputDir: string,
): void {
  const absOutput = resolve(outputDir);
  const diffsDir = join(absOutput, "diffs");
  mkdirSync(diffsDir, { recursive: true });

  // Write summary.json (high-level stats only — minimal context for routing decisions)
  const summaryPath = join(absOutput, "summary.json");
  writeFileSync(summaryPath, JSON.stringify(report.manifest.summary, null, 2));

  // Write manifest.json (per-file metadata + hunk summaries)
  const manifestPath = join(absOutput, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(report.manifest, null, 2));

  // Write per-file structured diffs
  let writtenDiffs = 0;
  for (const [filePath, fileDiff] of report.fileDiffs) {
    const safe = safeFilename(filePath);
    const diffPath = join(diffsDir, `${safe}.json`);
    writeFileSync(diffPath, JSON.stringify(fileDiff, null, 2));
    writtenDiffs++;
  }

  // Write raw full.diff for reference (not structured — raw git diff output)
  const fullDiffResult = runCommand("git", ["-c", "core.quotepath=false", "diff", "HEAD"]);
  const fullDiffPath = join(absOutput, "full.diff");
  writeFileSync(fullDiffPath, fullDiffResult.output);

  logSuccess(`Written: ${summaryPath}`);
  logSuccess(`Written: ${manifestPath} (${report.manifest.fileCount} files)`);
  logSuccess(`Written: ${diffsDir}/*.json (${writtenDiffs} files)`);
  logSuccess(`Written: ${fullDiffPath}`);
}

// ─── Snapshot System ─────────────────────────────────────────────────────────
//
// The snapshot system captures the current uncommitted state (diffs + git
// metadata) into a portable directory. This enables a "capture now, review
// later" workflow:
//
//   1. `--capture --output-dir <path>`  → writes diff artifacts + snapshot.json
//   2. (do other work: push, switch branches, keep coding)
//   3. `--resume <snapshot.json>`        → loads captured diffs, rebuilds
//                                          DiffReport without re-running git
//
// The review then proceeds against the *captured* diffs, not the current
// working tree. This is safe: no git state is mutated (no stash/commit/add).
// `git write-tree` creates a tree object but it's unreachable and GC'd cleanly.

/**
 * Capture a snapshot: generate the diff report, write all artifacts, and write
 * a `snapshot.json` with git metadata for later resumability.
 *
 * @param outputDir  Directory where artifacts + snapshot.json will be written.
 * @returns The `Snapshot` object that was written.
 */
export function captureSnapshot(outputDir: string): Snapshot {
  const absOutput = resolve(outputDir);

  // Generate and write the diff artifacts first
  logInfo("Generating diff report for snapshot...");
  const report = generateDiffReport();
  writeDiffReport(report, absOutput);

  // Capture git metadata for resumability
  logInfo("Capturing git metadata for snapshot...");

  const headShaResult = runCommand("git", ["rev-parse", "HEAD"]);
  if (headShaResult.exitCode !== 0) {
    throw new Error(`Failed to get HEAD SHA: ${headShaResult.output}`);
  }
  const headSha = headShaResult.output.trim();

  // Branch name (empty in detached HEAD — that's fine)
  const branchResult = runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  const branch = branchResult.exitCode === 0 ? branchResult.output.trim() : "";
  // In detached HEAD, rev-parse --abbrev-ref returns "HEAD" — normalize to empty
  const normalizedBranch = branch === "HEAD" ? "" : branch;

  // Tree hash of the index (read-only — creates an unreachable tree object)
  // This captures the *staged* state. Combined with porcelain status (which
  // includes unstaged + untracked), we have a complete picture.
  const treeHashResult = runCommand("git", ["write-tree"]);
  if (treeHashResult.exitCode !== 0) {
    throw new Error(`Failed to write tree: ${treeHashResult.output}`);
  }
  const treeHash = treeHashResult.output.trim();

  // Raw porcelain status for forensic reproduction
  const porcelainResult = runCommand("git", [
    "status",
    "--porcelain",
    "-uall",
    "-z",
  ]);
  if (porcelainResult.exitCode !== 0) {
    throw new Error(`git status failed: ${porcelainResult.output}`);
  }
  const porcelainStatus = porcelainResult.output;

  const snapshot: Snapshot = {
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
    headSha,
    branch: normalizedBranch,
    treeHash,
    porcelainStatus,
    artifacts: {
      summary: "summary.json",
      manifest: "manifest.json",
      diffsDir: "diffs",
      fullDiff: "full.diff",
    },
  };

  const snapshotPath = join(absOutput, "snapshot.json");
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  logSuccess(`Written: ${snapshotPath}`);

  return snapshot;
}

/**
 * Load a snapshot and rebuild the `DiffReport` from the captured artifacts
 * without re-running git. The review proceeds against the captured diffs.
 *
 * @param snapshotPath  Path to the `snapshot.json` file.
 * @returns The `DiffReport` reconstructed from captured artifacts, plus the
 *          `Snapshot` metadata.
 */
export function loadSnapshot(
  snapshotPath: string,
): { report: DiffReport; snapshot: Snapshot } {
  const absSnapshotPath = resolve(snapshotPath);

  if (!existsSync(absSnapshotPath)) {
    throw new Error(`Snapshot not found: ${absSnapshotPath}`);
  }

  const snapshotDir = dirname(absSnapshotPath);
  const rawSnapshot = readFileSync(absSnapshotPath, "utf-8");

  let snapshot: Snapshot;
  try {
    snapshot = JSON.parse(rawSnapshot) as Snapshot;
  } catch {
    throw new Error(`Corrupt snapshot.json: failed to parse JSON`);
  }

  if (snapshot.schemaVersion !== 1) {
    throw new Error(
      `Unsupported snapshot schema version: ${snapshot.schemaVersion} (expected 1)`,
    );
  }

  // Load the manifest
  const manifestPath = join(snapshotDir, snapshot.artifacts.manifest);
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf-8"),
  ) as DiffManifest;

  // Load each per-file diff
  const diffsDir = join(snapshotDir, snapshot.artifacts.diffsDir);
  const fileDiffs = new Map<string, FileDiff>();

  for (const fileEntry of manifest.files) {
    const diffFilePath = join(snapshotDir, fileEntry.diffFile);
    if (!existsSync(diffFilePath)) {
      logWarning(`Missing diff artifact: ${diffFilePath} — skipping`);
      continue;
    }
    const fileDiff = JSON.parse(
      readFileSync(diffFilePath, "utf-8"),
    ) as FileDiff;
    fileDiffs.set(fileDiff.path, fileDiff);
  }

  logInfo(
    `Loaded snapshot: ${snapshot.timestamp} (${manifest.fileCount} files, ${fileDiffs.size} diffs loaded)`,
  );

  return { report: { manifest, fileDiffs }, snapshot };
}

/**
 * Verify a snapshot against the current git state. Warns (does not fail) if
 * the working tree has drifted since capture — the review can still proceed
 * against the captured diffs.
 *
 * Checks three signals:
 *   1. HEAD SHA — has the current commit changed?
 *   2. Index tree hash — has the staged state changed?
 *   3. Porcelain status — has *any* uncommitted change (staged/unstaged/untracked) changed?
 *
 * The porcelain comparison is the definitive drift check: it detects unstaged
 * working-tree changes that `git write-tree` misses (write-tree only captures
 * the index, not the working tree).
 *
 * @param snapshot  The loaded snapshot to verify.
 * @returns Verification result with match flags and warnings.
 */
export function verifySnapshot(snapshot: Snapshot): SnapshotVerification {
  const warnings: string[] = [];

  const headResult = runCommand("git", ["rev-parse", "HEAD"]);
  const currentHeadSha = headResult.exitCode === 0 ? headResult.output.trim() : "";

  const treeResult = runCommand("git", ["write-tree"]);
  const currentTreeHash = treeResult.exitCode === 0 ? treeResult.output.trim() : "";

  const porcelainResult = runCommand("git", [
    "status",
    "--porcelain",
    "-uall",
    "-z",
  ]);
  const currentPorcelain =
    porcelainResult.exitCode === 0 ? porcelainResult.output : "";

  const headMatches = currentHeadSha === snapshot.headSha;
  const treeMatches = currentTreeHash === snapshot.treeHash;
  const porcelainMatches = currentPorcelain === snapshot.porcelainStatus;

  if (!headMatches) {
    warnings.push(
      `HEAD has changed since capture (snapshot: ${snapshot.headSha.slice(0, 12)}, current: ${currentHeadSha.slice(0, 12)})`,
    );
  }

  if (!treeMatches) {
    warnings.push(
      `Index tree has changed since capture (snapshot: ${snapshot.treeHash.slice(0, 12)}, current: ${currentTreeHash.slice(0, 12)})`,
    );
  }

  if (!porcelainMatches) {
    warnings.push(
      `Uncommitted changes have drifted since capture (the set of changed files differs)`,
    );
  }

  if (snapshot.branch) {
    const branchResult = runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
    const currentBranch =
      branchResult.exitCode === 0 ? branchResult.output.trim() : "";
    if (currentBranch !== snapshot.branch && currentBranch !== "HEAD") {
      warnings.push(
        `Branch has changed since capture (snapshot: ${snapshot.branch}, current: ${currentBranch})`,
      );
    }
  }

  for (const w of warnings) {
    logWarning(w);
  }

  if (warnings.length === 0) {
    logSuccess("Snapshot matches current git state — review will use captured diffs");
  } else {
    logWarning(
      `Working tree has drifted since capture (${warnings.length} warning(s)). ` +
        `Review will proceed against the CAPTURED diffs, not the current working tree.`,
    );
  }

  return { headMatches, treeMatches, currentHeadSha, currentTreeHash, warnings };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function printHelp(): void {
  const lines = [
    "GET-DIFF — Uncommitted diff report generator + snapshot system",
    "           for the review-uncommitted skill",
    "",
    "Produces AI-friendly structured JSON output for orchestrator routing and",
    "per-file diff analysis. Parses diff hunks into structured data.",
    "",
    "Modes:",
    "  Default (--output-dir <path>)   Generate diff artifacts",
    "  --capture --output-dir <path>   Generate diff artifacts + snapshot.json",
    "  --resume <snapshot.json>         Load captured snapshot, rebuild DiffReport",
    "",
    "Usage:",
    "  bun run .agents/skills/review-uncommitted/scripts/get-diff.ts --output-dir <path>",
    "  bun run .agents/skills/review-uncommitted/scripts/get-diff.ts --capture --output-dir <path>",
    "  bun run .agents/skills/review-uncommitted/scripts/get-diff.ts --resume <snapshot.json> [--verify]",
    "",
    "Creates (under <output-dir>/):",
    "  summary.json       — High-level stats (file count, status breakdown, hunk totals)",
    "  manifest.json      — Per-file metadata + parsed hunk summaries",
    "  diffs/<safe>.json  — Per-file structured diff with parsed hunks",
    "  full.diff          — Raw `git diff HEAD` for reference",
    "  snapshot.json      — (capture mode only) Git metadata for resumability",
    "",
    "Options:",
    "  --output-dir <path>   Write diff output to <path> (required for default/capture)",
    "  --capture             Capture snapshot.json with git metadata for later resume",
    "  --resume <path>       Resume from a snapshot.json — rebuild DiffReport from artifacts",
    "  --verify              (with --resume) Verify snapshot against current git state",
    "  --help, -h            Show this help text",
    "",
    "Exit codes:",
    "  0 — success (even if there are uncommitted changes)",
    "  1 — not inside a git repository / runtime error",
    "  2 — invalid arguments or snapshot not found / corrupt",
  ];
  console.log(lines.join("\n"));
}

function main(): void {
  const { values } = parseArgs({
    options: {
      "output-dir": { type: "string", short: "o" },
      capture: { type: "boolean" },
      resume: { type: "string" },
      verify: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  // ─── Resume mode ───
  if (values.resume) {
    const snapshotPath = values.resume;

    try {
      logInfo(`Resuming from snapshot: ${snapshotPath}`);
      const { report, snapshot } = loadSnapshot(snapshotPath);

      if (values.verify) {
        logInfo("Verifying snapshot against current git state...");
        verifySnapshot(snapshot);
      }

      const s = report.manifest.summary;
      logInfo(
        `Summary: ${s.totalFiles} files (${s.modified} modified, ${s.added} added, ${s.deleted} deleted, ${s.untracked} untracked)`,
      );
      logInfo(
        `Hunks: ${s.totalHunks} total, ${s.zeroHunkFiles} zero-hunk files, ${s.totalAddedLines} added lines, ${s.totalDeletedLines} deleted lines`,
      );

      // In resume mode the artifacts are already on disk — no need to rewrite.
      // The loaded DiffReport is available via programmatic API for the skill.
      logSuccess("Snapshot loaded — DiffReport ready for review");
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("Snapshot not found")
      ) {
        logError(err.message);
      } else if (
        err instanceof Error &&
        err.message.includes("Not inside a git repository")
      ) {
        logError(err.message);
        process.exit(1);
      } else {
        logError(
          `Failed to load snapshot: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      process.exit(2);
    }
    return;
  }

  // ─── Default / Capture mode ───
  const outputDir = values["output-dir"];
  if (!outputDir) {
    logError("Must specify --output-dir <path> (or --resume <snapshot.json>)");
    console.log("Run with --help for usage.");
    process.exit(2);
  }

  try {
    if (values.capture) {
      logInfo("Capture mode: generating diff artifacts + snapshot.json");
      const snapshot = captureSnapshot(outputDir);

      // The report was already written by captureSnapshot() — log from the snapshot's manifest
      const manifestPath = join(resolve(outputDir), "manifest.json");
      const manifest = JSON.parse(
        readFileSync(manifestPath, "utf-8"),
      ) as DiffManifest;
      const s = manifest.summary;
      logInfo(
        `Summary: ${s.totalFiles} files (${s.modified} modified, ${s.added} added, ${s.deleted} deleted, ${s.untracked} untracked)`,
      );
      logInfo(
        `Hunks: ${s.totalHunks} total, ${s.zeroHunkFiles} zero-hunk files, ${s.totalAddedLines} added lines, ${s.totalDeletedLines} deleted lines`,
      );
      logSuccess(
        `Snapshot captured: ${snapshot.timestamp} (HEAD ${snapshot.headSha.slice(0, 12)}${snapshot.branch ? `, branch ${snapshot.branch}` : ""})`,
      );
    } else {
      logInfo("Generating diff report...");
      const report = generateDiffReport();
      writeDiffReport(report, outputDir);

      const s = report.manifest.summary;
      logInfo(
        `Summary: ${s.totalFiles} files (${s.modified} modified, ${s.added} added, ${s.deleted} deleted, ${s.untracked} untracked)`,
      );
      logInfo(
        `Hunks: ${s.totalHunks} total, ${s.zeroHunkFiles} zero-hunk files, ${s.totalAddedLines} added lines, ${s.totalDeletedLines} deleted lines`,
      );
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("Not inside a git repository")
    ) {
      logError(err.message);
      process.exit(1);
    }
    logError(
      `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}

// Run CLI only when executed directly (not imported)
if (import.meta.main) {
  main();
}
