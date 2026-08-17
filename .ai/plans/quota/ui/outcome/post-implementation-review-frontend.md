# Post-Implementation Review — Frontend Scope

**Review Date**: 2025-01-24  
**Reviewer**: Copilot CLI (autopilot)  
**Scope**: All new and modified frontend files from the Quota UI Production-Readiness Plan  
**Baseline**: `phase0-baseline-outcome.md` — working tree was clean; 1 pre-existing oxlint warning (filtered out)

---

## Summary

The Quota UI plan introduces a large volume of well-structured frontend code following the tier isolation pattern (desktop/mobile/common), ViewModel hook pattern, and `ResponsiveViewSwitch` architecture. The Apollo hooks, Zustand store usage, path aliases, icon naming (`*Outlined`), and logging are all clean — no violations found in those categories.

However, several issues were identified:

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 4 |
| MEDIUM | 8 |
| LOW | 4 |

The most widespread issue is MUI v9 `Stack` direct prop usage (`direction`, `spacing`) across ~20+ files. A semantic bug in `buildDeliveryRate` and dead code in `quotaForm.types.ts` and `quotaAudienceViewShared.tsx` are the highest-impact findings.

---

## CRITICAL

```
[CRITICAL] frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers.ts:85 —
  buildDeliveryRate filters by QuotaKind.Package (line 85) but the chart label key is
  "onDemandDeliveryRate" (quotaFormAccessContext.constants.ts:98). The QuotaKind enum only has
  Package and Periodic — there is no OnDemand value. The function counts Package-type quotas
  and labels them "onDemand delivery rate", causing a semantic mismatch between the data shown
  and the chart title. Additionally, buildRedemptionByType (line 73) has a dead `else onDemand`
  branch that can never trigger since QuotaKind only has two enum members.
```

---

## HIGH

```
[HIGH] frontend/common/views/dashboard/billing/quota/types/quotaForm.types.ts:1-2,63-90 —
  Cross-layer import: this file in frontend/common/ imports directly from @/backend/enum and
  @/backend/types. The shared/common layer must never import from backend. The file maps between
  GraphQL-generated enums (QuotaKind, QuotaPeriodType) and backend enums (BackendQuotaKind,
  BackendQuotaPeriodType) — this mapping logic belongs in a service or container layer, not in
  frontend/common types. Additionally, ALL exports (formStateToSubmitInput,
  quotaReturnTypeToFormState, BillingQuotaFormState, BillingQuotaFormProps) are dead code —
  they are re-exported by types/index.ts barrel but never consumed by any other file.
```

```
[HIGH] frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceViewShared.tsx —
  Entire file is dead code. The QuotaAudienceViewShared component and QuotaAudienceSection
  interface are not imported by any other file. Each audience view (StudentQuotaView,
  ParentQuotaView, TeacherQuotaView, SupervisorQuotaView) implements its own rendering and
  does not use this shared component. ~90 lines of unused code.
```

```
[HIGH] frontend/mobile/views/dashboard/billing/quota/components/QuotaInsightsChartsMobile.tsx —
  Feature parity gap: the DeliveryRateChart (rendered via buildDeliveryRate data) is present
  in the Desktop tier (QuotaInsightsChartsMobile.tsx renders 4 charts: redemptionRateByType,
  quotaPurchasesOverTime, pendingCreditBacklogGauge, expiredSlippage) but the Desktop tier
  (QuotaInsightsChartsDesktop.tsx) renders 5 charts including the delivery rate chart. The
  mobile tier is silently dropping an entire chart with no empty-state or explanation.
```

```
[HIGH] Widespread (~20+ files) — MUI v9 Stack/Paper direct prop violations.
  The frontend/AGENTS.md MUI v9 rules explicitly prohibit style props directly on MUI
  components. Stack's `direction` and `spacing` map to CSS `flexDirection` and `gap`, which
  are listed as prohibited direct props. Per the rules, use `sx={{ flexDirection: "row",
  gap: 2 }}` instead of `direction="row" spacing={2}`.

  Files with Stack direction/spacing direct props:
  - quotaForm.desktop.tsx:58 — <Stack direction="row" spacing={1}>
  - quotaForm.mobile.tsx:48 — <Stack direction="row" spacing={1}>
  - quotaInsights.desktop.tsx:129 — <Stack direction="row" spacing={1}>
  - QuotaListDesktopActions.tsx:15 — <Stack direction="row" spacing={1}>
  - QuotaListItemMobile.tsx:25,26,39,52 — multiple Stack direction/spacing
  - QuotaDetailSummaryMobile.tsx:28,64 — Stack direction="row" spacing={1}
  - StudentQuotaView.tsx:59,62,63
  - ParentQuotaView.tsx:72,85,91,92,93
  - TeacherQuotaView.tsx:34,41,51,52
  - SupervisorQuotaView.tsx:132,162,163,199
  - quotaAudienceBalanceCard.tsx:40,42,48,60

  Files with Paper/Box direct style props:
  - quotaAudienceViewShared.tsx:60,61,75 — Paper display="flex" alignItems gap (also dead code)
  - QuotaFormSectionDesktop.tsx — Box direct props
  - QuotaFormSectionMobile.tsx — Box direct props
```

---

## MEDIUM

```
[MEDIUM] frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel.ts:158 —
  Hardcoded CSV filename "quota-insights.csv". While CSV filenames may not need full i18n,
  the export success toast message and any user-visible text should use typed translation
  functions. The filename itself is acceptable as a constant but should be extracted to a
  named constant rather than inlined.
```

```
[MEDIUM] frontend/desktop/views/dashboard/billing/quota/quotaInsights.desktop.tsx:61,
  frontend/mobile/views/dashboard/billing/quota/quotaInsights.mobile.tsx:62 —
  Hardcoded breadcrumb string "Quotas". All user-facing strings must use typed translation
  functions. The breadcrumb label should come from the i18n labels via the access context
  or ViewModel.
```

```
[MEDIUM] Code duplication: QuotaFormSectionDesktop.tsx ≈ QuotaFormSectionMobile.tsx
  (~300 lines each, near-identical). These two tier files share the vast majority of their
  rendering logic (form fields, Autocomplete, date pickers, selects, number inputs). Per
  the shared scaffold pattern (docs/frontend/ui-shared-scaffold-pattern.md), the common
  rendering should be extracted into a *Shared.tsx component in the __shared__ directory,
  leaving only tier-specific layout differences in the desktop/mobile files.
```

```
[MEDIUM] Code duplication: formatDate function duplicated across 4 audience view files:
  - StudentQuotaView.tsx
  - ParentQuotaView.tsx
  - SupervisorQuotaView.tsx
  - quotaAudienceBalanceCard.tsx
  All four define the same formatDate(dateString) helper. Should be extracted to
  quotaAudienceHelpers.ts in __shared__.
```

```
[MEDIUM] Code duplication: formatDelta function duplicated across StudentQuotaView.tsx and
  ParentQuotaView.tsx. Both define identical formatDelta(delta, remaining) helpers. Should
  be extracted to quotaAudienceHelpers.ts.
```

```
[MEDIUM] Code duplication: statusLabelMap duplicated across QuotaDetailSummaryDesktop.tsx
  and QuotaDetailSummaryMobile.tsx. Both define the same
  { ACTIVE: labels.statuses.ACTIVE, ... } map inline. The shared util formatQuotaStatus
  already exists in quotaFormatters.ts and should be used instead (it is used by
  QuotaListItemMobile and buildQuotaColumns but not the detail summary components).
```

```
[MEDIUM] Code duplication: getDeltaColor function duplicated across
  quotaDetail.desktop.tsx and quotaDetail.mobile.tsx. Both define identical
  getDeltaColor(value, theme) functions returning { color: theme.palette.error.main | 
  theme.palette.success.main }. Should be extracted to a shared utility.
```

```
[MEDIUM] Code duplication: buildQuotaColumns logic in SupervisorQuotaView.tsx partially
  duplicates the shared utility buildQuotaColumns.tsx in utils/. The SupervisorQuotaView
  defines its own inline column builder with similar column definitions (student name,
  kind, status, remaining, total classes, priority). Should reuse or extend the shared
  buildQuotaColumns utility.
```

---

## LOW

```
[LOW] frontend/common/views/dashboard/students/quota/audience/QuotaAudienceView.tsx —
  Uses string literal role comparison ("STUDENT", "PARENT", "TEACHER", "SUPERVISOR") instead
  of imported enum values. While these map to t.breadcrumbs labels rather than backend
  enums, using typed constants would prevent typos and improve maintainability.
```

```
[LOW] frontend/mobile/views/dashboard/billing/quota/components/QuotaInsightsChartsMobile.tsx ±
  QuotaInsightsChartsDesktop.tsx —
  The getChartColors, ChartAxisGrid, and chart wrapper component structure is duplicated
  across desktop and mobile chart files. The shared chart shapes already exist in
  quotaInsightsChartShapes.tsx but the desktop and mobile tiers each re-define
  getChartColors and ChartAxisGrid locally.
```

```
[LOW] frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.ts:16 —
  Throws Error with hardcoded string "useQuotaFormAccess must be used within
  QuotaFormAccessProvider". This is a developer-facing error (not user-facing) so i18n is
  not strictly required, but the message could be extracted to a named constant for
  consistency.
```

```
[LOW] frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers.ts:73 —
  Dead branch: `else onDemand += redeemed` in buildRedemptionByType can never execute
  because QuotaKind enum only has Package and Periodic. The onDemand bucket, the chart
  data entry for onDemandType (line 80), and the chart label onDemandType are all dead
  code that will always produce 0 values.
```

---

## Clean Areas (No Issues Found)

The following checklist items had **zero violations** across all reviewed files:

- **Apollo hook patterns**: All `useQuery` imports come from `@apollo/client/react` (not `@apollo/client`). No `useLazyQuery` found. All queries include `id` fields.
- **Zustand store patterns**: `quotaStore.ts` uses correct immutable state updates with `set()`. No direct mutation.
- **Theme compliance**: No hardcoded colors found. All color references use `theme.palette.*` via `sx` callbacks.
- **Icon naming**: All MUI icons use `*Outlined` suffix. No `*Outline` (without `d`) found.
- **Path aliases**: All imports use `@/` prefix. No relative imports across files.
- **Logging**: No `console.*` found. All files use proper `logger` or no logging at all.
