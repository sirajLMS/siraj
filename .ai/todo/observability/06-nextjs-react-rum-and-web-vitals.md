# TODO: Next.js 16 & React 19 RUM, Web Vitals & OpenTelemetry Instrumentation

## 📋 Metadata
- **Domain**: Frontend Real User Monitoring (RUM), Core Web Vitals & Next.js Lifecycle Instrumentation
- **Primary Library / Tool**: Next.js 16 `instrumentation.ts`, `@vercel/otel`, `@vercel/speed-insights`, React 19 `<Profiler>`
- **Docs MCP Library**: `nextjs`, `vercel`
- **Status**: Ready for Spec-Driven Development Plan
- **Target Environments**: Production (3 Deployments), Staging, Local Development

---

## 🎯 Executive Summary & Objective

Establish end-to-end frontend Real User Monitoring (RUM) and server lifecycle instrumentation for **Next.js 16 App Router** and **React 19**. The solution must capture Core Web Vitals (LCP, INP, CLS) from real user browsers, instrument Next.js server rendering and streaming hydration via `app/instrumentation.ts`, measure client component render costs via React `<Profiler>`, and connect browser user actions to backend server traces via distributed W3C headers.

---

## 🏗️ Architecture & Requirements

### 1. Next.js 16 Server Lifecycle Instrumentation (`instrumentation.ts`)
- **`register()` Hook**: Implement Next.js App Router `instrumentation.ts` in the project root to initialize server-side OpenTelemetry tracing.
- **Span Coverage**: Automatically trace incoming HTTP requests, Server Component render durations, Server Actions, Route Handlers (`app/api/graphql/route.ts`), and external fetch requests.
- **Runtime Discrimination**: Ensure instrumentation logic cleanly separates Node.js runtime code from Edge or Bun test environments.

### 2. Real User Monitoring (RUM) & Core Web Vitals
- **Vercel Speed Insights & Analytics**: Leverage the already-installed [`@vercel/speed-insights`](file:///home/ahmed/Projects/siraj/package.json#L126) and [`@vercel/analytics`](file:///home/ahmed/Projects/siraj/package.json#L123) packages for real-user telemetry.
- **Core Web Vitals Metric Ingestion**: Track Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS) on key user views (Student Dashboard, Class Timetable, Teacher Grading Grid).

### 3. React 19 Component Render Profiling
- **Targeted `<Profiler>` Wrappers**: Implement programmatic `<Profiler>` boundaries around complex client components (e.g. data grids, scheduling calendars, PDF designer) to measure render duration and commit counts.
- **Render Cost Diagnostics**: Emit telemetry when client component re-renders exceed performance budgets (e.g. render phase >50ms).

### 4. Build-Time Bundle Size & Asset Profiling
- **Bundle Analyzer Integration**: Utilize [`@next/bundle-analyzer`](file:///home/ahmed/Projects/siraj/package.json#L203) with an environment trigger (`ANALYZE=true bun run build`) to detect client bundle regressions and duplicate package dependencies.

---

## 🧩 Affected Files & Integration Points

| File / Directory | Description |
| :--- | :--- |
| `app/instrumentation.ts` | Next.js 16 server instrumentation and OpenTelemetry registration. |
| `app/[locale]/layout.tsx` | Root layout embedding Speed Insights and RUM scripts. |
| `frontend/components/ui/` | Reusable profiling wrappers for high-complexity UI components. |
| `next.config.ts` | Enable `experimental.instrumentationHook: true` and bundle analyzer wrapping. |

---

## ⚙️ Configuration & Schema Patterns

```typescript
// app/instrumentation.ts (Conceptual Pattern)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize server-side OpenTelemetry / APM exporters
  }
}
```

---

## 🧪 Verification & Acceptance Criteria (For SDD Plan)

1. [ ] **Lifecycle Activation**: Next.js server starts cleanly with `instrumentation.ts` active in production mode without slowing dev server start times.
2. [ ] **Web Vitals Telemetry**: Navigating through dashboard routes emits Core Web Vitals events to the configured telemetry sink.
3. [ ] **W3C Header Forwarding**: Client GraphQL requests include `traceparent` headers that correlate with server-side OpenTelemetry spans.
4. [ ] **Code Quality**: Passes all project quality stages (`tsgo`, `oxlint`, `biome:check`, `lint:type-aware`, `check:duplicates`).

---

## 📚 Docs MCP Server Search Guide

When drafting the implementation plan, search the indexed `nextjs` and `vercel` libraries:
```bash
# Search Next.js App Router instrumentation & Web Vitals
# Query library: nextjs
# Search terms: "instrumentation.ts register hook", "OpenTelemetry App Router", "Core Web Vitals reporting"
```
