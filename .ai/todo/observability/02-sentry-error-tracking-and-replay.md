# TODO: Sentry Full-Stack Error Tracking, Source Maps & Session Replay

## 📋 Metadata
- **Domain**: Error Tracking, Crash Reporting & User Session Intelligence
- **Primary Library / Tool**: `@sentry/nextjs` (Cloud or Self-Hosted Docker Container)
- **Docs MCP Library**: `sentry-docs`
- **Status**: Ready for Spec-Driven Development Plan
- **Target Environments**: Production (3 Deployments), Staging, with optional Self-Hosted Container backend

---

## 🎯 Executive Summary & Objective

Implement comprehensive full-stack crash reporting and developer-centric error diagnostics using Sentry. The setup must capture, group, and de-obfuscate errors across React 19 Client Components, Next.js 16 Server Components / Route Handlers, Pothos GraphQL execution, and background workers. It must support automated TypeScript source map uploads during build time, privacy-safe Session Replay, and unify errors across all 3 production deployment nodes into a single project dashboard with deployment fingerprinting.

---

## 🏗️ Architecture & Requirements

### 1. Multi-Deployment Unified Issue Tracking
- **Unified Project View**: Set `environment="production"` and `release="siraj@<commit-hash>"` across all 3 nodes so identical errors are grouped into a single actionable Sentry issue.
- **Node Tagging**: Attach `server_name="deploy-1"` (or `deploy-2`, `deploy-3`) and cluster tags to filter issues by specific server instance when isolating deployment-specific faults.

### 2. Full-Stack Error Boundary & Interception
- **Client-Side (React 19)**: Integrate Sentry React Error Boundaries (`@sentry/nextjs`) to catch rendering crashes and capture user breadcrumbs (clicks, navigation, state transitions).
- **Server-Side (Next.js 16 App Router)**: Hook into `instrumentation.ts` and `app/global-error.tsx` to intercept unhandled exceptions in Server Components and streaming SSR.
- **GraphQL Resolver Errors**: Automatically attach GraphQL operation names, variables (sanitized of passwords/secrets), and user ID context to GraphQL execution errors.

### 3. Build-Time Source Maps Upload
- **Next.js Webpack / Turbopack Pipeline**: Configure Sentry CLI / Next.js plugin to generate and upload `.map` files during `bun run build`.
- **Source Map Cleanup**: Automatically purge or conceal raw source maps from public production assets to protect intellectual property.

### 4. Privacy-Safe Session Replay
- **Privacy Masking**: Enable Session Replay with strict masking rules (all text inputs, passwords, credit card fields, and PII masked by default).
- **Sampling Strategy**: Sample 100% of sessions with errors and a low sample rate (e.g. 5%) for standard healthy sessions to conserve storage/bandwidth.

### 5. Self-Hosted Container Compatibility (Optional Architecture)
- Ensure DSN and tunnel endpoints (`/api/sentry-tunnel`) support pointing to either Sentry SaaS or a private self-hosted Sentry instance (`getsentry/self-hosted`) without code refactoring.

---

## 🧩 Affected Files & Integration Points

| File / Directory | Description |
| :--- | :--- |
| `sentry.client.config.ts` | Client-side Sentry initialization (Replay, Browser tracing). |
| `sentry.server.config.ts` | Server-side Node.js Sentry initialization. |
| `sentry.edge.config.ts` | Middleware / Edge runtime configuration if applicable. |
| `next.config.ts` | Wrap config with `withSentryConfig` for source map generation & route wrapping. |
| `app/global-error.tsx` | Global error boundary reporting to `Sentry.captureException`. |
| `backend/lib/logger/` | Forward high-severity `logger.error(...)` logs to Sentry as captured events with context. |

---

## ⚙️ Environment Configuration

```env
# Sentry Configuration
SENTRY_ENABLED=true
NEXT_PUBLIC_SENTRY_DSN="https://<KEY>@sentry.yourdomain.com/<PROJECT_ID>"
SENTRY_AUTH_TOKEN="<AUTH_TOKEN_FOR_SOURCE_MAPS>"
SENTRY_ORG="siraj-org"
SENTRY_PROJECT="siraj-lms"
SENTRY_ENVIRONMENT="production"
SENTRY_RELEASE="siraj@0.1.0"
SENTRY_SERVER_NAME="deploy-1"
```

---

## 🧪 Verification & Acceptance Criteria (For SDD Plan)

1. [ ] **Stack Trace Fidelity**: An intentional test exception thrown in a production build displays the original TypeScript file name, function name, and line number in Sentry.
2. [ ] **Breadcrumb Context**: An error logged from a GraphQL mutation includes preceding route transitions and user interaction breadcrumbs.
3. [ ] **Sanitization**: Password fields, JWT tokens, and sensitive payment data are scrubbed before transmission.
4. [ ] **Quality Gate**: Code passes all quality stages (`tsgo`, `oxlint`, `biome:check`, `lint:type-aware`, `check:duplicates`).

---

## 📚 Docs MCP Server Search Guide

When drafting the implementation plan, search the indexed `sentry-docs` and `nextjs` libraries:
```bash
# Search Sentry Next.js App Router setup
# Query library: sentry-docs
# Search terms: "Next.js App Router SDK", "source maps upload next.config", "session replay privacy masking"
```
