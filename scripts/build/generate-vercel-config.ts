#!/usr/bin/env bun
/**
 * Refresh root vercel.json cron entries at build time (prebuild).
 * Platform keys (`ignoreCommand`, `git`, `fluid`, `$schema`) live in vercel.json.
 * Builds run on GitHub Actions (`.github/workflows/vercel-prebuilt.yml`); `ignoreCommand`
 * is `exit 0` so Vercel Git never builds. Defaults to Hobby-safe schedules (vercel-daily);
 * Pro ticker + sub-daily WhatsApp sweeps only when CRON_EXECUTION_MODE=vercel.
 * Validates cron expressions with cron-parser, fails fast on invalid.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CronExpressionParser } from "cron-parser";
import type { CronDefinition, CronExecutionMode } from "@/backend/types";

interface VercelCron {
  path: string;
  schedule: string;
}

interface VercelGit {
  deploymentEnabled?: Record<string, boolean>;
}

interface VercelJson {
  $schema?: string;
  /** Always cancel Vercel Git builds — deploy only via `vercel deploy --prebuilt`. */
  ignoreCommand?: string;
  git: VercelGit;
  fluid: boolean;
  crons: VercelCron[];
}

const DEFAULT_SCHEMA = "https://openapi.vercel.sh/vercel.json";
const DEFAULT_IGNORE_COMMAND = "exit 0";
const DEFAULT_GIT: VercelGit = {
  deploymentEnabled: {
    dev: false,
  },
};
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
    path: "/api/cron/whatsapp-sync-sweep",
    scheduleEnv: "CRON_WHATSAPP_SYNC_SWEEP_SCHEDULE",
    defaultSchedule: "13 * * * *",
    hobbySafeSchedule: "13 6 * * *",
    alwaysInclude: true,
  },
  {
    path: "/api/cron/whatsapp-webhook-sweep",
    scheduleEnv: "CRON_WHATSAPP_WEBHOOK_SWEEP_SCHEDULE",
    defaultSchedule: "*/5 * * * *",
    hobbySafeSchedule: "18 6 * * *",
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

/** True when the expression fires more than once within any 24h window (Hobby-forbidden). */
function isSubDailyCron(expression: string): boolean {
  const interval = CronExpressionParser.parse(expression, {
    tz: "UTC",
    currentDate: new Date("2026-01-01T00:00:00.000Z"),
  });
  const first = interval.next().toDate().getTime();
  const second = interval.next().toDate().getTime();
  return second - first < MS_PER_DAY;
}

function getSchedule(envKey: string, defaultValue: string, name: string): string {
  const trimmed = process.env[envKey]?.trim();
  const value = trimmed && trimmed.length > 0 ? trimmed : defaultValue;
  validateCronExpression(value, name);
  return value;
}

function resolveSchedule(def: CronDefinition, mode: CronExecutionMode): string {
  const defaultForMode = mode === "vercel" ? def.defaultSchedule : (def.hobbySafeSchedule ?? def.defaultSchedule);
  const schedule = getSchedule(def.scheduleEnv, defaultForMode, def.path);

  if (mode === "vercel" || !isSubDailyCron(schedule)) {
    return schedule;
  }

  const fallback = def.hobbySafeSchedule;
  if (!fallback) {
    throw new Error(
      `Cron ${def.path} schedule "${schedule}" runs more than once per day, which Vercel Hobby rejects. ` +
        `Set CRON_EXECUTION_MODE=vercel (Pro) or provide a daily schedule via ${def.scheduleEnv}.`
    );
  }

  validateCronExpression(fallback, def.path);
  process.stderr.write(
    `[generate-vercel-config] WARN: ${def.path} schedule "${schedule}" is sub-daily; ` +
      `clamping to Hobby-safe "${fallback}" (set CRON_EXECUTION_MODE=vercel for Pro sub-daily crons)\n`
  );
  return fallback;
}

function shouldIncludeTicker(mode: CronExecutionMode): boolean {
  return mode === "vercel";
}

function isPartialVercelJson(value: unknown): value is Partial<VercelJson> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readExistingConfig(outputPath: string): Partial<VercelJson> {
  if (!existsSync(outputPath)) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(outputPath, "utf-8"));
    if (isPartialVercelJson(parsed)) {
      return parsed;
    }
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse existing ${outputPath}: ${message}`, { cause: error });
  }
}

function main(): void {
  const mode = parseMode(process.env.CRON_EXECUTION_MODE);

  const crons: VercelCron[] = [];

  for (const def of CRON_DEFINITIONS) {
    if (def.alwaysInclude || shouldIncludeTicker(mode)) {
      crons.push({
        path: def.path,
        schedule: resolveSchedule(def, mode),
      });
    }
  }

  const outputPath = join(process.cwd(), "vercel.json");
  const existing = readExistingConfig(outputPath);

  const config: VercelJson = {
    $schema: existing.$schema ?? DEFAULT_SCHEMA,
    ignoreCommand: existing.ignoreCommand ?? DEFAULT_IGNORE_COMMAND,
    git: {
      ...DEFAULT_GIT,
      ...existing.git,
      deploymentEnabled: {
        ...DEFAULT_GIT.deploymentEnabled,
        ...existing.git?.deploymentEnabled,
      },
    },
    fluid: existing.fluid ?? true,
    crons,
  };

  writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);
  process.stderr.write(`[generate-vercel-config] Mode: ${mode}\n`);
  process.stderr.write(`[generate-vercel-config] Generated ${outputPath}\n`);
  process.stderr.write(`[generate-vercel-config] Crons: ${JSON.stringify(crons, null, 2)}\n`);
}

main();
