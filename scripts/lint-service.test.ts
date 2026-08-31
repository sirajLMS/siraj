import { describe, expect, it } from "bun:test";
import { lintService } from "@/scripts/lint-service";
import fs from "node:fs";

describe("lintService security and functionality", () => {
  it("safely handles file names with shell metacharacters without executing commands", async () => {
    const injectedPath = "/tmp/injected_test.txt";
    if (fs.existsSync(injectedPath)) {
      fs.unlinkSync(injectedPath);
    }

    // Attempting a command injection payload as a file name
    const maliciousFilename = `scripts/lint-service.ts; echo INJECTED > ${injectedPath}`;
    const result = await lintService.enqueue("security-test", [maliciousFilename], { maxWarnings: 0 });

    // ESLint should report file not found or lint error, but shell injection should NOT occur
    const injectedFileExists = fs.existsSync(injectedPath);
    expect(injectedFileExists).toBe(false);
    expect(result.exitCode).toBeGreaterThan(0);
  });

  it("successfully lints an existing valid file", async () => {
    const result = await lintService.enqueue("valid-file-test", ["scripts/lint-service.ts"], { maxWarnings: 0 });
    expect(result.exitCode).toBe(0);
    expect(result.success).toBe(true);
  });
});
