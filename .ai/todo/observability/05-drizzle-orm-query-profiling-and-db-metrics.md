# TODO: Drizzle ORM Query Profiling, Slow SQL Detection & Database Metrics

## 📋 Metadata
- **Domain**: Database Performance, ORM Profiling & SQL Diagnostics
- **Primary Library / Tool**: `drizzle-orm`, `pg`, `@neondatabase/serverless`
- **Docs MCP Library**: `drizzle`, `neon`
- **Status**: Ready for Spec-Driven Development Plan
- **Target Environments**: All Environments (Production, Staging, Development)

---

## 🎯 Executive Summary & Objective

Implement high-precision database profiling and query metrics for **Drizzle ORM** across both TCP pooled connections (`pg`) and HTTP stateless queries (`@neondatabase/serverless`). The goal is to detect slow queries (>100ms), measure connection pool wait times, safely log parameterized SQL without leaking PII, and feed database span metrics into APM tools (New Relic / OpenTelemetry) to pinpoint database bottlenecks in backend services and repositories.

---

## 🏗️ Architecture & Requirements

### 1. Drizzle Custom Profiling Logger
- **Custom `Logger` Implementation**: Build a custom `DrizzleQueryProfiler` implementing Drizzle's `Logger` interface in [`backend/db/drizzleDb.ts`](file:///home/ahmed/Projects/siraj/backend/db/drizzleDb.ts).
- **Execution Timing**: Record precise query execution durations (`performance.now()`).
- **Slow Query Threshold**: Automatically log queries taking longer than a configurable threshold (e.g., `DB_SLOW_QUERY_THRESHOLD_MS=100`) as structured `logger.warn` entries with the SQL statement and execution time.

### 2. Parameter Sanitization & PII Safety
- **Safe Logging**: Ensure user passwords, hashed tokens, credit card details, and personal identification information in query parameters are masked or excluded from logs.
- **Drizzle Prepared Statements**: Support logging prepared statement names and placeholder bindings safely.

### 3. Connection Pool & Driver Telemetry
- **Pool Saturation Metrics**: Monitor `pg.Pool` statistics (active connections, idle connections, waiting queue length) to prevent pool exhaustion under high load across the 3 production deployment nodes.
- **Neon HTTP Stateless Timing**: Capture network latency and cold-start overhead when `DB_STRATEGY="neon"` stateless reads are executed via `queryDb()`.

### 4. APM / OpenTelemetry Span Integration
- **Span Attribution**: Wrap database queries in APM spans (`db.statement`, `db.system: postgresql`) linked to the active GraphQL resolver or Next.js server transaction.

---

## 🧩 Affected Files & Integration Points

| File / Directory | Description |
| :--- | :--- |
| `backend/db/drizzleDb.ts` | Initialize `drizzle(pool, { logger: new DrizzleQueryProfiler() })`. |
| `backend/db/factory.ts` | Attach query duration metrics and pool monitoring hooks. |
| `backend/db/http-client.ts` | Profile Neon HTTP client execution latencies. |
| `backend/lib/logger/` | Structured format for SQL query duration and slow query alerts. |

---

## ⚙️ Configuration & Implementation Pattern

```typescript
// backend/db/profiling/drizzle-profiler.ts (Conceptual Pattern)
import type { Logger } from "drizzle-orm";
import { logger } from "@/backend/lib/logger";

export class DrizzleQueryProfiler implements Logger {
  private slowThresholdMs = 100;

  logQuery(query: string, params: unknown[]): void {
    const start = performance.now();
    // Wrap execution and calculate duration
    // Log as warning if duration > slowThresholdMs
  }
}
```

---

## 🧪 Verification & Acceptance Criteria (For SDD Plan)

1. [ ] **Slow Query Capture**: Executing a synthetic slow query (e.g. `pg_sleep(0.2)`) triggers a structured warning log with execution duration.
2. [ ] **Transaction Safety & No Deadlocks**: Profiling hooks do not interfere with `runInRollback` or transaction wrapper safety in database tests.
3. [ ] **Parameter Masking**: Sensitive query arguments (e.g., password hashes, tokens) are never printed in plain text in log streams.
4. [ ] **Code Quality**: Passes all project quality stages (`tsgo`, `oxlint`, `biome:check`, `lint:type-aware`, `check:duplicates`).

---

## 📚 Docs MCP Server Search Guide

When drafting the implementation plan, search the indexed `drizzle` and `neon` libraries:
```bash
# Search Drizzle ORM custom logger and query hooks
# Query library: drizzle
# Search terms: "custom logger interface", "query execution hooks", "prepared statements performance"
```
