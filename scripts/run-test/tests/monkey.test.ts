import { describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BUN_BIN = join(homedir(), ".bun", "bin", "bun");
const SCRIPT = "scripts/run-test/run-test.ts";

async function runScript(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn([BUN_BIN, "run", SCRIPT, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: process.cwd(),
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

describe("monkey / chaos tests", () => {
  it("running with a non-existent test path fails gracefully", async () => {
    const result = await runScript(["non-existent-path-xyz123.test.ts"]);
    expect(result.exitCode).not.toBe(0);
  });

  it("running with an empty directory", async () => {
    const emptyDir = join(process.cwd(), "scripts", "run-test", "tests", "empty-dir-temp");
    try {
      mkdirSync(emptyDir, { recursive: true });
      const result = await runScript([emptyDir]);
      expect(result.exitCode).not.toBe(0);
    } finally {
      if (existsSync(emptyDir)) rmSync(emptyDir, { recursive: true });
    }
  });

  it("--last when no logs exist for a path exits 1", async () => {
    const uniquePath = `absolutely-no-logs-for-${Date.now()}.test.ts`;
    const result = await runScript(["--last", uniquePath]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("No previous test run found");
  });

  it("--feedback with very long text saves successfully", async () => {
    const longText = "x".repeat(5000);
    const result = await runScript(["--feedback", longText]);
    expect(result.stdout).toContain("Feedback saved to:");
  });

  it("--feedback with special characters saves successfully", async () => {
    const result = await runScript(["--feedback", "Feedback with <>&'\"{}[] chars"]);
    expect(result.stdout).toContain("Feedback saved to:");
  });

  it("--list-feedback when no feedback exists shows empty message", async () => {
    const feedbackDir = join(process.cwd(), "scripts", "run-test", "feedback");
    const existingFiles = existsSync(feedbackDir)
      ? readdirSync(feedbackDir).filter(f => f.startsWith("feedback-") && f.endsWith(".md"))
      : [];
    const result = await runScript(["--list-feedback"]);
    if (existingFiles.length === 0) {
      expect(result.stdout).toContain("No feedback items found");
    } else {
      expect(result.stdout).toContain("Feedback Items");
    }
  });
});
