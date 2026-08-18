# TODO: Blackfire.io Deep Code Profiling & CI/CD Performance Assertions

## 📋 Metadata
- **Domain**: Deterministic Code Profiling & Automated Performance Testing
- **Primary Library / Tool**: `blackfire` (Node.js Probe & Blackfire CLI)
- **Docs MCP Library**: `blackfire`
- **Status**: Ready for Spec-Driven Development Plan
- **Target Environments**: Development, Staging & CI/CD Automation Pipeline (Zero Production Overhead)

---

## 🎯 Executive Summary & Objective

Implement **Blackfire.io** deterministic profiling to diagnose deep CPU and memory bottlenecks at the microscopic function level, and establish automated **CI/CD performance assertions** (`.blackfire.yml`). This prevents performance regressions, uncovers heavy JavaScript function loops, and strictly enforces database query budgets (preventing N+1 query leaks) before code is merged into production.

---

## 🏗️ Architecture & Requirements

### 1. Deterministic On-Demand Profiling
- **Zero Overhead by Default**: The Blackfire probe sits dormant in the Node.js runtime and only activates when an authorized profiling request header (`X-Blackfire-Query`) or CLI trigger is provided.
- **Microscopic Call Graphs**: Capture exact wall-clock duration, I/O wait time, CPU cycles, and memory heap allocation per function across Next.js server components, Pothos resolver chains, and Drizzle query generation.
- **Side-by-Side Comparison**: Enable diffing two profiles to evaluate whether refactoring (e.g. ViewModel extraction or DataLoader adoption) achieved the desired performance gains.

### 2. CI/CD Performance Quality Gates (`.blackfire.yml`)
- **Automated Scenario Testing**: Define critical user journeys (e.g. Student Dashboard load, Class Schedule query, Report Generation) as automated Blackfire scenarios in CI.
- **Performance Assertions**:
  * Limit maximum wall time on key API endpoints (e.g., `main.wall_time < 150ms`).
  * Enforce strict SQL query counts to catch N+1 regressions in Drizzle (e.g., `metrics.sql.queries.count <= 4`).
  * Enforce maximum memory consumption (e.g., `main.memory < 25MB`).

### 3. Target Profiling Domains
- **GraphQL Resolver Depth**: Profile execution chains of nested Pothos resolvers to verify DataLoader batching efficiency.
- **Heavy Data Processing**: Profile PDF generation (`@pdfme/ui`, `pdf-lib`), Excel exports (`xlsx-js-style`), and timetable scheduling logic.

---

## 🧩 Affected Files & Integration Points

| File / Directory | Description |
| :--- | :--- |
| `.blackfire.yml` | Performance test scenarios, metrics definitions, and CI assertions. |
| `backend/lib/profiling/` | Optional helper utilities for triggering programmatic Blackfire profiles. |
| `.github/workflows/` | CI workflow job for running `blackfire-player` or executing Blackfire build tests. |
| `package.json` | Dev dependency for `blackfire` probe if using local Node.js profiling daemon. |

---

## ⚙️ Environment Configuration

```env
# Blackfire Credentials (Dev / CI / Staging)
BLACKFIRE_SERVER_ID="<SERVER_ID>"
BLACKFIRE_SERVER_TOKEN="<SERVER_TOKEN>"
BLACKFIRE_CLIENT_ID="<CLIENT_ID>"
BLACKFIRE_CLIENT_TOKEN="<CLIENT_TOKEN>"
BLACKFIRE_LOG_LEVEL=1
```

---

## 🧪 Verification & Acceptance Criteria (For SDD Plan)

1. [ ] **On-Demand Profile Execution**: Executing `blackfire run curl http://localhost:3000/api/graphql` generates a complete function call graph in the Blackfire dashboard.
2. [ ] **N+1 Assertion Trigger**: An intentional unbatched loop in a test resolver causes Blackfire's `metrics.sql.queries.count` assertion to fail in CI.
3. [ ] **Memory Allocation Breakdown**: The profiler accurately displays heap memory consumption across heavy computation functions.
4. [ ] **Code Quality**: Passes all project quality checks (`tsgo`, `oxlint`, `biome:check`, `lint:type-aware`).

---

## 📚 Docs MCP Server Search Guide

When drafting the implementation plan, search the indexed `blackfire` and `nextjs` libraries:
```bash
# Search Blackfire Node.js probe & assertions
# Query library: blackfire
# Search terms: "Node.js probe configuration", "writing assertions .blackfire.yml", "SQL metrics profiling"
```
