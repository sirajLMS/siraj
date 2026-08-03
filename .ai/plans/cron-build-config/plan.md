# Plan: Build-Time Vercel Cron Config Generation

## Summary
Replace static `vercel.json` with build-time generation of `.vercel/output/config.json` using `CRON_EXECUTION_MODE` and individual cron schedule env vars. All paths fixed, cron expressions validated with `cron-parser`, fail fast on invalid. Tests included.

---

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `vercel.json` | **DELETE** | Remove from git (only has `fluid` + `crons`) |
| `scripts/build/generate-vercel-config.ts` | **CREATE** | Build-time script with cron-parser validation |
| `scripts/build/generate-vercel-config.test.ts` | **CREATE** | Unit tests for generation script |
| `package.json` | **MODIFY** | Update `prebuild` to run generation script |
| `backend/lib/env-config-keys.ts` | **MODIFY** | Add 8 cron config keys |
| `.env.example` | **MODIFY** | Add cron config vars with docs |
| `environment.d.ts` | **MODIFY** | Add TypeScript types |
| `docs/deployment/cron.md` | **CREATE** | Full documentation |
| `backend/types/cron/cron.types.ts` | **MODIFY** | Add shared `CronExecutionMode` type |
| `.gitignore` | **MODIFY** | Allow `scripts/build/` to be committed |

---

## Key Design Decisions (Confirmed)

1. **Script Location**: `scripts/build/generate-vercel-config.ts`
2. **Validation**: Skip validation for excluded crons (ticker not validated in `vercel-daily`/`external`/`standalone` modes)
3. **Tests**: Unit tests for generation script covering all modes and validation
4. **Logging**: Use `process.stderr.write` (not `console.*`) for script messages
5. **Shared Types**: Extract `CronExecutionMode` to `backend/types/cron/cron.types.ts`

---

## Implementation Details

### 1. Shared Type: `backend/types/cron/cron.types.ts` (Add to existing file)

```typescript
// Add to existing cron.types.ts
export type CronExecutionMode = "vercel" | "vercel-daily" | "external" | "standalone";

export interface CronDefinition {
  path: string;
  scheduleEnv: string;
  defaultSchedule: string;
  alwaysInclude: boolean;
}
```

### 2. Build Script: `scripts/build/generate-vercel-config.ts`

```typescript
#!/usr/bin/env bun
/**
 * Generate .vercel/output/config.json for Vercel Cron Jobs
 * Runs at build time via prebuild script
 * Validates cron expressions with cron-parser, fails fast on invalid
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CronExpressionParser } from "cron-parser";
import type { CronExecutionMode, CronDefinition } from "@/backend/types/cron/cron.types";

interface VercelCron {
  path: string;
  schedule: string;
}

interface VercelConfig {
  version: 3;
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

function parseMode(raw: string | undefined): CronExecutionMode {
  const valid: CronExecutionMode[] = ["vercel", "vercel-daily", "external", "standalone"];
  if (!raw || !valid.includes(raw as CronExecutionMode)) {
    process.stderr.write(`[generate-vercel-config] WARN: Invalid CRON_EXECUTION_MODE="${raw}", defaulting to "vercel-daily"\n`);
    return "vercel-daily";
  }
  return raw as CronExecutionMode;
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

  const config: VercelConfig = {
    version: 3,
    fluid: true,
    crons,
  };

  const outputDir = join(process.cwd(), ".vercel", "output");
  const outputPath = join(outputDir, "config.json");

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(config, null, 2));
  process.stderr.write(`[generate-vercel-config] Mode: ${mode}\n`);
  process.stderr.write(`[generate-vercel-config] Generated ${outputPath}\n`);
  process.stderr.write(`[generate-vercel-config] Crons: ${JSON.stringify(crons, null, 2)}\n`);
}

main();
```

### 3. Test File: `scripts/build/generate-vercel-config.test.ts`

```typescript
import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const SCRIPT_PATH = join(process.cwd(), "scripts/build/generate-vercel-config.ts");
const OUTPUT_DIR = join(process.cwd(), ".vercel", "output");
const OUTPUT_PATH = join(OUTPUT_DIR, "config.json");

function runScript(env: Record<string, string> = {}): { stdout: string; stderr: string; exitCode: number } {
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

function readConfig(): { version: number; fluid: boolean; crons: Array<{ path: string; schedule: string }> } | null {
  if (!existsSync(OUTPUT_PATH)) return null;
  const content = readFileSync(OUTPUT_PATH, "utf-8");
  return JSON.parse(content);
}

function cleanup(): void {
  if (existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
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
    expect(config.version).toBe(3);
    expect(config.fluid).toBe(true);
    expect(config.crons).toHaveLength(2);
    expect(config.crons.map(c => c.path).sort()).toEqual([
      "/api/cron/class-reminders",
      "/api/fx/refresh",
    ]);
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
    const result = runScript({ CRON_EXECUTION_MODE: "vercel-daily" });
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
```

### 4. Package.json Update

```json
"scripts": {
  "prebuild": "bun run locale:snapshots && bun run scripts/build/generate-vercel-config.ts",
  "locale:snapshots": "bun run scripts/locale-snapshots.ts",
  "build": "next build",
  ...
}
```

### 5. Env Config Keys (`backend/lib/env-config-keys.ts`)

Add after `CRON_QUEUE_WORKER_TIMEOUT` (~line 536):

```typescript
{
  key: "CRON_EXECUTION_MODE",
  category: "cron",
  displayStrategy: "plain",
  description: {
    en: "Cron execution mode: vercel (Pro, every-min ticker) | vercel-daily (Hobby, daily only) | external (cron-job.org/QStash/GitHub Actions) | standalone (separate worker)",
    ar: "وضع تنفيذ cron: vercel (Pro، تِكر كل دقيقة) | vercel-daily (Hobby، يومي فقط) | external (cron-job.org/QStash/GitHub Actions) | standalone (عامل منفصل)",
  },
  isSecret: false,
  excludeFromDb: false,
  defaultValue: "vercel-daily",
},
{
  key: "CRON_FX_REFRESH_SCHEDULE",
  category: "cron",
  displayStrategy: "plain",
  description: {
    en: "Cron schedule for FX rate refresh (default: 0 6 * * * = daily 06:00 UTC)",
    ar: "جدول cron لتحديث أسعار الصرف (الافتراضي: 0 6 * * * = يومياً 06:00 UTC)",
  },
  isSecret: false,
  excludeFromDb: false,
  defaultValue: "0 6 * * *",
},
{
  key: "CRON_CLASS_REMINDERS_SCHEDULE",
  category: "cron",
  displayStrategy: "plain",
  description: {
    en: "Cron schedule for class reminders (default: 0 6 * * * = daily 06:00 UTC)",
    ar: "جدول cron لتذكيرات الحصص (الافتراضي: 0 6 * * * = يومياً 06:00 UTC)",
  },
  isSecret: false,
  excludeFromDb: false,
  defaultValue: "0 6 * * *",
},
{
  key: "CRON_TICKER_SCHEDULE",
  category: "cron",
  displayStrategy: "plain",
  description: {
    en: "Cron schedule for ticker (default: * * * * * = every minute). Only used in 'vercel' mode.",
    ar: "جدول cron للمؤشر (الافتراضي: * * * * * = كل دقيقة). يستخدم فقط في وضع 'vercel'.",
  },
  isSecret: false,
  excludeFromDb: false,
  defaultValue: "* * * * *",
},
{
  key: "CRON_EXTERNAL_ENABLED",
  category: "cron",
  displayStrategy: "plain",
  description: {
    en: "Enable external cron scheduler integration. When true, documents the external endpoint for services like cron-job.org, QStash, GitHub Actions.",
    ar: "تفعيل تكامل المجدول الخارجي. عند التفعيل، يوثق نقطة النهاية الخارجية للخدمات مثل cron-job.org و QStash و GitHub Actions.",
  },
  isSecret: false,
  excludeFromDb: false,
  defaultValue: "false",
},
{
  key: "CRON_EXTERNAL_ENDPOINT",
  category: "cron",
  displayStrategy: "plain",
  description: {
    en: "External cron endpoint path (default: /api/cron/ticker). The endpoint that external schedulers will call.",
    ar: "مسار نقطة نهاية cron الخارجية (الافتراضي: /api/cron/ticker). نقطة النهاية التي ستستدعيها المجدولات الخارجية.",
  },
  isSecret: false,
  excludeFromDb: false,
  defaultValue: "/api/cron/ticker",
},
{
  key: "CRON_EXTERNAL_SCHEDULE",
  category: "cron",
  displayStrategy: "plain",
  description: {
    en: "Cron schedule for external scheduler (default: * * * * * = every minute). Used by external services like cron-job.org, QStash, GitHub Actions.",
    ar: "جدول cron للمجدول الخارجي (الافتراضي: * * * * * = كل دقيقة). يستخدم من قبل الخدمات الخارجية مثل cron-job.org و QStash و GitHub Actions.",
  },
  isSecret: false,
  excludeFromDb: false,
  defaultValue: "* * * * *",
},
{
  key: "CRON_EXTERNAL_SECRET",
  category: "cron",
  displayStrategy: "db_with_mask_only",
  description: {
    en: "Secret for external cron authentication (default: CRON_SECRET). Used in Authorization: Bearer header.",
    ar: "سر المصادقة لـ cron الخارجي (الافتراضي: CRON_SECRET). يستخدم في رأس Authorization: Bearer.",
  },
  isSecret: true,
  excludeFromDb: false,
  defaultValue: "",
},
```

### 6. `.env.example` Update

After `CRON_SECRET` (~line 92):

```bash
# ==========================================
# Cron Execution Configuration
# ==========================================
# Cron execution mode:
#   vercel        - Vercel native cron (Pro required for sub-daily)
#   vercel-daily  - Vercel native cron, daily only (Hobby safe, DEFAULT)
#   external      - External scheduler calls /api/cron/ticker (free sub-daily on Hobby)
#   standalone    - Separate worker process (bun scripts/cron-worker.ts)
CRON_EXECUTION_MODE=vercel-daily

# Individual cron schedules (cron expressions, UTC)
# Validated at build time with cron-parser
CRON_FX_REFRESH_SCHEDULE=0 6 * * *
CRON_CLASS_REMINDERS_SCHEDULE=0 6 * * *
CRON_TICKER_SCHEDULE=* * * * *

# External cron scheduler integration (cron-job.org, QStash, GitHub Actions, etc.)
# When CRON_EXTERNAL_ENABLED=true, documents the endpoint for external services
CRON_EXTERNAL_ENABLED=false
CRON_EXTERNAL_ENDPOINT=/api/cron/ticker
CRON_EXTERNAL_SCHEDULE=* * * * *
# CRON_EXTERNAL_SECRET defaults to CRON_SECRET if not set
# CRON_EXTERNAL_SECRET=your-external-cron-secret
```

### 7. `environment.d.ts` Update

Add to `ProcessEnv` interface:

```typescript
CRON_EXECUTION_MODE?: "vercel" | "vercel-daily" | "external" | "standalone";
CRON_FX_REFRESH_SCHEDULE?: string;
CRON_CLASS_REMINDERS_SCHEDULE?: string;
CRON_TICKER_SCHEDULE?: string;
CRON_EXTERNAL_ENABLED?: string;
CRON_EXTERNAL_ENDPOINT?: string;
CRON_EXTERNAL_SCHEDULE?: string;
CRON_EXTERNAL_SECRET?: string;
```

### 8. Documentation: `docs/deployment/cron.md`

```markdown
# Cron Jobs Deployment Guide

## Execution Modes

| Mode | Vercel Plan | Ticker Frequency | Setup Complexity | Use Case |
|------|-------------|------------------|------------------|----------|
| `vercel` | **Pro required** | Every minute (`* * * * *`) | Native | Full Vercel-native cron |
| `vercel-daily` | **Hobby/Pro** | Daily at 06:00 UTC (`0 6 * * *`) | Native | Default, Hobby-safe |
| `external` | **Hobby/Pro** | Via external scheduler | Medium | Free sub-daily on Hobby |
| `standalone` | **Hobby/Pro** | Separate worker process | High | Full control, no Vercel limits |

## Configuration

Set `CRON_EXECUTION_MODE` in Vercel Environment Variables:

```bash
# Hobby plan (default) - daily cron only
CRON_EXECUTION_MODE=vercel-daily

# Pro plan - native every-minute ticker
CRON_EXECUTION_MODE=vercel

# Free sub-daily on Hobby - use cron-job.org
CRON_EXECUTION_MODE=external

# Separate worker (Railway, Render, Fly.io)
CRON_EXECUTION_MODE=standalone
```

## Individual Cron Schedules

All cron schedules are configurable via environment variables (validated at build time):

| Variable | Default | Description |
|----------|---------|-------------|
| `CRON_FX_REFRESH_SCHEDULE` | `0 6 * * *` | FX rate refresh (daily 06:00 UTC) |
| `CRON_CLASS_REMINDERS_SCHEDULE` | `0 6 * * *` | Class reminders (daily 06:00 UTC) |
| `CRON_TICKER_SCHEDULE` | `* * * * *` | Ticker (every minute, Pro only) |

## External Cron Scheduler Integration

For `external` mode or to document external scheduler setup, configure these variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `CRON_EXTERNAL_ENABLED` | `false` | Enable external cron documentation |
| `CRON_EXTERNAL_ENDPOINT` | `/api/cron/ticker` | Endpoint external schedulers call |
| `CRON_EXTERNAL_SCHEDULE` | `* * * * *` | Schedule for external services |
| `CRON_EXTERNAL_SECRET` | (uses `CRON_SECRET`) | Auth secret for external calls |

### Supported External Services

#### cron-job.org (Free, Recommended for Hobby)
1. Create free account at https://cron-job.org
2. Create job:
   - **URL**: `https://your-app.vercel.app/api/cron/ticker`
   - **Schedule**: Every minute (`* * * * *`)
   - **HTTP Method**: GET
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
   - **Timeout**: 300 seconds

#### QStash (Upstash)
1. Create QStash account at https://upstash.com
2. Create schedule:
   - **Destination**: `https://your-app.vercel.app/api/cron/ticker`
   - **Schedule**: `* * * * *`
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`

#### GitHub Actions
```yaml
name: Cron Ticker
on:
  schedule:
    - cron: '* * * * *'  # Every minute
jobs:
  call-ticker:
    runs-on: ubuntu-latest
    steps:
      - name: Call ticker endpoint
        run: |
          curl -X GET "https://your-app.vercel.app/api/cron/ticker" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Mode Details

### `vercel-daily` (Default, Hobby-Safe)
- Generates 2 daily crons in `.vercel/output/config.json`
- Ticker **excluded** (runs once/day via daily check)
- All schedules checked once daily at 06:00 UTC
- **Limitation**: Sub-daily schedules only run at next daily check

### `vercel` (Pro Only)
- Includes all 3 crons with configured schedules
- Ticker runs every minute (`* * * * *` by default)
- Requires Vercel Pro plan ($20/mo)
- Full sub-daily schedule support

### `external` (Free Sub-Daily on Hobby)
- Uses external scheduler (cron-job.org, QStash, GitHub Actions)
- Calls `GET /api/cron/ticker` every minute with `Authorization: Bearer CRON_SECRET`
- **cron-job.org Setup**:
  1. Create free account at https://cron-job.org
  2. Create job: URL = `https://your-app.vercel.app/api/cron/ticker`
  3. Schedule: Every minute (`* * * * *`)
  4. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
  5. Timeout: 300 seconds

### `standalone` (Separate Worker)
- Run `bun scripts/cron-worker.ts` on separate server
- Worker polls queue continuously
- No Vercel cron limits
- **Deploy to**: Railway, Render, Fly.io, VPS

## Build-Time Validation

The build script validates all cron expressions using `cron-parser` and **fails fast** if any expression is invalid:

```bash
# Example error:
# Error: Invalid cron expression for /api/cron/ticker: "invalid" - Invalid cron expression
```

## Migration from `vercel.json`

1. Delete `vercel.json` from repo
2. Set `CRON_EXECUTION_MODE` in Vercel dashboard
3. Deploy - build generates `.vercel/output/config.json` automatically
4. Verify in Vercel dashboard → Project → Cron Jobs

## Verification

Check generated config:
```bash
cat .vercel/output/config.json
```

Expected output for `vercel-daily`:
```json
{
  "version": 3,
  "fluid": true,
  "crons": [
    { "path": "/api/fx/refresh", "schedule": "0 6 * * *" },
    { "path": "/api/cron/class-reminders", "schedule": "0 6 * * *" }
  ]
}
```

Expected output for `vercel`:
```json
{
  "version": 3,
  "fluid": true,
  "crons": [
    { "path": "/api/fx/refresh", "schedule": "0 6 * * *" },
    { "path": "/api/cron/class-reminders", "schedule": "0 6 * * *" },
    { "path": "/api/cron/ticker", "schedule": "* * * * *" }
  ]
}
```
```

---

## Verification Checklist

- [ ] `vercel.json` deleted from repo
- [ ] `scripts/build/generate-vercel-config.ts` created with validation
- [ ] `scripts/build/generate-vercel-config.test.ts` created with full coverage
- [ ] `prebuild` runs generation before `next build`
- [ ] All 8 env keys in `env-config-keys.ts` with defaults
- [ ] `.env.example` updated with all cron vars
- [ ] `environment.d.ts` updated with types
- [ ] `backend/types/cron/cron.types.ts` updated with shared types
- [ ] `docs/deployment/cron.md` created
- [ ] Build generates `.vercel/output/config.json` correctly for each mode
- [ ] Invalid cron expressions fail build with clear error
- [ ] Tests pass: `bun test scripts/build/generate-vercel-config.test.ts`
- [ ] Vercel dashboard shows correct crons after deploy

---

## Compliance Notes

- **Logging**: Uses `process.stderr.write` (not `console.*`) per `scripts/run-test/AGENTS.md`
- **Types**: Shared `CronExecutionMode` and `CronDefinition` in `backend/types/cron/cron.types.ts`
- **Tests**: Follows `bun:test` patterns, no DB involved so `runInRollback` not needed
- **Validation**: Fails fast with non-zero exit code on invalid cron expressions

---

## Additional Fixes Applied

### Fixed `useCronViewModel.tsx` tsgo errors:
1. **Line 264**: Added missing `statuses: null` to `CronRunListInput` variables
2. **Line 280**: Changed `CronRunFieldsFragment[]` to `CronRunsQuery_cronRuns_CronPaginatedRuns_rows_CronRun[]` (the actual generated type from the query)

### Verification Results
- **tsgo**: ✅ No errors in modified files (only pre-existing error in `ensureIdempotentMigrations.ts`)
- **lint**: ✅ No errors in modified files
- **biome:check**: ✅ Clean
- **tests**: ✅ 9/9 passing for `generate-vercel-config.test.ts`