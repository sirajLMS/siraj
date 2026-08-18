# TODO: New Relic Production APM & Multi-Deployment Aggregation

## 📋 Metadata
- **Domain**: Observability & Performance Monitoring (APM)
- **Primary Library / Tool**: `newrelic` (Node.js Agent / OpenTelemetry OTLP Exporter)
- **Docs MCP Library**: `newrelic`
- **Status**: Ready for Spec-Driven Development Plan
- **Target Environments**: Production (3 Deployments / Instances) — Disabled in Development & Test

---

## 🎯 Executive Summary & Objective

Implement production Application Performance Monitoring (APM) using the active **New Relic subscription** to achieve unified, 24/7 observability across **all 3 production deployment instances**. The solution must aggregate system health, transaction throughput, response times, and distributed tracing into a single logical application in New Relic (`Siraj-Production`), while preserving per-instance drill-down (`Siraj-Deploy-1`, `Siraj-Deploy-2`, `Siraj-Deploy-3`).

---

## 🏗️ Architecture & Requirements

### 1. Multi-Deployment Unified Ingestion
- **Single Aggregated View**: Configure composite application naming (`NEW_RELIC_APP_NAME="Siraj-Deploy-X;Siraj-Production"`). Telemetry from all 3 deployments rolls up into one top-level entity in New Relic APM.
- **Node-Level Isolation**: Retain individual deployment entity views for comparing node performance, load distribution, and memory/CPU usage across instances.
- **Custom Attributes & Tags**: Attach deployment metadata via environment configuration (`deployment_id`, `environment: production`, `git_commit`, `region`).

### 2. Next.js 16 Server-Side Transaction Monitoring
- **App Router & HTTP Transactions**: Instrument incoming HTTP requests, Server Component render times, Next.js Route Handlers, and Server Actions.
- **Runtime Safety**: Ensure the New Relic agent runs strictly on Node.js production runtime and does not interfere with Bun-based unit/integration tests or local Turbopack development.
- **Cold Start & Health Checks**: Exclude frequent internal health check endpoints (e.g. `/api/health`, `/api/cron/tick`) from skewing transaction average response time metrics.

### 3. Distributed Tracing Pipeline
- **W3C Trace Context**: Propagate standard `traceparent` and `tracestate` headers across frontend Apollo Client calls, Next.js server layers, Pothos GraphQL resolvers, and Drizzle PostgreSQL queries.
- **Slow Transaction Traces**: Capture detailed transaction waterfalls for requests exceeding the configured latency threshold (e.g. >500ms).

### 4. Background Workers & Cron Jobs
- **pg-boss / BullMQ Workers**: Wrap background queue processors in background transaction spans (`newrelic.startBackgroundTransaction`) to measure job execution durations and failure rates.

---

## 🧩 Affected Files & Integration Points

| File / Directory | Description |
| :--- | :--- |
| `newrelic.js` | Root New Relic configuration file (licensing, logging, naming, transaction tracer rules). |
| `app/instrumentation.ts` | Next.js 16 `register()` hook for initializing monitoring agents or OTLP exporters. |
| `backend/lib/env/` | Add typed schema definitions for `NEW_RELIC_LICENSE_KEY`, `NEW_RELIC_APP_NAME`, and `NEW_RELIC_ENABLED`. |
| `backend/lib/logger/` | Route New Relic diagnostic logs through the centralized project logger without `console.*`. |
| `package.json` | Production dependency for `newrelic` or `@newrelic/next` / `@opentelemetry/exporter-trace-otlp-http`. |

---

## ⚙️ Environment Configuration

```env
# New Relic Credentials & Aggregation
NEW_RELIC_ENABLED=true
NEW_RELIC_LICENSE_KEY="<LICENSE_KEY>"
NEW_RELIC_APP_NAME="Siraj-Deploy-1;Siraj-Production"
NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true
NEW_RELIC_LOG_LEVEL="info"
NEW_RELIC_TRANSACTION_TRACER_EXPLAIN_THRESHOLD=500
NEW_RELIC_LABELS="Environment:production;Tier:backend;Stack:next16-pothos-drizzle"
```

---

## 🧪 Verification & Acceptance Criteria (For SDD Plan)

1. [ ] **Zero Dev/Test Overhead**: When running `bun test`, `bun run dev`, or `bun quality-gate`, New Relic must remain completely inactive and uninitialized.
2. [ ] **Unified Dashboard Validation**: Emitting test transactions from 3 simulated instances correctly populates the single `Siraj-Production` APM service in New Relic.
3. [ ] **End-to-End Trace Waterfall**: A GraphQL request triggered from Apollo Client shows a connected trace spanning Next.js Server → Pothos Resolver → Drizzle SQL query.
4. [ ] **Code Quality Compliance**: Passes all project quality stages (`tsgo`, `oxlint`, `biome:check`, `lint:type-aware`, `check:duplicates`).

---

## 📚 Docs MCP Server Search Guide

When drafting the implementation plan, search the indexed `newrelic` and `nextjs` libraries:
```bash
# Search New Relic Next.js App Router instrumentation
# Query library: newrelic
# Search terms: "Next.js App Router instrumentation", "distributed tracing W3C", "composite application naming"
```
