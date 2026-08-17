# Wave 2 — Task Group 8: Audience Views — Live Data Wiring Outcome

## Summary

Wired all 4 role-specific audience view components to live GraphQL data, replacing skeleton stubs with real data fetching, rendering, loading states, empty states, and role-appropriate UI patterns.

## Files Modified

### Audience View Components (Full Rewrites)

| File | Role | Data Source | Key Features |
|------|------|-------------|--------------|
| `StudentQuotaView.tsx` | Student | `studentQuotasQueryDocument` + `quotaLedgerQueryDocument` + `meQueryDocument` | Balance cards for all student quotas, StatusBadge, valid period, recent 5 ledger entries, expiry warning banner (<7 days), exhausted banner (0 remaining), empty state, loading skeleton with `aria-busy` |
| `ParentQuotaView.tsx` | Parent | `parentAssociatedStudentsQueryDocument` + `studentQuotasQueryDocument` + `quotaLedgerQueryDocument` + `meQueryDocument` | MUI Tabs for multiple children, child avatar + name header, per-child balance cards + ledger entries, same banners as student view |
| `TeacherQuotaView.tsx` | Teacher | `teacherAssignedStudentsQueryDocument` | Per-student rows with remaining/total balance, eligibility indicator (CheckCircleOutlined for eligible, DoNotDisturbOutlined for not eligible) |
| `SupervisorQuotaView.tsx` | Supervisor/Admin | `quotasQueryDocument` | Full audit table via AppDataGrid (8 columns), status breakdown cards (total/active/expired/archived), all quotas with kind/status/remaining/dates |

### Shared Components (Created in Wave 2)

| File | Purpose | Exports |
|------|---------|---------|
| `__shared__/quotaAudienceBalanceCard.tsx` | Reusable balance card, empty state, loading skeleton | `QuotaBalanceCard`, `QuotaEmptyState`, `QuotaLoadingSkeleton` |
| `__shared__/quotaAudienceHelpers.ts` | Date/expiry utility functions | `daysUntilExpiry`, `isExpiringSoon`, `isQuotaExhausted`, `getExpiryWarningThreshold` |
| `__shared__/quotaAudienceStatus.utils.ts` | i18n label mapping for QuotaStatus, QuotaKind, QuotaLedgerReason | `getQuotaStatusLabel`, `getQuotaKindLabel`, `getLedgerReasonLabel` |

### i18n Files (Updated)

| File | Changes |
|------|---------|
| `shared/locale/types/dashboard/students/quota.ts` | Added 17+ new audience keys: `noQuotaAssigned`, `remainingOfTotal`, `validPeriod`, `recentLedgerEntries`, `noLedgerEntries`, `loadingData`, `selectChildPrompt`, `name`, `kind`, `remaining`, `totalClasses`, `status`, `validFrom`, `validUntil`, `delta`, `reason`, `ledgerDate`, `createdAt`, plus `statuses`, `kinds`, `ledgerReasons` sub-objects |
| `shared/locale/en/dashboard/students/quota.ts` | English translations for all new keys |
| `shared/locale/ar/dashboard/students/quota.ts` | Arabic translations for all new keys |

### Plan Files Updated

| File | Changes |
|------|---------|
| `.ai/plans/quota/ui/tasks.md` | Updated tasks 8.1, 8.2, 8.3, 8.4 and all sub-tasks (8.1.QL, 8.1.IV, etc.) from `[ ]` to `[x]` |

## Architecture Decisions

### StudentQuotaAudienceView
- Gets studentId from `useUserStore(s => s.user)?.id` (student's user ID IS their student ID in this system)
- Falls back to `meQueryDocument` if user store not yet populated
- Uses `studentQuotasQueryDocument` (not `quotaBalanceQueryDocument`) since it returns full quota rows for rendering balance cards
- Fetches ledger entries for the first quota (most relevant)
- Uses shared `QuotaBalanceCard` component for consistent rendering
- `formatDelta` helper avoids nested ternary lint violations

### ParentQuotaView
- Gets `parentId` from `useUserStore(s => s.user)?.parentId`
- Falls back to `meQueryDocument` if needed
- Uses MUI `Tabs` (scrollable, auto scroll buttons) for multi-child selection
- Each tab shows child avatar (28px) + name
- Selected child gets 48px avatar header + `ChildQuotaContent` sub-component
- `ChildQuotaContent` reuses the same data-fetching pattern as StudentQuotaView

### TeacherQuotaView
- Uses `teacherAssignedStudentsQueryDocument` — returns students with `classesRemaining` and `classesTotal`
- Each student gets a card showing remaining/total ratio and eligibility indicator
- Eligibility: `classesRemaining > 0` → eligible (CheckCircleOutlined, success color)
- Not eligible: `classesRemaining <= 0` → DoNotDisturbOutlined, error color
- All colors via `sx={theme => ({ color: theme.palette.success.main })}` — no hardcoded colors

### SupervisorQuotaView
- Uses `quotasQueryDocument` with client pagination (pageSize=10, fetching 50 rows)
- `AppDataGrid` with 8 columns: name, kind, status, totalClasses, remaining, validFrom, validUntil, createdAt
- Status breakdown cards: total count, active (success color), expired (error color), archived
- Column render functions use `StatusBadge` for kind and status columns
- `getQuotaKindLabel` and `getQuotaStatusLabel` from shared utils for i18n labels

## Verification Results

All 7 files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene):

```
✅ StudentQuotaView.tsx — All checks passed
✅ ParentQuotaView.tsx — All checks passed
✅ TeacherQuotaView.tsx — All checks passed
✅ SupervisorQuotaView.tsx — All checks passed
✅ quotaAudienceBalanceCard.tsx — All checks passed
✅ quotaAudienceHelpers.tsx — All checks passed
✅ quotaAudienceStatus.utils.ts — All checks passed
```

i18n files also passed:
```
✅ shared/locale/types/dashboard/students/quota.ts — All checks passed
✅ shared/locale/en/dashboard/students/quota.ts — All checks passed
✅ shared/locale/ar/dashboard/students/quota.ts — All checks passed
```

## Issues Encountered & Resolved

1. **Typography variants**: `bodySm`, `titleMd`, `headlineSm` don't exist in the theme typography config. Fixed by replacing with `bodyMd`, `titleLg`, `headlineMd` respectively.

2. **`||` and `??` mixing**: TypeScript error TS5076 when mixing `||` and `??` without parentheses. Fixed by wrapping the `??` expression in parentheses: `parentIdFromStore || (meData?.me?.parentId ?? "")`.

3. **Nested ternary**: SonarJS `no-nested-conditional` flagged `{entry.delta != null ? (entry.delta > 0 ? ... : ...) : ""}`. Fixed by extracting `formatDelta()` helper function.

4. **Duplicate imports**: ESLint `import-x/no-duplicates` flagged separate `import type` and `import` from `@mui/icons-material`. Fixed by combining into `import { type SvgIconComponent, WarningAmberOutlined }`.

5. **Optional chain preference**: ESLint `prefer-optional-chain` flagged `selectedChild != null && selectedChild.id != null`. Fixed by using `selectedChild?.id != null`.

6. **Status label hardcoding**: Initial `quotaAudienceStatus.utils.ts` had hardcoded "Active"/"Expired"/"Archived" strings. Fixed by adding `statuses`, `kinds`, and `ledgerReasons` i18n sub-objects to all 3 locale files and using switch-case to look up labels.

## Semantic Review Checklist

- [x] No dead branches — all conditional paths render meaningful content
- [x] No cross-layer imports — all imports follow `@/` path alias convention
- [x] All i18n strings typed — no hardcoded user-facing strings, all via `StudentQuotaLabels`
- [x] Loading states use `aria-busy` — `QuotaLoadingSkeleton` wraps content in `<Box component="output" aria-busy="true">`
- [x] Empty states use i18n keys — `noQuotaAssigned`, `noChildren`, `noData`, `noLedgerEntries`
- [x] GraphQL queries include `id` field — all use `QuotaFieldsFragment` which includes `id`
- [x] Apollo hooks from `@apollo/client/react` — not `@apollo/client`
- [x] No `oxlint-disable` comments — all lint issues fixed at root cause
- [x] No `console.*` — uses `logger` from `@/frontend/common/utils/logger`
- [x] No hardcoded colors — all via `sx={theme => ({ color: theme.palette.xxx })}`

## Carry-Forward Knowledge

### Pattern for New Audience Views
1. Use `useUserStore(s => s.user)` to get identity (id, parentId, role)
2. Fall back to `meQueryDocument` if store not populated
3. Use `useQuery` from `@apollo/client/react` with `skip` to avoid premature queries
4. Three render states: loading (`QuotaLoadingSkeleton`), empty (`QuotaEmptyState`), data (content)
5. Shared components in `__shared__/` keep each view <200 lines

### Teacher View Data Source
The `teacherAssignedStudentsQueryDocument` returns `TeacherAssignedStudent` with `classesRemaining` and `classesTotal` — these are equivalent to quota balance counts and are used for the eligibility indicator. No separate quota query is needed for the teacher view.

### Supervisor View Data Source
`quotasQueryDocument` requires both `filter` and `pagination` variables (both nullable but must be present). Client-side pagination with `pageSize: 10` and fetching 50 rows provides sufficient data for an audit overview.

### AppDataGrid Usage
```tsx
<AppDataGrid
  rows={quotas}
  columns={columns}
  loading={loading}
  emptyMessage={t.audience.noData}
  ariaLabel={t.audience.supervisorTitle}
  paginationOptions={{ mode: "client", pageSize: 10 }}
/>
```
The `paginationOptions` is required — use `{ mode: "client", pageSize: N }` for client-side pagination.

### Typography Variants Available
`display`, `headlineLg`, `headlineMd`, `titleLg`, `bodyLg`, `bodyMd`, `labelMd`, `labelSm`, `labelUppercase`, `buttonText`, `h1`, `h2`, `h3`, `body1`, `body2`, `caption`, `button`, `mono`

**Do NOT use**: `titleMd`, `bodySm`, `headlineSm` — these do not exist in the theme.

### Parent Multi-Child UX
MUI `Tabs` with `variant="scrollable"` and `scrollButtons="auto"` handles the multi-child case cleanly. Each tab can include an `icon` (Avatar) with `iconPosition="start"`. The tab index is clamped with `Math.min(selectedTab, children.length - 1)` to prevent out-of-bounds when children list changes.
