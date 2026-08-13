#!/usr/bin/env bun
/**
 * Generate root vercel.json for Vercel Cron Jobs.
 * Runs at build time via prebuild — vercel.json is gitignored.
 * Defaults to Hobby-safe schedules (vercel-daily); Pro ticker only when CRON_EXECUTION_MODE=vercel.
 * Validates cron expressions with cron-parser, fails fast on invalid.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CronExpressionParser } from "cron-parser";
import type { CronDefinition, CronExecutionMode } from "@/backend/types";

interface VercelCron {
  path: string;
  schedule: string;
}

interface VercelJson {
  fluid: boolean;
  crons: VercelCron[];
}

const CRON_DEFINITIONS: CronDefinition[] = [
  {
    path: "/api/fx/refresh",
    scheduleEnv: "CRON_FX_REFRESH_SCHEDULE",
    defaultSchedule: "0 6 * * *",
    alwaysInclude: true,
  },
  {
    path: "/api/cron/class-reminders",
    scheduleEnv: "CRON_CLASS_REMINDERS_SCHEDULE",
    defaultSchedule: "0 6 * * *",
    alwaysInclude: true,
  },
  {
    path: "/api/cron/ticker",
    scheduleEnv: "CRON_TICKER_SCHEDULE",
    defaultSchedule: "* * * * *",
    alwaysInclude: false,
  },
];

const VALID_MODES: ReadonlySet<string> = new Set<CronExecutionMode>([
  "vercel",
  "vercel-daily",
  "external",
  "standalone",
]);

function isCronExecutionMode(value: string): value is CronExecutionMode {
  return VALID_MODES.has(value);
}

function parseMode(raw: string | undefined): CronExecutionMode {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return "vercel-daily";
  }
  if (!isCronExecutionMode(trimmed)) {
    process.stderr.write(
      `[generate-vercel-config] WARN: Invalid CRON_EXECUTION_MODE="${raw}", defaulting to "vercel-daily"\n`
    );
    return "vercel-daily";
  }
  return trimmed;
}

function validateCronExpression(expression: string, name: string): void {
  try {
    CronExpressionParser.parse(expression, { tz: "UTC" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const err = new Error(`Invalid cron expression for ${name}: "${expression}" - ${message}`);
    if (error instanceof Error) {
      err.cause = error;
    }
    throw err;
  }
}

function getSchedule(envKey: string, defaultValue: string, name: string): string {
  const value = process.env[envKey]?.trim() || defaultValue;
  validateCronExpression(value, name);
  return value;
}

function shouldIncludeTicker(mode: CronExecutionMode): boolean {
  return mode === "vercel";
}

function main(): void {
  const mode = parseMode(process.env.CRON_EXECUTION_MODE);

  const crons: VercelCron[] = [];

  for (const def of CRON_DEFINITIONS) {
    if (def.alwaysInclude || shouldIncludeTicker(mode)) {
      crons.push({
        path: def.path,
        schedule: getSchedule(def.scheduleEnv, def.defaultSchedule, def.path),
      });
    }
  }

  const config: VercelJson = {
    fluid: true,
    crons,
  };

  const outputPath = join(process.cwd(), "vercel.json");
  writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);
  process.stderr.write(`[generate-vercel-config] Mode: ${mode}\n`);
  process.stderr.write(`[generate-vercel-config] Generated ${outputPath}\n`);
  process.stderr.write(`[generate-vercel-config] Crons: ${JSON.stringify(crons, null, 2)}\n`);
}

main();
