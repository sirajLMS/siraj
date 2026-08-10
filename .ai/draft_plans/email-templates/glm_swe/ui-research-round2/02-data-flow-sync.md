# Round 2 Audit — Data Flow & Sync Patterns

## Summary

Audited the v6 Frontend (§A-O, lines 781-1096) and i18n (§A-B, lines 1097-1187) sections of the email template plan against actual codebase Apollo/GraphQL precedents. **v6 contains zero Apollo cache policies, optimistic response definitions, pagination merge strategy, retry configuration, or real-time sync patterns** — these are critical data-flow omissions that will cause inconsistent UX and race conditions at runtime. The plan correctly identifies component structure and UI interactions but treats GraphQL as a pure transport layer rather than a cache-first sync system.

---

## Critical Gaps

### 1. No Apollo Cache Policies Specified (fetchPolicy, normalize, redirect)
- **Plan state**: §M (line 1076) only says "useQuery from @apollo/client/react, no useLazyQuery" — zero mention of `fetchPolicy`, cache normalization keys, or list→detail cache redirects.
- **Codebase precedent**: `useTeachersViewModel.ts:62` uses `fetchPolicy: "cache-and-network"`; 50+ other ViewModels use the same. The Apollo cache (`apolloCache.ts:10-22`) defines `merge: false` for `AdminDashboardScheduleResult.rows` but has **no typePolicies for `EmailTemplate` or `EmailTemplates`**.
- **Impact**: Without explicit `fetchPolicy`, list view uses Apollo default (`cache-first`) → stale data after mutations; detail view won't redirect from list cache without `typePolicies.EmailTemplates.fields.rows.read`/`merge` or a `cache.redirect` for `EmailTemplate:keyArgs`. Editor "Save Draft" then navigating back will show stale list.

### 2. Zero Optimistic Response Definitions
- **Plan state**: §D (lines 916-922) describes Save Draft / Publish / Archive / Send Test UI but has **no `optimisticResponse`**, no `update` cache functions, no rollback strategy.
- **Codebase precedent**: **No optimistic responses exist anywhere in the codebase** (grep `optimisticResponse` → 0 results). Mutations use `refetchQueries` arrays (e.g., `useSubjectMutations.ts:46-53`) — full refetch on every write. This is the established pattern but causes flicker and 1-2s perceived latency.
- **Impact**: User clicks "Save Draft" → waits for round-trip → toast appears. No instant UI feedback. If mutation fails, no automatic UI rollback (toast error only).

### 3. Pagination Strategy Undefined (cursor vs offset, merge, filter reset)
- **Plan state**: §C (lines 886, 862) mentions `ListPaginationOptions` (10/25/50) and `pageSize` stored in Zustand, but **no GraphQL pagination spec** (Relay cursor? offset/limit? `first`/`after`? `page`/`perPage`?).
- **Codebase precedent**: `teacherDirectoryQueryDocument` (line 42-68) uses `paginationArgs: { first, page, skip, after, before, last, maxCount }` — **hybrid offset+cursor**. `StudentDirectory` query (student-directory.documents.ts:38-68) returns `pageInfo { count, currentPage, hasMorePages, lastPage, perPage, total }` — classic offset pagination. **No `merge` function** in cache for paginated lists; `apolloCache.ts` only has `merge: false` for `AdminDashboardScheduleResult.rows`.
- **Impact**: Email templates list pagination will use whatever the backend returns (likely offset). Filter change must reset to page 1 — not specified. No cache merge → page 2 data won't combine with page 1 on refetch.

### 4. Refetch Policies After Mutations — Only `refetchQueries` Arrays
- **Plan state**: §D mentions "Confirm dialog → archive" etc. but no refetch policy. §M says "Apollo hooks useQuery".
- **Codebase precedent**: All mutations use `refetchQueries: [queryDocument]` (see `useSubjectMutations.ts:46-53`, `usePermissionMutations.ts:80-88`). **Background refetch on window focus** exists as a reusable hook (`useRefetchOnWindowFocus.ts:1-18`) but is **only used in billing views** (grep shows 2 usages). Not applied to list/editor views universally.
- **Impact**: After Save/Publish/Archive, list view refetches correctly (via `refetchQueries`), but editor detail view won't auto-refresh unless it also uses `refetchQueries` on its detail query. No focus-refetch → stale editor if tab backgrounded during auto-save.

### 5. No Stale-While-Revalidate (SWR) Strategy
- **Plan state**: §B (lines 852-856) specifies skeletons + `<Suspense fallback>` + `ErrorState` with "Retry" button wired to `refetch`. No mention of `fetchPolicy: "cache-and-network"` or `nextFetchPolicy`.
- **Codebase precedent**: `useTeachersViewModel.ts:62` uses `cache-and-network` (shows cached instantly, refetches in background). `useStudentDashboardViewModel.ts` (3 occurrences) and `useAdminBillingViewModel.ts` (3 occurrences) also use it. **No ViewModel uses `nextFetchPolicy`**.
- **Impact**: List view with `cache-first` (default) shows stale data until manual refetch. Editor view needs `cache-and-network` to show last-saved draft immediately while fetching server version.

### 6. No Error Retry Policy / Apollo Retry Link
- **Plan state**: §B line 856 mentions "Retry" button → `refetch`. §F line 948 mentions rate-limit inline error. **No Apollo-level retry**, no bounded retries, no user-facing retry for transient network errors.
- **Codebase precedent**: **Zero `RetryLink` or `retryAttempts` config** in Apollo client (`AppApolloProvider.tsx:41-64`). The error link (`apollo.utils.ts:299-325`) handles auth recovery + network connectivity notification only. No automatic retry for `NETWORK_ERROR` / `TIMEOUT`. Manual "Retry" button in `ErrorState` is the only retry mechanism.
- **Impact**: Transient network blip → red error screen → user must click Retry. No exponential backoff, no silent retry.

### 7. No Real-Time / subscribeToMore / Polling / Conflict Resolution
- **Plan state**: §D (line 922) has History Drawer with "Restore" button — purely manual. No mention of live updates when another admin publishes same template.
- **Codebase precedent**: **Zero `subscribeToMore`, `useSubscription`, or `pollInterval`** in any ViewModel (grep → 0 results). The closest is `useFxLiveRefresh.ts` (custom hook) and billing poll interval hook — both are manual polling, not GraphQL subscriptions.
- **Impact**: Two admins editing same template → last write wins silently. No "someone else published v4, refresh?" toast. No auto-merge.

---

## High-Priority Gaps

### 8. Send Test Data Flow — Cache Reset Behavior Unspecified
- **Plan state**: §F (lines 943-951) describes Send Test dialog with `sendTestEmail` mutation, `sampleProps` JSON, rate-limit notice.
- **Codebase precedent**: Mutations use `useMutation` hook (not `client.mutate`). `useManualInvoiceViewModel.ts:141-177` shows pattern: `useMutation` with `onCompleted`/`onError` callbacks setting Zustand flags. **No mutation uses `optimisticResponse` or cache `update`**.
- **Gap**: Plan does not specify:
  - Whether `sendTestEmail` mutation should invalidate `previewEmailTemplate` cache
  - Whether `sampleProps` location is passed as mutation variable or read from store at call time
  - Whether successful send should clear `sampleProps` in Zustand or keep for retry
- **Impact**: Inconsistent handling of test-email state vs editor state.

### 9. Merge-Tag Introspection — Static List vs Dynamic Query Caching
- **Plan state**: §D (lines 912-915) describes `VariableMentionPicker` listing `Props` keys from `EmailPropsByScope` as "lawful insert tokens". No GraphQL query mentioned.
- **Codebase precedent**: `useAudienceAutocomplete.ts` uses a GraphQL query (`searchTeacherAvailabilityQueryDocument` or similar) with `useQuery` for dynamic autocomplete. **No static enum-list pattern** exists for merge-tag-like data.
- **Gap**: Should merge tags come from a GraphQL query (cached, searchable) or a static client-side map? If GraphQL, need a `mergeTagIntrospectionQueryDocument` in `email.documents.ts` with proper caching. If static, must be in a shared constants file, not in the store.
- **Impact**: Editor merge-tag picker will either not work (no data source) or be hardcoded and diverge from backend scope definitions.

### 10. Zustand UI Store vs Apollo Cache Delineation — ViewModel Hook Pattern
- **Plan state**: §O (line 1093-1095) mentions `emailTemplateEditorStore.ts` holding "filters, dialog open, locale/version selector, segmented control, sort, dirty flag, sampleProps". Says "NO `File`/`Blob` in persist-enabled stores; keep non-serializable editor refs in `useRef` inside ViewModel".
- **Codebase precedent**: `manualInvoiceUiStore.ts` (lines 10-40) — holds `selectedParentId`, `isSubmitting`, `showSuccess`, `reset()`. `useManualInvoiceViewModel.ts` holds `useForm` control, `useWatch` values, `useMutation` callbacks, and `useRef` for file objects. **Pattern: Zustand = serializable UI state only; ViewModel = Apollo hooks + form control + refs**.
- **Gap**: Plan doesn't define which fields live in Apollo cache vs Zustand:
  - `designJson` (huge JSON) → should be in `useRef` or Apollo cache (detail query), NOT Zustand
  - `isDirty` → Zustand (correct)
  - `version` / `lastEdited` → Apollo cache (from detail query)
  - `sampleProps` → Zustand (transient, editable) or `useRef`
- **Impact**: Without explicit delineation, implementers will put `designJson` in Zustand → breaks persistence + devtools.

---

## Medium-Priority Gaps

### 11. List View `fetchPolicy` Not Specified Per Filter/Page Change
- Plan assumes `ListPaginationOptions` in Zustand drives pagination but doesn't specify `fetchPolicy: "cache-and-network"` on the list query, nor `nextFetchPolicy: "cache-first"` for subsequent pages.

### 12. Editor Detail Query Cache Redirect from List Not Defined
- No `typePolicies.EmailTemplate` with `keyArgs: ["id"]` or `cache.redirects` to read single template from list cache. Editor will re-fetch on mount even if list already has data.

### 13. No `context: { fetchOptions: { nextFetchPolicy } }` for Background Refetch After Mutation
- `refetchQueries` triggers full network request. Could use `await refetchQueries({ include: "active" })` with `fetchPolicy: "network-only"` for forced refresh, but not documented.

### 14. History Drawer Version Query Not Specified
- §D line 922 says "History drawer listing prior versions by version integer". No GraphQL document for `templateVersions(templateId)` query, no caching strategy (should be `cache-first`, rarely changes), no pagination.

### 15. Preview Tab `previewEmailTemplate` Query Cache Policy
- §E line 932-937: iframe `srcDoc` from compiled HTML. GraphQL query `previewEmailTemplate` accepts `sampleProps`. No `fetchPolicy` specified. Should be `network-only` (always fresh render) or `cache-and-network` with short TTL.

---

## Low-Priority Gaps / Nice-to-haves

### 16. Partial Cache Updates for List Mutations (Archive/Restore)
- Instead of `refetchQueries: [EmailTemplatesQueryDocument]`, could use `update` function to splice/remove item from cached list array → instant UI, no refetch flash. Not done anywhere in codebase but worth considering for v7.

### 17. Optimistic `version` Increment on Save Draft
- Editor shows "v3" badge (§D line 907). Could optimistically increment version in cache on Save Draft, rollback on error. Currently no precedent.

### 18. Debounced Auto-Save Cache Write
- Plan mentions Ctrl+S save. Could add auto-save every 30s → write to Apollo cache (`client.writeQuery`) without mutation, full save on explicit action. No precedent.

### 19. Merge Tag Query with `@defer` for Large Scope Prop Lists
- If scope has 100+ merge tags, `@defer` could stream them. Not in current codegen config.

---

## Verified Items (Plan Matches Codebase Conventions)

| Item | Plan Reference | Codebase Verification |
|------|----------------|----------------------|
| `useQuery` only, no `useLazyQuery` | §M line 1076 | `frontend/AGENTS.md:29` + all ViewModels |
| Import from `@apollo/client/react` | §M line 1076 | All ViewModels: `import { useQuery } from "@apollo/client/react"` |
| `id` in all selection sets | §M line 1073 | `sharedDocuments/AGENTS.md:106` + all `.documents.ts` |
| `TypedDocumentNode` with generated types | §M line 1070 | `sharedDocuments/AGENTS.md:85-96` pattern |
| `refetchQueries` array on mutations | §D implicit | `useSubjectMutations.ts:46`, `usePermissionMutations.ts:83` |
| Zustand for UI state (survives tier switch) | §O line 1094 | `frontend/views/AGENTS.md:14`, all `*Store.ts` |
| `File`/`Blob` in `useRef`, not Zustand | §O line 1095 | `manualInvoiceUiStore.ts` + `useManualInvoiceViewModel.ts` |
| `cache-and-network` fetchPolicy | — | `useTeachersViewModel.ts:62` + 50 other files |
| `useRefetchOnWindowFocus` hook exists | — | `frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus.ts` |
| Error link handles auth recovery + connectivity | — | `apollo.utils.ts:102-325` |
| `createApolloCache` with `merge: false` for paginated rows | — | `apolloCache.ts:10-22` |
| PersistedQueryLink + HttpLink + AuthLink chain | — | `AppApolloProvider.tsx:42-57` |
| `createLazyView` + `ResponsiveViewSwitch` for tier split | §A lines 788-803 | `frontend/views/AGENTS.md:17-22` |
| `EmailEditorWrapper` with `next/dynamic({ ssr: false })` | §A lines 805-818 | Plan-specific (new pattern, TipTap requires it) |

---

## Codebase Precedents Referenced

1. **Apollo Cache Config**: `frontend/common/providers/apollo/apolloCache.ts` — only `AdminDashboardScheduleResult.rows: merge: false`
2. **Apollo Provider + Links**: `frontend/common/providers/apollo/AppApolloProvider.tsx` — AuthLink, ConnectivityLink, ErrorLink, PersistedQueryLink, HttpLink; `defaultOptions: { watchQuery: { errorPolicy: "none", notifyOnNetworkStatusChange: true } }`
3. **List ViewModel with Pagination**: `frontend/common/views/dashboard/teachers/home/useTeachersViewModel.ts` — `fetchPolicy: "cache-and-network"`, offset pagination via `paginationArgs`, Zustand store for page/pageSize/search
4. **Mutation Hook with refetchQueries**: `frontend/common/views/dashboard/subjects/home/useSubjectMutations.ts` — `useMutation` + `refetchQueries: [classCategoriesQueryDocument]`
5. **Permission Mutation Pattern**: `frontend/common/views/dashboard/permissions/usePermissionManagementData.ts` — `refetchQueries` on all write mutations, `runMutation` wrapper with toast notifications
6. **Manual Invoice ViewModel (Form + Mutation)**: `frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel.ts` — `react-hook-form` + `zod` + `useMutation` + Zustand UI store + `useRef` for files
7. **Manual Invoice UI Store**: `frontend/common/stores/manualInvoiceUiStore.ts` — serializable state only, `reset()` method
8. **Refetch on Focus Hook**: `frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus.ts` — 18-line hook, used in 2 billing ViewModels
9. **Student Directory Query (Offset Pagination)**: `frontend/common/graphql/sharedDocuments/students/student-directory.documents.ts` — `pageInfo` with `total`, `hasMorePages`, `currentPage`
10. **Error Link (Auth Recovery + Network)**: `frontend/common/providers/apollo/utils.ts:299-325` — handles UNAUTHENTICATED via refreshToken, FORBIDDEN no-redirect, NETWORK_ERROR → connectivity context

---

## Recommended v7 Plan Edits

### §M GraphQL Documents (lines 1067-1096) — ADD:
```markdown
**Apollo Cache TypePolicies** (add to `createApolloCache()` in `apolloCache.ts`):
```ts
typePolicies: {
  EmailTemplate: {
    keyArgs: ["id"],
    fields: {
      designJson: { merge: false }, // full replace
      compiledHtml: { merge: false },
      version: { merge: false },
    },
  },
  EmailTemplates: {
    keyArgs: ["scope", "locale", "status", "search"],
    fields: {
      rows: {
        merge(existing, incoming, { args }) {
          if (!args?.paginationArgs?.page || args.paginationArgs.page === 1) {
            return incoming; // page 1 replaces
          }
          return [...(existing || []), ...incoming]; // append subsequent pages
        },
      },
      totalCount: { merge: false },
      pageInfo: { merge: false },
    },
  },
}
```

**Fetch Policies**:
- List query (`EmailTemplatesQueryDocument`): `fetchPolicy: "cache-and-network"`
- Detail query (`EmailTemplateQueryDocument`): `fetchPolicy: "cache-and-network"`
- Preview query (`PreviewEmailTemplateQueryDocument`): `fetchPolicy: "network-only"` (always fresh HTML)
- Versions query (`EmailTemplateVersionsQueryDocument`): `fetchPolicy: "cache-first"` (immutable history)

**Cache Redirect**: `EmailTemplate: { __typename: "EmailTemplate", id: string }` read from `EmailTemplates.rows` via `cache.modify` or typePolicy `read`.
```

### §D Editor View (lines 891-927) — ADD Optimistic Responses:
```markdown
**Optimistic Response Definitions** (add to each mutation in `email.documents.ts`):
- `Save Draft (EmailTemplateUpsertMutationDocument)`:
  ```ts
  optimisticResponse: (vars) => ({
    emailTemplateUpsert: {
      __typename: "EmailTemplate",
      id: vars.input.id || "temp-" + Date.now(),
      designJson: vars.input.designJson,
      version: (vars.input.version || 0) + 1,
      status: "DRAFT",
      lastEdited: new Date().toISOString(),
      // ... other required fields
    },
  }),
  update: (cache, { data }) => {
    // Update detail cache
    cache.modify({ id: cache.identify(data.emailTemplateUpsert), fields: { designJson: () => data.emailTemplateUpsert.designJson } });
    // Prepend/replace in list cache
  },
  rollbackUpdate: (cache) => { /* restore previous designJson from cache snapshot */ }
  ```
- `Publish (PublishEmailTemplateMutationDocument)`: optimistic status → `PUBLISHED`, archive previous published in list cache
- `Archive (ArchiveEmailTemplateMutationDocument)`: optimistic status → `ARCHIVED`, move row to archived segment
- `Send Test (SendTestEmailMutationDocument)`: no cache change; only toast on success
```

### §C List View (lines 858-889) — ADD Pagination Spec:
```markdown
**Pagination Strategy**:
- GraphQL: `paginationArgs: { first: pageSize, page: pageNumber, skip: null, after: null }` (offset-style matching `teacherDirectoryQueryDocument`)
- Response: `pageInfo { totalCount, currentPage, hasMorePages, perPage }` (matching `StudentDirectory`)
- Filter change → `setPage(0)` in Zustand store (reset to page 1)
- Cache merge function as defined in `apolloCache.ts` typePolicies above
```

### §M — ADD Error Retry Policy:
```markdown
**Apollo Retry Link** (add to `AppApolloProvider.tsx` link chain):
```ts
import { RetryLink } from "@apollo/client/link/retry";
const retryLink = new RetryLink({
  attempts: { max: 3, exponential: true, minTimeout: 1000 },
  retryIf: (error) => error?.networkError !== null && !error?.graphQLErrors?.some(e => e.extensions?.code === "RATE_LIMITED"),
});
// Insert before HttpLink
```
**User-facing Retry**: `ErrorState` component already has "Retry" button → calls `refetch()` from `useQuery` result. Keep this pattern.
```

### §D/E/F — ADD Stale-While-Revalidate:
```markdown
**Editor Detail Query**: `fetchPolicy: "cache-and-network"` → shows last-saved draft instantly, refreshes from server in background
**List Query**: `fetchPolicy: "cache-and-network"` → shows cached rows while refetching
**Preview Query**: `fetchPolicy: "network-only"` → always fresh compiled HTML
**History/Versions Query**: `fetchPolicy: "cache-first"` → immutable, rarely changes
```

### §D — ADD Refetch on Focus:
```markdown
**Import `useRefetchOnWindowFocus`** in both `useEmailTemplatesListViewModel.ts` and `useEmailTemplateEditorViewModel.ts`:
```ts
const { refetch } = useQuery(EmailTemplatesQueryDocument, ...);
useRefetchOnWindowFocus(refetch);
```
```

### §N/O — ADD Store/Cache Delineation Table:
```markdown
**Zustand (`emailTemplateEditorStore.ts`)** — serializable UI state only:
- `isDirty: boolean`
- `selectedScope: EmailScope | null`
- `selectedLocale: string`
- `activeTab: "design" | "preview" | "code"`
- `historyDrawerOpen: boolean`
- `sendTestDialogOpen: boolean`
- `sendTestSampleProps: string` (JSON text)
- `sortConfig: { field: "name" | "lastEdited"; direction: "asc" | "desc" }`
- `filters: { scope: EmailScope[]; status: EmailTemplateStatus[]; locale: string[]; viewMode: "active" | "archived" | "all" }`

**Apollo Cache** — server-authoritative data:
- `EmailTemplate` entity (detail): `designJson`, `compiledHtml`, `compiledText`, `version`, `status`, `lastEdited`, `scope`, `locale`, `displayName`, `slug`, `defaultSubject`, `defaultFromEmail`, `allowedEditorGroups`, `attachmentRules`
- `EmailTemplates` list: `rows[]`, `totalCount`, `pageInfo`

**ViewModel `useRef`** — non-serializable ephemeral:
- `editorRef: React.RefObject<EmailEditorRef>`
- `fileRefs: Map<string, File>` (attachments/inline images)
- `autoSaveTimeout: NodeJS.Timeout | null`
```

### §F Send Test — CLARIFY Data Flow:
```markdown
**Send Test Mutation Variables**:
```ts
sendTestEmailMutation({
  variables: {
    templateId: editorData.id,
    to: toEmail,
    sampleProps: JSON.parse(sendTestSampleProps), // from Zustand string state
    locale: selectedLocale,
  },
})
```
- On success: toast, keep `sampleProps` in Zustand for retry
- On rate-limit: inline error, do NOT close dialog
- No cache invalidation needed (send-test is side-effect only)
```

### §D Merge Tags — DEFINE Source:
```markdown
**Option A (Recommended): GraphQL Query + Cache**
Add `mergeTagIntrospectionQueryDocument` to `email.documents.ts`:
```graphql
query mergeTagIntrospection($scope: EmailScope!) {
  mergeTagIntrospection(scope: $scope) {
    fieldName
    fieldLabel
    fieldType
    description
    exampleValue
  }
}
```
- `fetchPolicy: "cache-first"` (static per scope, rarely changes)
- `VariableMentionPicker` uses `useQuery` with scope variable
- Preload on editor mount via `useQuery` in ViewModel

**Option B (If backend doesn't support): Static constants file** at `frontend/common/views/dashboard/email-templates/constants/mergeTagsByScope.ts`
```

---

*End of audit. All findings verified against actual codebase files as cited above.*
