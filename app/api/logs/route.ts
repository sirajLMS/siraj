import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { MAX_LOG_BATCH_BYTES, MAX_LOG_ENTRIES_PER_BATCH } from "@/app/api/logs/client-logs.constants";
import {
  checkDailyByteBudget,
  isBatchLogRequest,
  isValidLogEntry,
  sanitizeSessionId,
} from "@/app/api/logs/client-logs-sanitize.helpers";
import { writeBatchLogs } from "@/app/api/logs/client-logs-storage.helpers";
import { getServerUserContext } from "@/backend/lib";
import { checkRateLimit, clientLogsRateLimiter } from "@/backend/lib/ratelimit";
import { getServerTranslations } from "@/shared/locale";

export { sanitizeForRendering } from "@/app/api/logs/client-logs-sanitize.helpers";

// Gate client log ingestion on the server. Mirrors the server-side
// `BaseLogger` gate at `shared/lib/logger/base-logger.ts:24`: enabled in dev
// by default, and in prod only when the operator explicitly sets
// `ENABLE_LOGGING=true`. This lets prod deployments opt into writing
// `logs/client_<sessionId>.log` files for triaging browser-side diagnostics
// (e.g. the auth recovery path) without requiring the user to copy logs out
// of DevTools.
const CLIENT_LOGS_ENABLED = process.env.NODE_ENV === "development" || process.env.ENABLE_LOGGING === "true";

export async function POST(request: NextRequest) {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  if (!CLIENT_LOGS_ENABLED) {
    return NextResponse.json({ error: tErrors.notFound }, { status: 404 });
  }

  const { userId } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: tErrors.file.authenticationRequired }, { status: 401 });
  }

  try {
    const rawBody: unknown = await request.json();
    if (!isBatchLogRequest(rawBody)) {
      return NextResponse.json({ error: tErrors.invalidRequestFormat }, { status: 400 });
    }
    const body = rawBody;

    if (body.logs.length > MAX_LOG_ENTRIES_PER_BATCH) {
      return NextResponse.json({ error: tErrors.invalidRequestFormat }, { status: 400 });
    }

    // Total batch byte cap — rejects oversized payloads before disk write
    // (prevent disk-exhaustion via unbounded log batches).
    const batchBytes = Buffer.byteLength(JSON.stringify(body));
    if (batchBytes > MAX_LOG_BATCH_BYTES) {
      return NextResponse.json({ error: tErrors.invalidRequestFormat }, { status: 400 });
    }

    // Per-user rate limit on log ingestion (security review M1) — keying on the
    // authenticated userId prevents token-sharing IP rotation from gaining
    // extra buckets.
    const logsRateLimit = await checkRateLimit(`client-logs:${userId}`, clientLogsRateLimiter);
    if (!logsRateLimit.success) {
      return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
    }

    // Per-user daily byte budget — the batch payload size counts against a
    // 256 KiB/day running total keyed on the authenticated userId.
    if (!(await checkDailyByteBudget(userId, batchBytes))) {
      return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
    }

    if (!body.logs.every(isValidLogEntry)) {
      return NextResponse.json({ error: tErrors.missingRequiredFields }, { status: 400 });
    }

    // Sanitize all session IDs to prevent path traversal
    for (const log of body.logs) {
      try {
        sanitizeSessionId(log.sessionId);
      } catch {
        return NextResponse.json({ error: tErrors.invalidSessionId }, { status: 400 });
      }
    }

    const logsDir = join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true }).catch(() => {});

    await writeBatchLogs(body.logs, logsDir);

    return NextResponse.json({ success: true, count: body.logs.length });
  } catch {
    return NextResponse.json({ error: tErrors.failedToWriteLogs }, { status: 500 });
  }
}
