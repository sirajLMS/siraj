# WhatsApp UI/UX Improvement — Design Document

## Document Information

- **Feature Name**: WhatsApp UI/UX Improvements
- **Target Directory**: `.ai/plans/whatsapp/ui-spec`
- **Outcome Directory**: `.ai/plans/whatsapp/ui-spec/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Copilot CLI
- **Related Documents**:
  - Requirements: `.ai/plans/whatsapp/ui-spec/specs.md`
  - Tasks: `.ai/plans/whatsapp/ui-spec/trackable-tasks.md`
  - Parent plan: `.ai/plans/whatsapp/` (do NOT modify)

## Overview

This design document specifies how to transform the WhatsApp settings page from its current state (functional but incomplete) to a production-ready, fully-featured UI. The design builds on the existing 4-tier architecture (page → container → configView → platformView → layout → tabs) and migrates from Pattern B (state-only tabs) to **client-side tab URL sync** (URL-synced tabs via a pure client hook `useWhatsappTab`, NOT server-side Pattern A).

The design covers: component architecture, data flow, state management, ViewModel changes, GraphQL document additions, i18n wiring, shared component adoption, animation specifications, mobile/desktop variants, route boundaries (loading/error), and testing strategy.

### Design Goals
- **Production readiness**: All forms functional, all data persisted, all i18n keys wired, all states handled
- **User experience**: Smooth transitions, clear feedback, accessible, responsive
- **Maintainability**: Use shared components, no dead code, clean architecture
- **Testability**: High ViewModel + component test coverage
- **Mobile parity**: Full admin CRUD on mobile (reverses v1 read-only decision)

### Key Design Decisions

### Decision: Migrate to Client-Side Tab URL Sync
**Context:** WhatsApp currently uses Pattern B (useState for activeTab). The main Settings page uses URL-synced tabs via `useSearchParams` + `router.replace` (sometimes called "Pattern A" in research) and supports deep-linking. This plan adopts a **pure client-side hook** (`useWhatsappTab` built on `useSearchParams`/`useRouter`) rather than the server-side `searchParams` reads that research labelled "Pattern A" — making it a deliberate Pattern B-refinement (client-side `useSearchParams`), not a true server-side Pattern A.
**Options Considered:**
1. Keep Pattern B, add workaround for deep-linking — Pros: minimal change / Cons: inconsistent with app patterns, no deep-linking
2. Client-side URL sync via `useWhatsappTab` — Pros: deep-linking, per-tab Suspense/RequirePermission, consistency / Cons: moderate refactor effort
**Decision:** Adopt client-side tab URL sync (Pattern B client-side useSearchParams)
**Rationale:** Deep-linking is a user requirement (UI-REQ-4). Per-tab Suspense enables independent loading. Per-tab RequirePermission enables fine-grained access control. Server reads of `searchParams` are NOT used — the URL is read purely client-side, so this stays compatible with the existing component tree.

### Decision: Reversal of Mobile Read-Only
**Context:** The parent plan intentionally made mobile Numbers tab read-only in v1. Research and follow-up review show admin users need full CRUD on mobile. (Note: earlier drafts of this plan cited a "Q10" spec code from the parent plan — that citation was incorrect, as no such code exists in the parent plan or canonical docs; see `.ai/analysis/whatsapp/discrepancies.md` D4.)
**Options Considered:**
1. Keep mobile read-only — Pros: minimal effort / Cons: mobile admins cannot manage accounts
2. Full mobile CRUD with dialogs — Pros: parity, production-ready / Cons: more components
**Decision:** Full mobile CRUD
**Rationale:** UI-REQ-12 requires mobile/desktop parity. Admin users should manage WhatsApp from any device. MUI Dialog fullScreen on small viewports handles mobile dialogs cleanly.

### Decision: No Zustand Store for WhatsApp
**Context:** The parent plan (Q2) intentionally omitted a Zustand store for WhatsApp. State lives in the ViewModel hook.
**Options Considered:**
1. Add Zustand store for tab state survival — Pros: tab state survives tier switching / Cons: deviates from Q2 decision
2. Keep state in ViewModel hook — Pros: consistent with Q2, simpler / Cons: tab state resets on remount
**Decision:** Keep state in ViewModel hook (no Zustand)
**Rationale:** URL-synced tabs (client-side URL sync) solve the tab state survival problem — the URL IS the persistent state. No Zustand needed.

### Decision: Use MUI theme.transitions, Not framer-motion
**Context:** framer-motion is in package.json but only used by MetricCard count-up. No view/page uses it.
**Options Considered:**
1. Use framer-motion for tab transitions — Pros: declarative animations / Cons: heavy dependency for minimal benefit
2. Use MUI theme.transitions — Pros: lightweight, consistent, no new dependency / Cons: less expressive
**Decision:** Use MUI theme.transitions
**Rationale:** Subtle 200ms fade-in transitions are sufficient for tab switches. No need for framer-motion's expressiveness. Keeps bundle size minimal.

### Decision: Replace Custom Snackbar with Shared Snackbars
**Context:** WhatsApp uses a custom `NumbersSnackbar` component with `WhatsappSnackbarState`. The app has canonical `FormSuccessSnackbar` and `FormErrorSnackbar` components.
**Options Considered:**
1. Keep custom NumbersSnackbar — Pros: no change / Cons: diverges from app pattern
2. Replace with FormSuccessSnackbar + FormErrorSnackbar — Pros: consistent, maintained, tested / Cons: ViewModel snackbar state refactor
**Decision:** Replace with shared snackbars
**Rationale:** Consistency with app patterns. Shared snackbars handle positioning, auto-hide, and accessibility. ViewModel exposes `snackbarMessage` and `snackbarSeverity`; the container renders the appropriate shared snackbar.

## Architecture Overview

### Current Architecture (4-Tier)
```
app/(dashboard)/settings/whatsapp/page.tsx      [Server Component, permission gate]
  └─ WhatsappSettingsContainer.tsx              [Client, RequirePermission]
      └─ WhatsappConfigView.tsx                 [Client, activeTab=useState, createLazyView ssr:false]
          ├─ WhatsappConfigMobileView.tsx        [Mobile platform view]
          └─ WhatsappConfigDesktopView.tsx      [Desktop platform view]
              └─ WhatsappConfigLayout.tsx        [Shared MUI Tabs bar]
                  ├─ NumbersTab.{platform}.tsx
                  ├─ TemplatesTab.{platform}.tsx
                  └─ OptInTab.{platform}.tsx
                        └─ shared/*Content.tsx  [Tab content components]
```

### Target Architecture (Client-Side Tab URL Sync)
```
app/(dashboard)/settings/whatsapp/
  page.tsx                                       [Server Component, permission gate, metadata]
  loading.tsx                                    [NEW: Route-level skeleton]
  error.tsx                                      [NEW: Route-level error boundary]
  └─ WhatsappSettingsContainer.tsx              [Client, RequirePermission, reads ?tab= from URL]
      └─ WhatsappConfigView.tsx                 [Client, client-side useSearchParams tab sync — NOT server-side Pattern A]
          ├─ WhatsappTabNav                     [NEW: GenericTabNav via ResponsiveViewSwitch]
          └─ WhatsappTabPanels                   [NEW: Per-tab Suspense + RequirePermission]
              ├─ <Suspense fallback={NumbersSkeleton}>
              │     <RequirePermission permissions={AppPermission.WHATSAPP_VIEW}>
              │       <NumbersTabContent />
              │     </RequirePermission>
              │   </Suspense>
              ├─ <Suspense fallback={TemplatesSkeleton}>
              │     <RequirePermission permissions={AppPermission.WHATSAPP_TEMPLATES_MANAGE}>
              │       <TemplatesTabContent />
              │     </RequirePermission>
              │   </Suspense>
              └─ <Suspense fallback={OptInSkeleton}>
                    <RequirePermission permissions={AppPermission.WHATSAPP_VIEW}>
                      <OptInTabContent />
                    </RequirePermission>
                  </Suspense>
```

### Component Architecture Changes

#### Files to Create
| File | Purpose |
|---|---|
| `app/(dashboard)/settings/whatsapp/loading.tsx` | Route-level loading skeleton |
| `app/(dashboard)/settings/whatsapp/error.tsx` | Route-level error boundary |
| `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabNav.tsx` | Generic tab navigation component |
| `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx` | Per-tab Suspense panels with RequirePermission |
| `frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/CreateAccountDialog.tsx` | Create account form dialog (shared) |
| `frontend/common/views/dashboard/settings/whatsapp/editNameDialog/EditNameDialog.tsx` | Edit name form dialog (shared) |
| `frontend/common/views/dashboard/settings/whatsapp/whatsappTabUrl.ts` | URL tab helper (resolve/validate tab from searchParams) |
| `frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge.tsx` | WhatsApp status badge config for StatusBadge component |
| `frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation.ts` | Form validation functions (token, PIN, displayName, phoneNumberId, wabaId) |
| `frontend/common/views/dashboard/settings/whatsapp/whatsappQualityLabel.ts` | Helper: map quality enum → i18n key |
| `frontend/common/views/dashboard/settings/whatsapp/whatsappTierLabel.ts` | Helper: map tier enum → i18n key |
| `frontend/common/views/dashboard/settings/whatsapp/whatsappTemplateStatusLabels.ts` | Helper: map template status enum → i18n key |
| `frontend/common/views/dashboard/settings/whatsapp/whatsappThroughputLabel.ts` | Helper: map `WhatsappThroughputLevel` enum → i18n key (per `docs/frontend/whatsapp-ui-patterns.md:107-115`; 4th of four label helpers) |
| `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts` | MODIFY — add `whatsappTemplatesQueryDocument` (persisted templates) ⚠️ Backend resolver does not exist yet — must be created first or use sync mutation snapshot |
| `test/ui/components/whatsappCreateAccountDialog.test.tsx` | Create account dialog tests |
| `test/ui/components/whatsappEditNameDialog.test.tsx` | Edit name dialog tests |
| `test/ui/components/whatsappCredentialDialogs.test.tsx` | Credential dialog validation tests |
| `test/ui/components/whatsappDeleteConfirmDialog.test.tsx` | Delete confirmation dialog tests |
| `test/ui/components/whatsappTemplatesTab.test.tsx` | Templates tab render + sync tests |
| `test/ui/components/whatsappOptInTab.test.tsx` | Opt-in tab render + toggle tests |
| `test/ui/components/whatsappMobileParity.test.tsx` | Mobile CRUD parity tests |
| `test/ui/components/whatsappUrlTabNav.test.tsx` | URL tab navigation tests |

#### Files to Modify

> **Admin-only features wrapper:** All admin-only affordances — the create account dialog (CreateAccountDialog), the delete account action, the edit-credentials token/PIN dialogs, and the consolidated admin opt-in history view — MUST be wrapped in `<RequirePermission permissions={AppPermission.WHATSAPP_CONFIG_MANAGE}>`. These sections are gated independently from the page-level `WHATSAPP_VIEW` gate so that staff with only `WHATSAPP_VIEW` (or non-admin roles that still reach the Settings page) cannot invoke mutating admin actions even if the tab content itself renders.

| File | Changes |
|---|---|
| `whatsapp.documents.ts` | ADD `whatsappTemplatesQueryDocument` and `whatsappOptInAuditQueryDocument` (camelCase exported constants — see naming note in GraphQL section) |
| `useWhatsappSettingsViewModel.ts` | Wire create/update mutations, add per-row loading states, add form validation, refactor snackbar to shared pattern, expose `deleting`, `creating` (boolean), `updating` |
| `WhatsappConfigView.tsx` | Migrate from useState to useSearchParams for tab state, drop ssr:false, use WhatsappTabNav + WhatsappTabPanels |
| `WhatsappConfigLayout.tsx` | Replace MUI Tabs with GenericTabNav; or repurpose as skeleton provider |
| `whatsappConfig.constants.ts` | Add TAB_PERMISSIONS mapping, TAB_URL_VALUES |
| `whatsappConfig.desktop.tsx` | Remove (replaced by WhatsappTabPanels + per-tab lazy loading) |
| `whatsappConfig.mobile.tsx` | Remove (replaced by WhatsappTabPanels + per-tab lazy loading) |
| `tabs/shared/NumberCard.tsx` | Replace raw enum values with localized labels (qualityLabel, tierLabel helpers), add coexistence/unverified warnings, use StatusBadge |
| `tabs/shared/OptInTabContent.tsx` | Add non-admin history table, filters, bulk actions; wrap the admin consolidated view in `<RequirePermission permissions={AppPermission.WHATSAPP_CONFIG_MANAGE}>` |
| `tabs/shared/TemplatesTabContent.tsx` | Use persisted templates query (⚠️ backend resolver does not exist — create first or use sync mutation snapshot), add body preview, use template status labels, add error/retry state |
| `tabs/shared/statusChipColor.ts` | Add PAUSED, PENDING_DELETION, DISABLED cases; or deprecate in favor of whatsappStatusBadge config |
| `tabs/components/NumbersSnackbar.tsx` | Deprecate/replace with FormSuccessSnackbar + FormErrorSnackbar in container |
| `tabs/whatsappTabSharedProps.ts` | Update with new ViewModel properties (creating, deletingId, updatingId, validation functions) |
| `types/whatsappSettingsTypes.ts` | Activate dead types (WhatsappAccountFormValues, ApiFormValues, CredentialFormValues) with validation |
| `frontend/desktop/.../NumbersTab.desktop.tsx` | Add "Add Account" button + CreateAccountDialog (wrapped in `<RequirePermission permissions={AppPermission.WHATSAPP_CONFIG_MANAGE}>`), wire EditNameDialog, pass account name to DeleteConfirmDialog, add per-row loading |
| `frontend/desktop/.../TemplatesTab.desktop.tsx` | Use AppDataGrid with expandable rows for template body preview |
| `frontend/desktop/.../OptInTab.desktop.tsx` | Add admin consolidated table view (wrapped in `<RequirePermission permissions={AppPermission.WHATSAPP_CONFIG_MANAGE}>`), add non-admin history table |
| `frontend/mobile/.../NumbersTab.mobile.tsx` | Add full CRUD: action menu (Bottom Sheet), credential dialogs (edit token/PIN wrapped in `<RequirePermission permissions={AppPermission.WHATSAPP_CONFIG_MANAGE}>`), delete confirmation (wrapped in `<RequirePermission permissions={AppPermission.WHATSAPP_CONFIG_MANAGE}>`), create account (wrapped in `<RequirePermission permissions={AppPermission.WHATSAPP_CONFIG_MANAGE}>`), per-row loading |
| `frontend/mobile/.../TemplatesTab.mobile.tsx` | Use MobileCardList with expandable cards for template body preview |
| `frontend/mobile/.../OptInTab.mobile.tsx` | Add non-admin history table (mobile card format), admin consolidated list (wrapped in `<RequirePermission permissions={AppPermission.WHATSAPP_CONFIG_MANAGE}>`) |
| `shared/locale/types/whatsapp/index.ts` | Add new keys for create/edit form labels, validation messages, delete confirm with interpolation, permission denied, retry, error boundary |
| `shared/locale/en/whatsapp/index.ts` | Implement new keys in English |
| `shared/locale/ar/whatsapp/index.ts` | Implement new keys in Arabic |

> **Additional AGENTS.md**: `frontend/common/components/ui/AGENTS.md` applies to tasks touching shared UI components (StatusBadge, FormSuccessSnackbar, FormErrorSnackbar, AppDataGrid, ResponsiveViewSwitch).

## UX/Navigation Specification (REQUIRED)

### Route Table

| Route | Type | Purpose | Permission | Suspense | Error Boundary |
|---|---|---|---|---|---|
| `/settings/whatsapp` | Server | WhatsApp settings page (default tab) | `WHATSAPP_VIEW` (page gate) | loading.tsx | error.tsx |
| `/settings/whatsapp?tab=numbers` | Client-synced | Numbers tab | `AppPermission.WHATSAPP_VIEW` (per-tab guard — view is the least-privileged entry; CRUD gating is component-level) | NumbersSkeleton | per-tab error |
| `/settings/whatsapp?tab=templates` | Client-synced | Templates tab | `AppPermission.WHATSAPP_TEMPLATES_MANAGE` (per-tab guard) | TemplatesSkeleton | per-tab error |
| `/settings/whatsapp?tab=optin` | Client-synced | Opt-in tab | `AppPermission.WHATSAPP_VIEW` (per-tab guard — least-privileged, user-facing) | OptInSkeleton | per-tab error |

### Sidebar Integration
WhatsApp Settings remains in the **Integrations** group under the **Settings** parent. No sidebar structure changes. The only navigation change is in-page: tab state is now URL-synced so deep-links work.

### Role-Based Access Matrix

| Tab / Feature | SUPER_ADMIN | ACADEMY_ADMIN | STAFF | TEACHER | PARENT | SUPERVISOR | STUDENT | GUEST |
|---|---|---|---|---|---|---|---|---|
| Numbers tab (view) | ✅ | ✅ | ✅ (if WHATSAPP_CONFIG_MANAGE — per-tab guard) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Numbers tab (CRUD) | ✅ | ✅ | ✅ (if WHATSAPP_CONFIG_MANAGE) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Templates tab (view) | ✅ | ✅ | ✅ (if WHATSAPP_TEMPLATES_MANAGE — per-tab guard) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Templates tab (sync) | ✅ | ✅ | ✅ (if WHATSAPP_TEMPLATES_MANAGE) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Opt-in tab (admin view) | ✅ | ✅ | ✅ (if WHATSAPP_VIEW — per-tab guard, least-privileged) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Opt-in tab (personal) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create account | ✅ | ✅ | ✅ (if WHATSAPP_CONFIG_MANAGE) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit name | ✅ | ✅ | ✅ (if WHATSAPP_CONFIG_MANAGE) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete account | ✅ | ✅ | ✅ (if WHATSAPP_CONFIG_MANAGE) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit credentials | ✅ | ✅ | ✅ (if WHATSAPP_CONFIG_MANAGE) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sync from Meta | ✅ | ✅ | ✅ (if WHATSAPP_TEMPLATES_MANAGE) | ❌ | ❌ | ❌ | ❌ | ❌ |

### Per-Audience Rendering

| Audience | Visible Tabs | Numbers Tab | Templates Tab | Opt-in Tab |
|---|---|---|---|---|
| SUPER_ADMIN | All 3 tabs | Full CRUD, all accounts | Sync + preview | Admin: all users' opt-in |
| ACADEMY_ADMIN | All 3 tabs | Full CRUD, all accounts | Sync + preview | Admin: all users' opt-in |
| STAFF (with WHATSAPP_VIEW page-gate) | Numbers tab visible only if `WHATSAPP_CONFIG_MANAGE`; Templates tab visible only if `WHATSAPP_TEMPLATES_MANAGE`; Opt-in always visible | Full CRUD (gated by `WHATSAPP_CONFIG_MANAGE` per-tab guard) | Sync + preview (gated by `WHATSAPP_TEMPLATES_MANAGE` per-tab guard) | Admin: all users' opt-in (per-tab guard `WHATSAPP_VIEW`) |
| TEACHER | Opt-in only | Hidden | Hidden | Personal opt-in toggle + history |
| PARENT | Opt-in only | Hidden | Hidden | Personal opt-in toggle + history |
| SUPERVISOR | Opt-in only | Hidden | Hidden | Personal opt-in toggle + history |
| STUDENT | Opt-in only | Hidden | Hidden | Personal opt-in toggle + history |
| GUEST | No access | Hidden | Hidden | Hidden |

### Mobile vs Desktop Variants

| Component | Desktop | Mobile |
|---|---|---|
| Tab navigation | `GenericTabNav` horizontal bar | `GenericTabNav` horizontal bar (scrollable) |
| Numbers list | `AppDataGrid` with columns + row menu | `MobileCardList` + `MobileCardListItem` with expandable action menu |
| Account create | `CreateAccountDialog` centered | `CreateAccountDialog` fullScreen |
| Account edit name | `EditNameDialog` centered | `EditNameDialog` fullScreen |
| Credential edit | `Dialog` centered with masked input | `Dialog` fullScreen with masked input |
| Delete confirm | `DeleteConfirmDialog` centered with account name | `DeleteConfirmDialog` fullScreen Alert with account name |
| Templates list | `AppDataGrid` with expandable row for body preview | `MobileCardList` with expandable card for body preview |
| Opt-in (admin) | `AppDataGrid` with search/filter | `MobileCardList` with search filter |
| Opt-in (personal) | Switch + description + history table | Switch + description + history card list |
| Snackbar | `FormSuccessSnackbar` / `FormErrorSnackbar` top-center | `FormSuccessSnackbar` / `FormErrorSnackbar` bottom (above bottom nav) |
| Loading skeleton | Tab skeleton matching AppDataGrid layout | Tab skeleton matching MobileCardList layout |
| Per-row delete | LinearProgress on affected row | Skeleton overlay on affected card |
| Per-row sync | Sync icon spinner on affected row | Sync icon spinner on affected card |

### Permission Mapping

| Route / Component | Permission | Failure Behavior |
|---|---|---|
| `/settings/whatsapp` (page) | `WHATSAPP_VIEW` (page gate — kept as the entry requirement) | Redirect to settings home with toast |
| Numbers tab (per-tab guard) | `AppPermission.WHATSAPP_VIEW` (view) + `WHATSAPP_CONFIG_MANAGE` (CRUD gating via nested RequirePermission) | Tab hidden from nav; direct URL → "Permission Denied" |
| Templates tab (per-tab guard) | `AppPermission.WHATSAPP_TEMPLATES_MANAGE` | Tab hidden from nav |
| Opt-in tab (per-tab guard) | `AppPermission.WHATSAPP_VIEW` (least-privileged — user-facing toggle stays reachable) | Tab hidden |
| Create account button | `AppPermission.WHATSAPP_CONFIG_MANAGE` (RequirePermission wrapper) | Button hidden |
| Edit name menu item | `AppPermission.WHATSAPP_CONFIG_MANAGE` (RequirePermission wrapper) | Menu item hidden |
| Delete account menu item | `AppPermission.WHATSAPP_CONFIG_MANAGE` (RequirePermission wrapper) | Menu item hidden |
| Edit token dialog | `AppPermission.WHATSAPP_CONFIG_MANAGE` (RequirePermission wrapper) | Dialog not accessible |
| Edit PIN dialog | `AppPermission.WHATSAPP_CONFIG_MANAGE` (RequirePermission wrapper) | Dialog not accessible |
| Sync from Meta button | `AppPermission.WHATSAPP_TEMPLATES_MANAGE` | Button hidden |
| Admin consolidated opt-in view | `AppPermission.WHATSAPP_CONFIG_MANAGE` (RequirePermission wrapper) | Admin section hidden; falls back to personal toggle |
| Opt-in toggle (personal) | `WHATSAPP_OPT_IN_MANAGE` | Switch disabled with tooltip |

## Data Flow

### Current Data Flow
```
Client (useWhatsappSettingsViewModel)
  ├─ useQuery(whatsappAccounts) → accounts[]
  ├─ useQuery(isUserWhatsappOptIn) → optInState
  ├─ useMutation(deleteWhatsappAccount) ← handleDelete
  ├─ useMutation(setWhatsappAccessToken) ← handleSubmitToken
  ├─ useMutation(setWhatsappTwoStepPin) ← handleSubmitPin
  ├─ useMutation(syncFromMeta) ← handleSync (returns templates)
  └─ useMutation(setUserWhatsappOptIn) ← handleToggleOptIn
```
Missing: `createWhatsappAccount`, `updateWhatsappAccount` mutations not wired. Templates not queried (only from sync result).

### Target Data Flow
```
WhatsappSettingsContainer (Client)
  └─ useWhatsappSettingsViewModel
      ├─ useQuery(whatsappAccounts) → accounts[]
      ├─ useQuery(whatsappTemplates) → templates[]          ← NEW: persisted templates (⚠️ requires backend resolver or use sync mutation snapshot)
      ├─ useQuery(isUserWhatsappOptIn) → optInState
      ├─ useQuery(whatsappOptInAudit) → auditTrail[]        ← NEW: opt-in history (non-admin)
      ├─ useMutation(createWhatsappAccount) ← handleCreate   ← NEW
      ├─ useMutation(updateWhatsappAccount) ← handleEditName ← NEW
      ├─ useMutation(deleteWhatsappAccount) ← handleDelete
      ├─ useMutation(setWhatsappAccessToken) ← handleSubmitToken
      ├─ useMutation(setWhatsappTwoStepPin) ← handleSubmitPin
      ├─ useMutation(syncFromMeta) ← handleSync
      └─ useMutation(setUserWhatsappOptIn) ← handleToggleOptIn
      
  State exposed:
      accounts, templates, optInState, auditTrail
      creating: boolean                    ← NEW
      deletingId: string | null            ← NEW (per-row delete loading)
      updatingId: string | null            ← NEW (per-row name update loading)
      syncingId: string | null             ← (NEW — current ViewModel only has boolean 'syncing', not per-row)
      editingTokenId: string | null        ← NEW
      editingPinId: string | null           ← NEW
      dialogOpen: DialogState               ← NEW (consolidated dialog state)
      snackbar: { message: string, severity: "success" | "error" } | null
      validationErrors: Record<string, string>   ← NEW
```

## State Management

### ViewModel State Shape (Enhanced)
> Update existing `WhatsappSettingsViewModel` in `types/whatsappSettingsTypes.ts` (line 82) — the following is the enhanced shape, not a new inline definition:
```typescript
interface WhatsappSettingsViewModel {
  // Data
  accounts: WhatsappAccountReturnType[];
  templates: WhatsappTemplateReturnType[];      // NEW: persisted
  optInState: { optedIn: boolean; optedInAt: string | null };
  auditTrail: OptInAuditEntry[];                  // NEW: for non-admin history

  // Loading states
  loadingAccounts: boolean;
  loadingTemplates: boolean;                       // NEW
  creating: boolean;                               // NEW
  deletingId: string | null;                        // NEW: per-row
  updatingId: string | null;                        // NEW: per-row
  syncingId: string | null;                        // NEW — current ViewModel only has boolean 'syncing'
  editingTokenForId: string | null;                 // renamed
  editingPinForId: string | null;                  // renamed
  submittingDialog: boolean;
  togglingOptIn: boolean;

  // Error states
  accountsError: ApolloError | null;
  templatesError: ApolloError | null;              // NEW
  mutationError: string | null;                    // NEW: inline error

  // Snackbar
  snackbar: { message: string; severity: "success" | "error" } | null;
  closeSnackbar: () => void;

  // Validation
  validateDisplayName: (value: string) => string | null;
  validatePhoneNumberId: (value: string) => string | null;
  validateWabaId: (value: string) => string | null;
  validateAccessToken: (value: string) => string | null;
  validateTwoStepPin: (value: string) => string | null;

  // Dialog state
  dialogState: {
    type: "create" | "editName" | "editToken" | "editPin" | "deleteConfirm" | null;
    accountId?: string;
    displayName?: string;
  };
  openCreateDialog: () => void;
  openEditNameDialog: (accountId: string, displayName: string) => void;
  openEditTokenDialog: (accountId: string) => void;
  openEditPinDialog: (accountId: string) => void;
  openDeleteConfirmDialog: (accountId: string, displayName: string) => void;
  closeDialog: () => void;

  // Handlers
  handleCreate: (input: CreateInput) => Promise<void>;       // NEW
  handleEditName: (accountId: string, displayName: string) => Promise<void>;  // NEW
  handleDelete: (accountId: string) => Promise<void>;
  handleSubmitToken: (accountId: string, token: string) => Promise<void>;
  handleSubmitPin: (accountId: string, pin: string) => Promise<void>;
  handleSync: (accountId: string) => Promise<void>;
  handleToggleOptIn: (optedIn: boolean) => Promise<void>;
  refetchAccounts: () => void;
  refetchTemplates: () => void;                               // NEW
}
```

### URL Tab State (Client-Side useSearchParams — Pattern B client-side useSearchParams, NOT server-side Pattern A)
```typescript
// whatsappTabUrl.ts
"use client"; // REQUIRED: uses next/navigation client-only hooks (useSearchParams / useRouter)
import { useSearchParams, useRouter } from "next/navigation";
import { TAB_IDS } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfig.constants";

export function useWhatsappTab(): [TabId, (tab: TabId) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const activeTab = TAB_IDS.includes(tabParam as TabId) ? (tabParam as TabId) : TAB_IDS[0];
  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`/settings/whatsapp?${params.toString()}`, { scroll: false });
  };
  return [activeTab, setActiveTab];
}
```

## GraphQL Document Changes

### New Documents

```graphql
// whatsapp.documents.ts (ADD — existing file, add new documents)
// NOTE: Exported constant names use camelCase (matching existing convention in whatsapp.documents.ts):
//   export const whatsappTemplatesQueryDocument = graphql(...)   — not PascalCase
//   export const whatsappOptInAuditQueryDocument = graphql(...)
// The PascalCase form `WhatsappTemplatesQuery` refers to the GraphQL Operations type name, not the exported const.
//
// ⚠️ BACKEND RESOLVER FOR `whatsappTemplates` DOES NOT EXIST IN v1 (see `Assumptions / Non-Assumptions`
//    block in specs.md). `whatsappTemplatesQueryDocument` is a stub placeholder whose resolver was never
//    built. Templates render from `syncWhatsappAccountsFromMeta` mutation snapshots only until a future
//    backend plan ships the resolver. Document MUST still be declared so the queries slot exists.
//
// ⚠️ `body` and `buttonStructure` are NOT fields on `WhatsappTemplateSnapshot` in v1 — the snapshot
//    fragment only exposes `id`, `name`, `language`, `category`, `status` (see
//    `docs/frontend/whatsapp-ui-patterns.md:173-178`). They are left here as forward-looking placeholders
//    for when a future backend plan extends the snapshot type; the UI MUST degrade gracefully when they
//    are absent.
query WhatsappTemplatesQuery {
  whatsappTemplates {
    id
    name
    language
    category
    status
    # body / buttonStructure — omitted (not on snapshot type in v1)
    createdAt
    updatedAt
  }
}

// whatsapp.documents.ts (ADD)
query WhatsappOptInAuditQuery {
  whatsappOptInAudit {
    id
    optedIn
    optedInAt
    changedBy
    createdAt
  }
}
```

### Existing Documents to Wire
```graphql
// Already defined, never used in UI:
mutation CreateWhatsappAccountMutation($input: CreateWhatsappAccountInput!) {
  createWhatsappAccount(input: $input) { id displayName status createdAt }
}
mutation UpdateWhatsappAccountMutation($input: UpdateWhatsappAccountInput!) {
  updateWhatsappAccount(input: $input) { id displayName }
}
```

## i18n Changes

### New Keys to Add
```typescript
// Form labels
addAccount: "Add Account";
createAccountTitle: "Create WhatsApp Account";
editNameTitle: "Edit Display Name";
displayNameLabel: "Display Name";
phoneNumberIdLabel: "Phone Number ID";
wabaIdLabel: "WABA ID";
displayNameHelper: "A friendly name to identify this WhatsApp number";
phoneNumberIdHelper: "The phone number ID from Meta Business Manager";
wabaIdHelper: "The WhatsApp Business Account ID from Meta";

// Validation
validationDisplayNameRequired: "Display name is required";
validationDisplayNameTooLong: "Display name must be 100 characters or less";
validationPhoneNumberIdRequired: "Phone Number ID is required";
validationPhoneNumberIdNumeric: "Phone Number ID must be numeric";
validationWabaIdRequired: "WABA ID is required";
validationWabaIdNumeric: "WABA ID must be numeric";
validationAccessTokenTooShort: "Access token appears too short";
validationPinFormat: "PIN must be exactly 6 digits";

// Delete confirm with interpolation
deleteConfirmTitle: "Delete WhatsApp Number";
deleteConfirmMessage: (displayName: string) => `Are you sure you want to delete "${displayName}"? This action cannot be undone.`;

// States
loadingTitle: "Loading...";
retry: "Retry";
refresh: "Refresh";
permissionDenied: "You do not have permission to access this section";

// Account action labels
editName: "Edit Name";
addFirstNumber: "Add Your First WhatsApp Number";
syncTemplates: "Sync Templates";

// Template preview
templateBody: "Message Body";
templateLanguage: "Language";
templateCategory: "Category";
templateButtons: "Buttons";
templateLastUpdated: "Last Updated";
```

### Keys to Wire (Already Defined, Never Used)
Several i18n keys defined in `shared/locale/types/whatsapp/index.ts` but not yet wired to UI components (exact count requires audit — prior research estimated ~31 but many listed key names were not found in the actual codebase). Each key needs a corresponding component rendering point.

## Component Specifications

### CreateAccountDialog
```tsx
// shared component (used by both desktop and mobile)
// Define interface in `types/whatsappSettingsTypes.ts` (centralized types file — not inline in the component)
interface CreateAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { displayName: string; phoneNumberId: string; wabaId: string }) => void;
  submitLabel: string;
  isSubmitting: boolean;
  // NOTE: No `validate` prop. The dialog imports `whatsappFormValidation.ts` directly
  // (inline pattern, matching EditNameDialog) — does NOT receive validation functions via props.
}
```
- Fields: displayName (TextField), phoneNumberId (TextField), wabaId (TextField)
- Validation: dialog calls `validateDisplayName` / `validatePhoneNumberId` / `validateWabaId` directly from `@/frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation.ts` (inline import, not passed via props)
- Submit disabled until all fields valid
- onSuccess: snackbar + dialog close
- onError: snackbar (error) + dialog stays open

### EditNameDialog
```tsx
// Define interface in `types/whatsappSettingsTypes.ts` (centralized types file — not inline in the component)
interface EditNameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (accountId: string, displayName: string) => void;
  accountId: string;
  initialDisplayName: string;
  isSubmitting: boolean;
}
```

### DeleteConfirmDialog (REPAIR EXISTING — already defined in `NumbersTab.desktop.tsx:48-85` and wired at :290-296, but is buggy — it doesn't render `accountLabel`. Fix the existing dialog to render the account name.)
```tsx
// Define interface in `types/whatsappSettingsTypes.ts` (centralized types file — not inline in the component)
interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  displayName: string;          // NEW: show account name (the existing dialog ignores this prop — must be rendered)
  isSubmitting: boolean;
}
```

### WhatsappTabPanels
```tsx
// Renders all tabs with per-tab Suspense + RequirePermission
function WhatsappTabPanels({ activeTab }: { activeTab: TabId }) {
  return (
    <>
      {activeTab === "numbers" && (
        <Suspense fallback={<NumbersSkeleton />}>
          <RequirePermission permissions={AppPermission.WHATSAPP_VIEW}>
            <NumbersTabContent />
          </RequirePermission>
        </Suspense>
      )}
      {activeTab === "templates" && (
        <Suspense fallback={<TemplatesSkeleton />}>
          <RequirePermission permissions={AppPermission.WHATSAPP_TEMPLATES_MANAGE}>
            <TemplatesTabContent />
          </RequirePermission>
        </Suspense>
      )}
      {activeTab === "optin" && (
        <Suspense fallback={<OptInSkeleton />}>
          <RequirePermission permissions={AppPermission.WHATSAPP_VIEW}>
            <OptInTabContent />
          </RequirePermission>
        </Suspense>
      )}
    </>
  );
}
```

### WhatsappStatusBadge Config
```typescript
// whatsappStatusBadge.ts
import { StatusBadgeCategory } from "@/frontend/common/components/ui/StatusBadge";

export const whatsappTemplateStatusConfig: Record<string, StatusBadgeCategory> = {
  APPROVED: { color: "success", labelKey: "templateStatusApproved" },
  PENDING: { color: "warning", labelKey: "templateStatusPending" },
  REJECTED: { color: "error", labelKey: "templateStatusRejected" },
  PAUSED: { color: "info", labelKey: "templateStatusPaused" },
  PENDING_DELETION: { color: "warning", labelKey: "templateStatusPendingDeletion" },
  DISABLED: { color: "neutral", labelKey: "templateStatusDisabled" },
};

// ⚠️ Account status derives from the BOOLEAN `isActive` field via `getWhatsappAccountStatusBadgeConfig(isActive)`
//    (per `docs/frontend/whatsapp-ui-patterns.md:87-89`). Do NOT invent CONNECTED/PENDING/DISCONNECTED/ERROR
//    strings — those are NOT in the canonical UI doc; the only states are active / inactive.
export const getWhatsappAccountStatusBadgeConfig = (isActive: boolean) =>
  isActive
    ? { color: "success" as const, labelKey: "statusActive" }
    : { color: "neutral" as const, labelKey: "statusInactive" };
```

### WhatsappQualityLabel Helper
```typescript
// whatsappQualityLabel.ts
import { WhatsappQualityRating } from "@/backend/enum/whatsapp.enums";

export function getQualityLabelKey(quality: string): string {
  // NOTE: Current NumberCard.tsx renders raw enum values directly (no toUpperCase). This helper replaces that pattern.
  switch (quality?.toUpperCase()) {
    case WhatsappQualityRating.GREEN: return "qualityGreen";
    case WhatsappQualityRating.YELLOW: return "qualityYellow";
    case WhatsappQualityRating.RED: return "qualityRed";
    // Do NOT add `qualityOrange` — `ORANGE` is not in WhatsappQualityRating
    // (per `shared/constants/whatsapp-templates.enum.ts`: only GREEN/YELLOW/RED/UNKNOWN).
    // Map anything else to the UNKNOWN band per canonical UI doc `whatsapp-ui-patterns.md:180-182`.
    default: return "qualityUnknown";
  }
}
```

### WhatsappTierLabel Helper
```typescript
// whatsappTierLabel.ts
import { WhatsappLimitTier } from "@/backend/enum/whatsapp.enums";

export function getTierLabelKey(tier: string): string {
  // NOTE: Current NumberCard.tsx renders raw enum values directly (no toUpperCase). This helper replaces that pattern.
  switch (tier?.toUpperCase()) {
    case WhatsappLimitTier.TIER_1K: return "tier1K";
    case WhatsappLimitTier.TIER_10K: return "tier10K";
    case WhatsappLimitTier.TIER_100K: return "tier100K";
    // Do NOT add `tier250K` / `tier1M` — `TIER_250K` and `TIER_1M` are NOT in
    // `WhatsappLimitTier` (per `shared/constants/whatsapp-templates.enum.ts`:
    // the real values are UNTIERED, TIER_50, TIER_250, TIER_1K, TIER_10K,
    // TIER_100K, TIER_UNLIMITED, TIER_NOT_SET). Map anything else to
    // `tierTierUnknown` per canonical UI doc `whatsapp-ui-patterns.md:180-182`.
    default: return "tierTierUnknown";
  }
}
```

### Form Validation Functions
```typescript
// whatsappFormValidation.ts
export function validateDisplayName(value: string): string | null {
  if (!value.trim()) return "validationDisplayNameRequired";
  if (value.length > 100) return "validationDisplayNameTooLong";
  return null;
}

export function validatePhoneNumberId(value: string): string | null {
  if (!value.trim()) return "validationPhoneNumberIdRequired";
  if (!/^\d+$/.test(value)) return "validationPhoneNumberIdNumeric";
  return null;
}

export function validateWabaId(value: string): string | null {
  if (!value.trim()) return "validationWabaIdRequired";
  if (!/^\d+$/.test(value)) return "validationWabaIdNumeric";
  return null;
}

export function validateAccessToken(value: string): string | null {
  if (value.length < 50) return "validationAccessTokenTooShort";
  return null;
}

export function validateTwoStepPin(value: string): string | null {
  if (!/^\d{6}$/.test(value)) return "validationPinFormat";
  return null;
}
```

## Animation Specifications

### Tab Transition
```tsx
// Using MUI theme.transitions
<MotionBox
  sx={{
    animation: 'whatsappTabFadeIn 200ms ease-in-out',
    '@keyframes whatsappTabFadeIn': {
      '0%': { opacity: 0, transform: 'translateY(4px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
  }}
>
  {tabContent}
</MotionBox>
```

### Row Enter (new account)
```tsx
// MUI Fade + Grow transition on new row
<Fade in={true} timeout={300}>
  <Grow in={true} timeout={300}>
    <TableRow>...</TableRow>
  </Grow>
</Fade>
```

### Snackbar
- Use MUI Snackbar default slide transition (bottom → up on mobile, top → down on desktop)
- autoHideDuration: 6000ms

### Sync Icon Pulse
```tsx
<SvgIcon
  sx={{
    animation: 'whatsappSyncPulse 1s ease-in-out infinite',
    '@keyframes whatsappSyncPulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
  }}
/>
```

## Testing Strategy

### ViewModel Tests (existing + new)
1. Create account mutation flow (valid input)
2. Create account with invalid input (validation blocks mutation)
3. Update account name mutation flow
4. Edit name with invalid input
5. Delete confirm dialog cancellation
6. Delete mutation success
7. Delete mutation failure (error snackbar)
8. Sync loading state (syncingId set)
9. Sync mutation success (templates updated)
10. Credential dialog submission (token validated)
11. Credential dialog submission (PIN validated)
12. Per-row loading states (deletingId, syncingId)
13. Snackbar close behavior
14. Opt-in toggle loading state
15. Permission denied behavior

### Component Tests (new)
1. CreateAccountDialog: renders all fields
2. CreateAccountDialog: validation errors on invalid input
3. CreateAccountDialog: submit disabled on validation failure
4. CreateAccountDialog: calls onSubmit with valid data
5. EditNameDialog: pre-fills display name
6. EditNameDialog: validates on change
7. DeleteConfirmDialog: shows account name
8. DeleteConfirmDialog: cancel does not call onConfirm
9. NumbersTab: renders accounts with localized quality/tier labels
10. NumbersTab: renders empty state when no accounts
11. NumbersTab: renders skeleton while loading
12. NumbersTab: renders error state on query failure
13. NumbersTab: shows per-row loading when deleting
14. TemplatesTab: renders persisted templates
15. TemplatesTab: renders empty state with "Sync Templates" CTA
16. TemplatesTab: expands to show body preview
17. OptInTab: renders opt-in toggle for non-admin
18. OptInTab: renders admin consolidated table
19. OptInTab: shows history entries
20. Mobile NumbersTab: renders action menu on tap
21. Mobile NumbersTab: shows delete confirmation on tap
22. Mobile NumbersTab: shows credential dialog on tap
23. Mobile TemplatesTab: renders expandable card

### Quality Gates
- Per-file: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` — handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene in one progressive command (short-circuits at first failure)
- All tests pass: `bun run test:ui:components`

## Security Considerations

### Input Validation
- Client-side validation complements server-side validation (does not replace it)
- Access token field uses `type="password"` with show/hide toggle
- PIN field uses `type="password"`
- No sensitive data logged to console (use `logger` with redaction)
- All GraphQL mutations are permission-gated at resolver level

### Access Control
- Page-level: `requirePermissionForPage([WHATSAPP_VIEW])` in server component
- Tab-level: `<RequirePermission>` wrapping each tab panel
- Action-level: Permission checks in ViewModel before calling mutations
- Non-admin users only see Opt-in tab; Numbers/Templates tabs hidden

## Performance Considerations

### Code Splitting
- Each tab content lazy-loaded via `React.lazy` with Suspense
- Tab content only loaded when tab is active (not all at once)
- Template body preview expands in-place (no separate route load)

### Data Loading
- Accounts query: loads all accounts (low count expected)
- Templates query: loads when Templates tab is first opened (lazy via useQuery with skip)
- Opt-in audit query: loads when Opt-in tab is first opened

### Rendering
- Skeleton loaders match tab content layout for no layout shift
- Per-row loading indicators use MUI `LinearProgress` (lightweight)
- No framer-motion (reduces bundle size by ~50KB)
