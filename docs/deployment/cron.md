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