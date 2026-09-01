import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { lintService } from "@/scripts/lint-service";

const TEST_OUTPUT_DIR = path.join(process.cwd(), ".lint-test-tmp");

describe("lintService security and functionality", () => {
  it("safely handles file names with shell metacharacters without executing commands", async () => {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    const injectedPath = path.join(TEST_OUTPUT_DIR, "injected_test.txt");
    if (fs.existsSync(injectedPath)) {
      fs.unlinkSync(injectedPath);
    }

    // Attempting a command injection payload as a file name — execFile must
    // treat this as a literal path argument, not a shell command fragment.
    const maliciousFilename = `scripts/lint-service.ts && touch ${injectedPath}`;
    const result = await lintService.enqueue("security-test", [maliciousFilename], { maxWarnings: 0 });

    // ESLint should report file not found or lint error; shell injection must NOT occur
    expect(fs.existsSync(injectedPath)).toBe(false);
    expect(result.exitCode).toBeGreaterThan(0);

    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  it("successfully lints an existing valid file", async () => {
    const result = await lintService.enqueue("valid-file-test", ["scripts/lint-service.ts"], { maxWarnings: 0 });
    expect(result.exitCode).toBe(0);
    expect(result.success).toBe(true);
  });
});
