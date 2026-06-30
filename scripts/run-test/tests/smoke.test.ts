import { describe, expect, it } from "bun:test";
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

describe("smoke tests", () => {
  it("--help prints help and exits 0", async () => {
    const result = await runScript(["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("run-test.ts");
    expect(result.stdout).toContain("--last");
    expect(result.stdout).toContain("--feedback");
  });

  it("-h prints help and exits 0", async () => {
    const result = await runScript(["-h"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("run-test.ts");
  });

  it("no args prints error and exits 1", async () => {
    const result = await runScript([]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("No test path provided");
  });

  it("unknown flag prints error and exits 1", async () => {
    const result = await runScript(["--bogus-flag"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown flag");
  });

  it("--focus without argument prints error and exits 1", async () => {
    const result = await runScript(["--focus"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("--focus requires a string argument");
  });
});
