# Dashboard Page: Make All Components Use Real Data & Actions

## CONFIRMED APPROACH (user-approved)

- **P4-P11 (Parent handlers)**: Accept all navigation/mutation suggestions
- **P1-P3 (Parent fake data)**: Add full backend query (types → repo → service → Pothos → frontend)
- **A1, T1-T4 (Admin/Teacher minor)**: Fix all

## Scope

The dashboard page at `app/[locale]/(dashboard)/dashboard/page.tsx` delegates to `DashboardContainer`, which routes to one of three dashboards based on user permissions:

1. **Admin Dashboard** — `AdminDashboardContainer` → `DashboardView`
2. **Parent Dashboard** — `ParentDashboardContainer` → `ParentDashboardView`
3. **Teacher Dashboard** — `TeacherDashboardContainer` → `TeacherDashboardView`

## Issues Found

### Admin Dashboard (`frontend/views/dashboard/dashboard/`)

| # | Component | Issue |
|---|-----------|-------|
| A1 | `AdminDashboardContainer` | `lastUpdated` is static i18n string `t("admin.updatedMinutesAgo")` — not a real timestamp |

### Parent Dashboard (`frontend/views/dashboard/parents/dashboard/`)

| # | Component | Issue |
|---|-----------|-------|
| P1 | `ParentDashboardContainer` — `metrics` | Store initialized with zeros — **no GraphQL query exists** for parent dashboard metrics |
| P2 | `ParentDashboardContainer` — `studentProgress` | Store defaults to `[]` — never populated from API |
| P3 | `ParentDashboardContainer` — `workshopPromo` | Store defaults to empty — never populated from API |
| P4 | `onFilter` handler | Only `logger.info()` — does nothing |
| P5 | `onViewFullWeek` handler | Only `logger.info()` — should navigate to `/[locale]/schedule` |
| P6 | `onViewAll` handler | Only `logger.info()` — should navigate to `/[locale]/schedule` |
| P7 | `onHistory(id)` handler | Only `logger.info()` — should navigate to `/[locale]/students/[id]/history` |
| P8 | `onJoinVideo(id)` handler | Only `logger.info()` — should open `zoomMeetingUrl` from row data |
| P9 | `onDownloadReport` handler | Only `logger.info()` — should navigate to `/[locale]/reports` |
| P10 | `onLearnMore` handler | Only `logger.info()` — should navigate to workshop page or hide if none |
| P11 | `onSupport` handler | Only `logger.info()` — should open support or navigate to support |

### Teacher Dashboard (`frontend/views/dashboard/teachers/dashboard/`)

| # | Component | Issue |
|---|-----------|-------|
| T1 | `onJoinVideo` fallback | Uses `alert("Meeting URL not available.")` |
| T2 | `handleDownloadHandbook` fallback | Uses `alert("Handbook URL not found.")` |
| T3 | `handleSupportRequest` | Uses `alert()` instead of proper toast/snackbar |
| T4 | Mobile "View All" text | Plain `<Typography>` — not clickable |

## Execution Phases

### Phase 1: Backend — New Parent Dashboard Metrics Query

**1.1 Backend Types** (`backend/types/parent.types.ts`)
- Add `ParentDashboardMetricsType` (totalStudents, todaysClasses, pendingInvoicesCount, pendingInvoicesAmount, performanceAvg, performanceAvgMobile, pendingMessages)
- Add `StudentProgressReturnType` (id, name, completionPercent)
- Add `WorkshopPromoReturnType` (title, description, imageUrl)
- Add `ParentDashboardMetricsReturnType` (metrics, studentProgress, workshopPromo, id)

**1.2 Backend Repository** (`backend/db/repo/parent.repository.ts`)
- Add `getParentDashboardMetrics(parentId)` — aggregate student count, today's class count, pending invoices
- Add `getParentStudentProgress(parentId)` — query student completion data
- Add `getParentWorkshopPromo(parentId)` — query active workshop promotions
- Add repo tests in `backend/db/test/repo/`

**1.3 Backend Service** (`backend/services/parent/parent-dashboard.service.ts`)
- Add `getDashboardData(userId, locale)` — orchestrate repo calls, compute metrics

**1.4 Backend GraphQL** (`backend/graphql/pothos/` + `backend/graphql/query/`)
- New Pothos objects: `ParentDashboardMetrics`, `StudentProgress`, `WorkshopPromo`
- New query field: `parentDashboardMetrics` → calls service
- Run `bun run generate:gqlSchema && bun codegen`

**1.5 Test**: Run `bun run test:db` for repo tests, then `bun run test:graphql` for integration

### Phase 2: Frontend — Parent Dashboard Real Data & Actions

**2.1 GraphQL Documents** (`frontend/graphql/sharedDocuments/parent-dashboard.documents.ts`)
- Add `parentDashboardMetricsQueryDocument` query

**2.2 Store Cleanup** (`frontend/stores/parentDashboardStore.ts`)
- Remove `metrics`, `studentProgress`, `workshopPromo` from store (keep page/pageSize/setPage/setScheduleTotalCount for UI state)

**2.3 Container** (`frontend/views/dashboard/parents/dashboard/ParentDashboardContainer.tsx`)
- Add `useQuery(parentDashboardMetricsQueryDocument)` for real metrics/progress/workshop data
- Replace all logger-only handlers:
  - `onFilter`: `router.push('/${locale}/schedule')`
  - `onViewFullWeek`/`onViewAll`: `router.push('/${locale}/schedule')`
  - `onHistory(id)`: `router.push('/${locale}/students/${id}/history')`
  - `onJoinVideo(id)`: look up `zoomMeetingUrl` from schedule rows, `globalThis.open(url, '_blank')`
  - `onDownloadReport`: `router.push('/${locale}/reports')`
  - `onLearnMore`: hide button if no workshop promo, else navigate to workshop page
  - `onSupport`: navigate to support or open dialog

**2.4 View Components** — no changes needed (they're purely presentational, receive data from container)

### Phase 3: Admin Dashboard Fix

**3.1** `AdminDashboardContainer.tsx` — Replace static `t("admin.updatedMinutesAgo")` with real timestamp from data fetch time (store `Date.now()` on data arrival, compute relative time)

### Phase 4: Teacher Dashboard Fixes

**4.1** `TeacherDashboardContainer.tsx` — Replace `alert()` calls with proper toast/snackbar:
- Import snackbar/toast utility
- Replace `alert("Meeting URL not available.")` with toast notification
- Replace `alert("Handbook URL not found.")` with toast notification
- Replace `alert("Support request submitted...")` with toast notification

**4.2** `TeacherDashboardActiveView.tsx` — Make mobile "View All" text a clickable link navigating to schedule page

### Phase 5: Quality Checks

- Run `bun tsgo`
- Run `bun biome:check`
- Run `bun run lint` (via queue server if parallel)
- No codescene, no sonar scan

## Agent Sandbox

All work inside Docker agent sandbox per `.agent-sandbox/README.md`:
1. `docker build -t siraj-agent-base -f .agent-sandbox/Dockerfile.agent .`
2. `.\.agent-sandbox\new-agent-sandbox.ps1 -AgentName "fix-dashboard-real" -AgentNumber 1`
3. `docker exec -it siraj-agent-1 bash`
4. Work at `/workspaces/siraj`

## Test Strategy

- After each backend layer change, run layer-specific test **file** first, then full layer suite
- `backend/types/` — no tests (types only)
- `backend/db/repo/` — `bun test backend/db/test/repo/<file>.test.ts` then `bun run test:db`
- `backend/services/` — `bun test backend/db/test/logic/<file>.test.ts` then `bun run test:db:sequential`
- `backend/graphql/` — `bun run test:graphql`
- Frontend — `bun run test:ui:components` if relevant test files exist

## Quality Commands (inside sandbox)

- `bun tsgo` — type check
- `bun biome:check` — lint/format (NOT `biome check`)
- `bun run lint` — ESLint
- NO codescene, NO sonar scan
