import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_PATH = join(process.cwd(), "scripts/build/generate-vercel-config.ts");
const OUTPUT_PATH = join(process.cwd(), "vercel.json");

function runScript(env: Record<string, string | undefined> = {}): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const result = spawnSync("bun", ["run", SCRIPT_PATH], {
    env: { ...process.env, ...env },
    encoding: "utf-8",
  });
  return {
    stdout: result.stdout?.toString() || "",
    stderr: result.stderr?.toString() || "",
    exitCode: result.status ?? 1,
  };
}

function readConfig(): { fluid: boolean; crons: Array<{ path: string; schedule: string }> } | null {
  if (!existsSync(OUTPUT_PATH)) return null;
  const content = readFileSync(OUTPUT_PATH, "utf-8");
  return JSON.parse(content);
}

function cleanup(): void {
  if (existsSync(OUTPUT_PATH)) {
    rmSync(OUTPUT_PATH, { force: true });
  }
}

describe("generate-vercel-config", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("vercel-daily mode: generates 2 crons, excludes ticker", () => {
    const result = runScript({ CRON_EXECUTION_MODE: "vercel-daily" });
    expect(result.exitCode).toBe(0);

    const config = readConfig();
    expect(config).not.toBeNull();
    if (!config) return;
    expect(config.fluid).toBe(true);
    expect(config.crons).toHaveLength(2);
    expect(config.crons.map(c => c.path).sort()).toEqual(["/api/cron/class-reminders", "/api/fx/refresh"]);
  });

  test("vercel mode: generates 3 crons including ticker", () => {
    const result = runScript({ CRON_EXECUTION_MODE: "vercel" });
    expect(result.exitCode).toBe(0);

    const config = readConfig();
    expect(config).not.toBeNull();
    if (!config) return;
    expect(config.crons).toHaveLength(3);
    expect(config.crons.map(c => c.path).sort()).toEqual([
      "/api/cron/class-reminders",
      "/api/cron/ticker",
      "/api/fx/refresh",
    ]);
  });

  test("external mode: generates 2 crons, excludes ticker", () => {
    const result = runScript({ CRON_EXECUTION_MODE: "external" });
    expect(result.exitCode).toBe(0);

    const config = readConfig();
    expect(config).not.toBeNull();
    if (!config) return;
    expect(config.crons).toHaveLength(2);
  });

  test("standalone mode: generates 2 crons, excludes ticker", () => {
    const result = runScript({ CRON_EXECUTION_MODE: "standalone" });
    expect(result.exitCode).toBe(0);

    const config = readConfig();
    expect(config).not.toBeNull();
    if (!config) return;
    expect(config.crons).toHaveLength(2);
  });

  test("invalid mode defaults to vercel-daily with warning", () => {
    const result = runScript({ CRON_EXECUTION_MODE: "invalid-mode" });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("WARN");
    expect(result.stderr).toContain("vercel-daily");

    const config = readConfig();
    expect(config).not.toBeNull();
    if (!config) return;
    expect(config.crons).toHaveLength(2);
  });

  test("unset mode defaults to vercel-daily without warning", () => {
    const result = runScript({ CRON_EXECUTION_MODE: "" });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain("WARN");

    const config = readConfig();
    expect(config).not.toBeNull();
    if (!config) return;
    expect(config.crons).toHaveLength(2);
  });

  test("valid cron expressions pass validation", () => {
    const result = runScript({
      CRON_EXECUTION_MODE: "vercel",
      CRON_FX_REFRESH_SCHEDULE: "0 12 * * *",
      CRON_CLASS_REMINDERS_SCHEDULE: "30 6 * * 1-5",
      CRON_TICKER_SCHEDULE: "*/5 * * * *",
    });
    expect(result.exitCode).toBe(0);

    const config = readConfig();
    expect(config).not.toBeNull();
    if (!config) return;
    const fxCron = config.crons.find(c => c.path === "/api/fx/refresh");
    const classCron = config.crons.find(c => c.path === "/api/cron/class-reminders");
    const tickerCron = config.crons.find(c => c.path === "/api/cron/ticker");
    expect(fxCron).toBeDefined();
    expect(classCron).toBeDefined();
    expect(tickerCron).toBeDefined();
    if (fxCron) expect(fxCron.schedule).toBe("0 12 * * *");
    if (classCron) expect(classCron.schedule).toBe("30 6 * * 1-5");
    if (tickerCron) expect(tickerCron.schedule).toBe("*/5 * * * *");
  });

  test("invalid cron expression fails with descriptive error", () => {
    const result = runScript({
      CRON_EXECUTION_MODE: "vercel",
      CRON_TICKER_SCHEDULE: "invalid-cron",
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Invalid cron expression");
    expect(result.stderr).toContain("/api/cron/ticker");
  });

  test("default values used when env vars not set", () => {
    const result = runScript({
      CRON_EXECUTION_MODE: "vercel-daily",
      CRON_FX_REFRESH_SCHEDULE: "",
      CRON_CLASS_REMINDERS_SCHEDULE: "",
    });
    expect(result.exitCode).toBe(0);

    const config = readConfig();
    expect(config).not.toBeNull();
    if (!config) return;
    const fxCron = config.crons.find(c => c.path === "/api/fx/refresh");
    const classCron = config.crons.find(c => c.path === "/api/cron/class-reminders");
    expect(fxCron).toBeDefined();
    expect(classCron).toBeDefined();
    if (fxCron) expect(fxCron.schedule).toBe("0 6 * * *");
    if (classCron) expect(classCron.schedule).toBe("0 6 * * *");
  });

  test("ticker schedule not validated in vercel-daily mode", () => {
    // Even with invalid ticker schedule, vercel-daily should succeed (ticker excluded)
    const result = runScript({
      CRON_EXECUTION_MODE: "vercel-daily",
      CRON_TICKER_SCHEDULE: "invalid-cron",
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain("Invalid cron expression");
  });
});
