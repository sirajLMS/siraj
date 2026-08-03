# Design Document: Auto-Meeting-URL UI/UX Improvement Plan

**Project**: Siraj Meetings  
**Feature**: Auto-Meeting-URL UI Enhancement  
**Version**: 1.0  
**Date**: 2026-08-02  
**Status**: Draft  
**Related Documents**:
- Requirements: [requirements.md](./requirements.md)
- Tasks: [tasks.md](./tasks.md)

---

## Table of Contents

1. [Overview & Design Goals](#1-overview--design-goals)
2. [UX/Navigation Specification (REQUIRED)](#2-uxnavigation-specification-required)
3. [Component Designs](#3-component-designs)
4. [Data Flow](#4-data-flow)
5. [State Management](#5-state-management)
6. [GraphQL Document Changes](#6-graphql-document-changes)
7. [i18n Translation Keys](#7-i18n-translation-keys)
8. [Error Handling](#8-error-handling)
9. [Testing Strategy](#9-testing-strategy)
10. [Design Decisions](#10-design-decisions)

---

## 1. Overview & Design Goals

### Overview

The auto-meeting-url feature has been fully implemented on the backend with adapters for Zoom, Google Meet, and MS Teams, OAuth flow, auto-generation at booking time, admin settings tab, and profile meeting configs. However, the UI does not follow the project's established design system patterns and lacks production-ready UX for OAuth flows, URL generation feedback, and cross-navigation.

This design document specifies comprehensive UI improvements to align the meeting integrations UI with the project's component patterns (DesktopAppDataGrid, MobileCardList, DesktopMetricCardGrid, BaseDeleteDialog, zod validation), ensure full mobile-desktop parity, and deliver a polished, production-ready user experience.

### Design Goals

1. **Component Compliance** — Replace all raw MUI components (Card+Grid, DataGrid, Dialog) with project design system equivalents (DesktopMetricCardGrid, DesktopAppDataGrid, BaseDeleteDialog, EntityFormDialogActions)
2. **OAuth Flow Polish** — Auto-detect OAuth callback completion, loading overlays, proactive reauth prompts, reconnect-all batch action
3. **URL Visibility** — Meeting URL status badges, copy URLs, generation feedback in all data tables (teacher schedule, student dashboard, parent dashboard)
4. **Cross-Navigation** — Bidirectional links between admin settings tab and teacher profile meeting configs
5. **Mobile-Desktop Parity** — Full responsive variants for every meeting-related view using proper component hierarchy
6. **Accessibility** — WCAG 2.1 AA compliance, keyboard navigation, ARIA labels, screen reader announcements
7. **i18n Completeness** — All new UI strings in Arabic + English via compile-time translation system

### Key Design Decisions

- **Reuse existing design system components** rather than creating new ones — ensures consistency and maintainability
- **No new routes** — enhance existing `/dashboard/settings?tab=meetingIntegrations` and `/profile?tab=meeting`
- **Minimal backend changes — schema only (CRITICAL scope note):** This plan is frontend-focused, but task 2 requires **prerequisite GraphQL schema updates** (Pothos) to expose new fields the UI needs (`meetingUrlStatus`, `meetingUrlExpiresAt`, `meetingUrlError`, `provider { slug }` resolver on relevant meeting/class-meeting-config types) followed by `bun run generate:gqlSchema && bun codegen`. Without these schema fields, the UI cannot query them. No new resolvers, services, or repositories are in scope — only schema field additions. All other missing backend operations (e.g. DataLoader-backed `provider` resolver, `reconnectAll` mutation) are documented as design constraints for a FUTURE backend plan in §11.
- **Three-tier component architecture** — common (shared logic/types) → desktop (full layout) → mobile (card-based)

---

## 2. UX/Navigation Specification (REQUIRED)

### New Routes & URLs

**No new routes.** This plan enhances existing routes:

| Route | Purpose | Permission | Enhancement |
|-------|---------|------------|-------------|
| `/dashboard/settings?tab=meetingIntegrations` | Admin provider management | `AppPermission.SettingsEditMeetingIntegrations` (write), `AppPermission.SettingsView` (read) | Component compliance, cross-link, connect provider |
| `/profile?tab=meeting` | Teacher meeting configs | `AppPermission.MeetingConfigsManageOwn` | OAuth auto-refresh, reconnect all, copy URL, expiry display |
| `/dashboard/schedule` | Teacher schedule grid | Teacher role | URL status badges, copy/join actions |
| `/dashboard` (student) | Student next class | Student role | Copy URL button |
| `/dashboard` (parent) | Parent student view | Parent role | Student meeting URLs with copy/join |

### Sidebar/Navigation Integration

- **Settings Tab**: Already registered in `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts` (note the `config/` directory in the path) with `id: "meetingIntegrations"`, `icon: VideocamOutlined`, `labelKey: "meetingIntegrations"` (i18n key — NOT a literal `label: "Meeting Integrations"`), and `permissions: [AppPermission.SettingsEditMeetingIntegrations, AppPermission.SettingsView]` (plural array, typed `PagePermissions` — NOT a singular `permission` string). No change needed to the registration itself.
- **Profile Tab**: Already registered in `frontend/common/views/dashboard/profile/core/profileTabs.ts` with `id: "meeting"` and `i18nKey: "shell.tabs.meeting"` (NOT `label: "Meeting Configs"`). The tab has **no inline `permission` field** — visibility is computed by `isMeetingTabVisible`, which returns true if the user has `PROFILE_MEETING_CONFIGS_VIEW_OWN`/`PROFILE_MEETING_CONFIGS_VIEW_OTHER` OR `AppPermission.MeetingConfigsManageOwn`/`AppPermission.MeetingConfigsManageOther`. No change needed to the registration itself.
- **No new sidebar items** — meeting providers accessed via existing settings tab and profile tab.
- **Cross-navigation**: New buttons in tab headers that link between settings ↔ profile.

### Role-Based Access Matrix

| Feature | SUPER_ADMIN | ACADEMY_ADMIN | SUPERVISOR | TEACHER | PARENT | STUDENT | STAFF |
|---------|-------------|---------------|------------|---------|--------|---------|-------|
| Settings tab (view) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Settings tab (edit) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Connect provider (settings) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Revoke token (settings) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Test connection | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Profile meeting configs | ✅ | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ✅ |
| Create/edit own configs | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage class configs | ✅ | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ✅ |
| Connect OAuth (profile) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Disconnect OAuth | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Copy meeting URL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Join meeting | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View student URLs (parent) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Cross-nav: settings → profile | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cross-nav: profile → settings | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

### Per-Audience Rendering

#### Admin (SUPER_ADMIN, ACADEMY_ADMIN)
- **Settings tab**: Full CRUD on providers, connected accounts, credentials, health monitoring, test connection, revoke tokens
- **Connect Provider button**: Initiates OAuth flow from settings tab for any provider
- **Cross-link**: "View Teacher Meeting Configs" button → `/profile?tab=meeting`
- **Provider catalog management**: `AppPermission.MeetingProvidersManageCatalog` permission for catalog CRUD

#### Teacher
- **Profile meeting configs**: Connect/disconnect OAuth, manage own meeting configs, class meeting configs
- **Schedule grid**: View/copy/join meeting URLs for own classes with status badges
- **Reauth prompts**: Proactive banner when own provider tokens expire within 7 days
- **Reconnect All**: Batch action when ≥2 providers need reauth
- **Cross-link**: "Admin Provider Settings" button → `/dashboard/settings?tab=meetingIntegrations` (if `AppPermission.SettingsView`)

#### Parent
- **Student dashboard**: View upcoming meeting URLs for children, copy/join actions
- **No config management** — read-only access to meeting URLs

#### Student
- **Next class card**: Join meeting button + copy URL button for generated URLs
- **No config management** — read-only access to meeting URLs

#### Supervisor/Staff
- **Settings tab**: View-only (no edit actions visible)
- **Profile**: View-only (if permitted by role)

### Mobile vs Desktop Variants

| View | Desktop Component | Mobile Component | Differences |
|------|-------------------|------------------|-------------|
| Settings: Provider Health | `DesktopMetricCardGrid` | `MobileMetricCardGrid` | Grid layout → stacked cards |
| Settings: Connected Accounts | `DesktopAppDataGrid` | `MobileCardList` | Table → card list |
| Settings: Credential Form | Dialog (centered, max-width 600px) | FullScreenDialog | Centered → full-screen |
| Settings: Revoke Dialog | `BaseDeleteDialog` (centered) | `BaseDeleteDialog` (full-screen) | Same component, responsive |
| Profile: Provider Cards | `DesktopMetricCardGrid` | `MobileMetricCardGrid` | Grid layout → stacked cards |
| Profile: Meeting Configs | `DesktopAppDataGrid` | `MobileCardList` | Table → card list |
| Profile: Config Form Dialog | Dialog (centered, max-width 600px) | FullScreenDialog | Centered → full-screen |
| Profile: Reauth Banner | Alert banner (full-width) | Alert banner (full-width) | Same, touch targets ≥48dp |
| Schedule Grid | `DesktopAppDataGrid` | `MobileCardList` | Table → card list with URL status |
| Student Next Class | Card (horizontal) | Card (vertical/stacked) | Horizontal → vertical |
| Parent Dashboard | `DesktopAppDataGrid` | `MobileCardList` | Table → card list |
| OAuth Loading Overlay | Backdrop with CircularProgress | Backdrop with CircularProgress | Same, full-screen on mobile |

### Permission Mapping

> Use the `AppPermission` enum (from `@/frontend/common/graphql/generated/gql/graphql-types`) — never bare string literals like `"SETTINGS_EDIT_MEETING_INTEGRATIONS"`. The six relevant members: `AppPermission.SettingsEditMeetingIntegrations`, `AppPermission.SettingsView`, `AppPermission.MeetingConfigsManageOwn`, `AppPermission.MeetingConfigsManageOther`, `AppPermission.MeetingConfigsManageClass`, `AppPermission.MeetingProvidersManageCatalog`. Profile-tab visibility additionally uses `PROFILE_MEETING_CONFIGS_VIEW_OWN`/`PROFILE_MEETING_CONFIGS_VIEW_OTHER` (role flags consumed by `isMeetingTabVisible`).

| UI Component | Permission Check | Implementation |
|--------------|------------------|-----------------|
| Settings tab render | `AppPermission.SettingsView` or `AppPermission.SettingsEditMeetingIntegrations` | ViewModel `canView` / `canEdit` |
| Provider credential form | `AppPermission.SettingsEditMeetingIntegrations` | ViewModel `canEdit` |
| Revoke token button | `AppPermission.SettingsEditMeetingIntegrations` | ViewModel `canEdit` |
| Test connection button | `AppPermission.SettingsEditMeetingIntegrations` | ViewModel `canEdit` |
| Connect provider (settings) | `AppPermission.SettingsEditMeetingIntegrations` | ViewModel `canEdit` |
| Profile meeting configs | `AppPermission.MeetingConfigsManageOwn` | ViewModel `canManageOwn` |
| Class meeting configs | `AppPermission.MeetingConfigsManageClass` | ViewModel `canManageClass` |
| Copy URL button | Any authenticated user | No permission gate |
| Cross-nav settings → profile | `AppPermission.SettingsEditMeetingIntegrations` | ViewModel `canEdit` |
| Cross-nav profile → settings | `AppPermission.SettingsView` | ViewModel `canViewSettings` |

---

## 3. Component Designs

### Settings Tab Components

> **File paths (IMPORTANT — do not guess the directory):** all settings-tab meetingIntegrations components live under `frontend/common/views/dashboard/settings/components/meetingIntegrations/` (note: `components/` comes **before** `meetingIntegrations/` — the inverse of `settings/tabs/meetingIntegrations/components/`). The settings tab config itself is at `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts`.

> **Type sourcing note (IMPORTANT):** The `interface XxxProps` blocks below are **view-shape** types (props interfaces for the `.tsx` files) — these are permitted in component files per `frontend/common/views/AGENTS.md` Rule 7 step 4. However, any prop type that is an entity type (e.g. `MeetingIntegrationProvider`, `ClassMeetingConfig`, `ConnectedMeetingProvider`) or an array thereof MUST be `Pick`'d/typed from codegen (`@/frontend/common/graphql/generated/gql/graphql-types`) or from `@/backend/types/{entity}.types.ts` — never redeclared as a local interface. Only UI-only unions (e.g. `TestConnectionState`, `GenerationStatus`, `MetricItem`) that have no codegen equivalent may be locally defined. Task 2's prerequisite (Pothos schema update → codegen) ensures new fields exist in codegen for `Pick`-ing.

---

#### 3.1 `MeetingIntegrationsTab` (Redesigned)

**Purpose**: Main container for admin meeting integrations settings tab.

**Responsibilities**:
- Lazy-load desktop/mobile variants via `ResponsiveViewSwitch`
- Pass ViewModel data to both variants
- Error boundary wrapper

**Props/Interface**:
```typescript
interface MeetingIntegrationsTabProps {
  // No props — reads from ViewModel hook
}
```

**States**:
- Loading: `CircularProgress` + translated "Loading meeting integrations..." label
- Error: `<Alert severity="error">` with translated error message + retry button
- Empty: Typography `text.secondary` — empty-state message via i18n key (e.g. `noProvidersConfigured`)
- Success: Full tab content rendered

> **Note**: All state strings above (e.g. "Loading meeting integrations...", "No meeting providers configured") are illustrative English for this design doc. At implementation, resolve every user-facing string through `useAppTranslation(Translation.Dashboard.SettingsMeetingIntegrations)` — never hardcode English literals.

**Interactions**: None (container only)

**Animations**: Lazy-load fade-in (via Suspense fallback)

**Accessibility**: ARIA `role="region"` with `aria-label="Meeting Integrations Settings"`

**Mobile vs Desktop**: `ResponsiveViewSwitch` switches between `MeetingIntegrationsTabDesktop` and `MeetingIntegrationsTabMobile`

---

#### 3.2 `MeetingIntegrationsHealthHeaders` (Redesigned)

**Purpose**: Display provider health summary as metric cards.

**Responsibilities**:
- Show count of: total providers, connected providers, providers with issues, disconnected providers
- Each metric card uses the canonical **`MetricItem`** shape from `frontend/common/types/shared.types.ts`:
  ```typescript
  interface MetricItem {
    readonly key: string;                       // stable keys: "total"|"connected"|"issues"|"disconnected"
    readonly count: number | string;            // numeric value, NOT `value`
    readonly labelKey: string;                  // i18n key, NOT free `label` string
    readonly icon: SvgIconComponent;            // icon component, NOT icon name
    readonly label?: string;                    // optional override string (fallback when labelKey not loaded)
    readonly subLabel?: string;
    readonly variant?: "default" | "error" | "highlight" | "danger";   // replaces `color`
  }
  ```
  There is **no `label`/`value`/`color` triplet** — use `{ key, count, labelKey, icon, variant }`. Variant drives palette (`error`/`danger` → error palette, `highlight` → primary, default → neutral).

**Props/Interface**:
```typescript
interface HealthHeadersProps {
  providers: MeetingIntegrationProvider[];
  loading: boolean;
}
```

**States**:
- Loading: Skeleton placeholder cards (4 metric cards with shimmer)
- Error: Red metric card showing "Error" count
- Empty: All metrics show 0 with `text.secondary` color
- Success: `DesktopMetricCardGrid` (desktop) / `MobileMetricCardGrid` (mobile) with 4 `MetricItem` entries (each using `variant` for color, not a `color:` field). Icon names follow the `*Outlined` rename (no `*Outline`). Example:
  ```typescript
  const metrics: MetricItem[] = [
    { key: "total",        count: providers.length,      labelKey: "totalProviders",        icon: DnsOutlined,         variant: "default"   },
    { key: "connected",    count: connectedCount,         labelKey: "connectedProviders",     icon: CheckCircleOutlined,  variant: "highlight" },
    { key: "issues",       count: issuesCount,            labelKey: "providersWithIssues",    icon: WarningOutlined,      variant: "danger"   },
    { key: "disconnected", count: disconnectedCount,     labelKey: "disconnectedProviders",  icon: CloudOffOutlined,     variant: "error"     },
  ];
  ```
  The 4 cards (each a `MetricItem`):
  1. Total Providers — `DnsOutlined`, `variant: "default"` (neutral palette)
  2. Connected — `CheckCircleOutlined`, `variant: "highlight"` (primary palette)
  3. Issues — `WarningOutlined`, `variant: "danger"` (error palette)
  4. Disconnected — `CloudOffOutlined`, `variant: "error"` (error palette)

**Interactions**: Click on metric card → scrolls/filter to corresponding providers in table below

**Animations**: Number count-up animation (CSS transition on value change)

**Accessibility**: Each card has `aria-label` with full description ("3 out of 5 providers connected")

**Mobile vs Desktop**:
- Desktop: `DesktopMetricCardGrid` — 4-column grid with interactive cards
- Mobile: `MobileMetricCardGrid` — 2-column grid, touch targets ≥48dp

---

#### 3.3 `ConnectedAccountsTable` (Redesigned)

**Purpose**: Display all connected meeting provider accounts in a data table.

**Responsibilities**:
- List all connected OAuth accounts with provider name, user email, connected date, token expiry, status
- Actions: Test connection, Revoke token, View metadata
- Filter by provider, status (connected/expiring/expired)

**Props/Interface**:
```typescript
interface ConnectedAccountsTableProps {
  accounts: MeetingIntegrationConnectedAccount[];
  loading: boolean;
  onRevoke: (accountId: string) => void;
  onTestConnection: (providerSlug: string) => void;
  onViewMetadata: (accountId: string) => void;
  canEdit: boolean;
}
```

**States**:
- Loading: Table skeleton with shimmer rows
- Error: Alert with error message + retry
- Empty: Typography `text.secondary` — empty-state message via i18n key (e.g. `noConnectedAccounts`)
- Success: `DesktopAppDataGrid` (desktop) / `MobileCardList` (mobile) with rows

**IMPORTANT — required props**: Both `DesktopAppDataGrid` and `MobileCardList` **require a `paginationOptions: ListPaginationOptions` prop** (no default). Pass `paginationOptions={{ mode: "server", page, pageSize, totalCount, onPageChange }}` when the ViewModel owns paging, or `paginationOptions={{ mode: "client" }}` only when paging is purely client-side. The pager stays visible whenever `paginationOptions !== false` (even single page); pass `paginationOptions={false}` only to explicitly disable paging.

**Columns**: Desktop columns are standard `GridColDef[]` (from `@mui/x-data-grid`), passed to `DesktopAppDataGrid`'s inherited `columns` prop — not a custom column-definition object. Mobile renders `MobileCardListItem` rows inside `MobileCardList`.

**Desktop Columns** (`GridColDef[]`):
1. Provider (icon + name)
2. User Email
3. Connected Date (formatted)
4. Token Expiry (formatted, red if expired, amber if <7 days)
5. Status Badge (Connected/Expiring/Expired)
6. Actions (Test, Metadata, Revoke) — hidden if `!canEdit`

**Mobile Cards**: Each card shows provider icon + name, user email, status badge, action menu

**Interactions**:
- Row click: Opens `TokenMetadataDialog`
- Revoke button: Opens `RevokeTokenDialog` (BaseDeleteDialog)
- Test button: Triggers `TestConnectionResultPanel`
- Column sort: By provider name, connected date, token expiry
- Filter: Search input + status filter dropdown

**Animations**: Row hover highlight, badge color transitions on status change

**Accessibility**: MUI DataGrid built-in accessibility, `aria-label` on action buttons, keyboard navigable

---

#### 3.4 `MeetingProviderCredentialForm` (Redesigned)

**Purpose**: Form for creating/editing meeting provider credentials (client ID, client secret, scopes, etc.).

**Responsibilities**:
- `react-hook-form` + `zod` validation for all fields
- Translated field labels via `useAppTranslation`
- `EntityFormDialogActions` for submit/cancel footer
- Password fields with show/hide toggle for secrets

**Props/Interface**:
```typescript
interface CredentialFormProps {
  open: boolean;
  provider: MeetingIntegrationProvider | null;
  onClose: () => void;
  onSubmit: (values: CredentialFormValues) => Promise<void>;
  mode: "create" | "edit";
}

interface CredentialFormValues {
  clientId: string;
  clientSecret: string;
  tenantId?: string; // For MS Teams
  scopes: string[];
  webhookSecret?: string;
}
```

**Zod Schema** (factory pattern injecting pre-resolved label strings — **not** a `t` function; mirrors `createSessionConfigFormSchema(labels)` in `frontend/common/views/dashboard/settings/schemas/sessionConfigForm.schema.ts`):
```typescript
// schemas/credentialForm.schema.ts
export function createCredentialFormSchema(
  labels: Pick<CredentialFormLabels, "clientIdRequired" | "clientSecretRequired" | "scopesRequired">,
) {
  return z.object({
    clientId: z.string().trim().min(1, labels.clientIdRequired),
    clientSecret: z.string().trim().min(1, labels.clientSecretRequired),
    tenantId: z.string().optional(),
    scopes: z.array(z.string()).min(1, labels.scopesRequired),
    webhookSecret: z.string().optional(),
  });
}
export type CredentialFormValues = z.infer<ReturnType<typeof createCredentialFormSchema>>;

// In the dialog (formId is required by EntityFormDialogActions):
const resolver = zodResolver(createCredentialFormSchema(labels));
// Footer uses EntityFormDialogActions with formId, cancelLabel, saveLabel, onClose, isLoading
<EntityFormDialogActions formId={formId} cancelLabel={labels.cancel} saveLabel={labels.save} onClose={onClose} isLoading={submitting} />
```

**States**:
- Loading (submitting): Submit button shows `CircularProgress` (button size), disabled
- Error: Alert below form fields with translated error
- Success: Form closes, toast notification "Credentials saved"
- Validation errors: Field-level error messages via `react-hook-form`

**Interactions**:
- Password show/hide toggle on secret fields
- Scopes: Multi-select chips (add/remove)
- Submit: Calls `onSubmit`, shows loading state, closes on success
- Cancel: Confirmation if dirty

**Animations**: Dialog slide-up transition, field shake on validation error

**Accessibility**: Form `aria-labelledby`, field `aria-invalid` on error, `aria-describedby` for error text, keyboard tab order

**Mobile vs Desktop**:
- Desktop: Centered dialog, max-width 600px
- Mobile: Full-screen dialog with sticky footer

---

#### 3.5 `TestConnectionResultPanel` (Redesigned)

**Purpose**: Display connection test results for a meeting provider.

**Responsibilities**:
- Show test status: idle, testing, success, failure
- Display latency, endpoint reached, authentication status
- Provide retry button on failure

**Props/Interface**:
```typescript
interface TestConnectionResultPanelProps {
  status: "idle" | "testing" | "success" | "failure";
  result?: TestConnectionResult;
  onRetry: () => void;
}
```

**States**:
- Idle: Empty state — Typography `text.secondary` "Click 'Test Connection' to verify provider connectivity"
- Testing: `CircularProgress` + "Testing connection to {Provider}..."
- Success: `<Alert severity="success">` with latency, endpoint, auth status
- Failure: `<Alert severity="error">` with error message + "Retry" button

**Interactions**: Retry button calls `onRetry`

**Animations**: Alert slide-in, progress spinner pulse

**Accessibility**: `aria-live="polite"` for status updates

---

#### 3.6 `RevokeTokenDialog` (Redesigned)

**Purpose**: Confirm token revocation using `BaseDeleteDialog` pattern.

**Responsibilities**:
- Show warning about impact (all meeting configs using this provider will lose URL generation)
- Confirm button with "Revoke" label
- Cancel button

**Implementation**: Replace raw `Dialog` with `BaseDeleteDialog`, wrapped in a per-entity dialog component (the `RevokeTokenDialog` in `frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog.tsx`). There is **no `useBaseDeleteDialog(params)` hook** in this codebase — wrap the dialog directly, threading props through the entity dialog. Correct props are `body` (not `message`), `isLoading` (not `loading`); `confirmSx?: SxProps<Theme>` is optional.

```typescript
// RevokeTokenDialog directly renders BaseDeleteDialog (no useBaseDeleteDialog hook exists)
<BaseDeleteDialog
  open={open}
  onClose={onClose}
  onConfirm={onRevoke}
  isLoading={loading}
  title={t.revokeConfirmTitle}
  body={t.revokeConfirm}
  confirmLabel={t.revoke}
  cancelLabel={t.cancel}
  confirmSx={theme => ({ backgroundColor: theme.palette.error.main, color: theme.palette.onError })}
/>
```

*(See the existing `CatalogDeleteDialog` in `frontend/common/views/dashboard/admin/payment-catalogs/components/CatalogDeleteDialog.tsx` for the wrap pattern.)*

**States**: Loading (revoking) — confirm button shows `CircularProgress`

**Accessibility**: Traps focus, restores on close, `aria-modal="true"`

---

#### 3.7 `TokenMetadataDialog` (Enhanced)

**Purpose**: Display OAuth token metadata (issued at, expires at, scopes, token type).

**Responsibilities**:
- Read-only display of token metadata
- Copy token ID button
- Show scope list as chips

**Props/Interface**:
```typescript
interface TokenMetadataDialogProps {
  open: boolean;
  metadata: TokenMetadata | null;
  onClose: () => void;
}
```

**States**: Loading — `CircularProgress` in dialog body; Empty — "No metadata available"

**Accessibility**: `aria-labelledby` with dialog title, keyboard navigable list

---

#### 3.8 `EndpointList` (Redesigned)

**Purpose**: Display provider API endpoints (OAuth authorize, token, revoke URLs).

**Responsibilities**:
- List endpoints with copy button for each URL
- Show endpoint method (GET/POST)

**Props/Interface**:
```typescript
interface EndpointListProps {
  endpoints: ProviderEndpoint[];
}
```

**States**: Empty — "No endpoints configured"

**Interactions**: Copy URL button per endpoint with toast notification

**Accessibility**: `aria-label` on copy buttons ("Copy {endpoint name} URL")

---

#### 3.9 NEW: `ConnectProviderAction` (Settings Tab)

**Purpose**: "Connect Provider" button in settings tab for initiating OAuth flow for any unconnected provider.

**Responsibilities**:
- Show button for unconnected providers in the connected accounts table
- Call `connectMeetingProviderOAuth` mutation
- Redirect browser to returned `authorizeUrl`
- Show loading overlay during redirect

**Props/Interface**:
```typescript
interface ConnectProviderActionProps {
  providerSlug: string;
  providerName: string;
  onConnect: (providerSlug: string) => Promise<void>;
  loading: boolean;
}
```

**States**:
- Idle: "Connect" button with `LinkOutlined` icon
- Loading: Button shows `CircularProgress` (button size), disabled, "Connecting..."
- Error: Alert with translated error + retry

**Interactions**: Click → calls `onConnect` → redirect to OAuth URL → callback auto-detect

**Accessibility**: `aria-label="Connect {providerName} OAuth"`, keyboard focusable

---

#### 3.10 NEW: `ProfileLinkCallout` (Settings → Profile Cross-Link)

**Purpose**: Callout in settings tab header linking to teacher profile meeting configs.

**Responsibilities**:
- Show "View Teacher Meeting Configs" button
- Navigate to `/profile?tab=meeting` in same tab
- Visible only to users with `AppPermission.SettingsEditMeetingIntegrations`

**Props/Interface**:
```typescript
interface ProfileLinkCalloutProps {
  onNavigate: () => void;
}
```

**Interactions**: Click → `router.push('/profile?tab=meeting')`

**Accessibility**: `aria-label="Navigate to teacher meeting configs"`, styled as subtle callout (not primary button)

---

### Profile Meeting Configs Components

> **File paths (IMPORTANT — do not guess the directory):** all profile meeting-config components live **directly** at `frontend/common/views/dashboard/profile/shared/meeting-configs/` (NO `components/` subfolder — the plan's earlier `profile/shared/meeting-configs/components/*.tsx` slugs were wrong). The ViewModel is `useMeetingConfigsManagerViewModel.ts` in the same directory.

---

#### 3.11 `MeetingConfigsManager` (Enhanced)

**Purpose**: Main container for teacher meeting configs management.

**Enhancements**:
- Add OAuth callback auto-detection (listens for URL params `oauth_status`, `provider`)
- Add "Reconnect All" batch action when ≥2 providers need reauth
- Add cross-link to admin settings (if `AppPermission.SettingsView`)
- Pass `onCopyUrl` callback to child components

**Props/Interface**:
```typescript
interface MeetingConfigsManagerProps {
  // No props — reads from ViewModel
}
```

**States**: Loading, Error, Empty ("Connect your first meeting provider" with action button), Success

---

#### 3.12 `ConnectProviderAccount` (Enhanced with OAuth Callback Flow)

**Purpose**: OAuth connect/disconnect button per provider with callback auto-detection.

**Enhancements**:
- Loading overlay during OAuth redirect
- Auto-detect callback completion via URL params
- Connection status badge (connected/expiring/expired/disconnected)
- "Reconnect" button separate from "Connect"

**Props/Interface**:
```typescript
interface ConnectProviderAccountProps {
  provider: ConnectedMeetingProvider;
  onConnect: (providerSlug: string) => Promise<void>;
  onDisconnect: (providerSlug: string) => Promise<void>;
  connecting: boolean;
}
```

**States**:
- Disconnected: "Connect" button (primary, `LinkOutlined` icon)
- Connected: Status badge + "Disconnect" button (text, `LinkOffOutlined` icon)
- Expiring: Amber badge + "Reconnect" button
- Expired: Red badge + "Reconnect" button
- Connecting: Button disabled with `CircularProgress` (button size)

**Interactions**:
- Connect → `onConnect` → redirect to OAuth URL
- Reconnect → `onConnect` (same flow, preserves configs)
- Disconnect → Opens `DisconnectConfirmDialog`

**Animations**: Badge color transition, button loading state

**Accessibility**: `aria-label` per state ("Connect Zoom", "Disconnect Google Meet", "Reconnect MS Teams")

---

#### 3.13 NEW: `DisconnectConfirmDialog`

> NOTE: An existing `DisconnectConfirmDialog` already exists at `frontend/common/views/dashboard/profile/shared/meeting-configs/DisconnectConfirmDialog.tsx` (imported by `MeetingConfigsManager.tsx`). The NEW component proposed here is for the settings-tab flow and lives at a different path (`frontend/common/views/dashboard/settings/components/meetingIntegrations/DisconnectConfirmDialog.tsx`). Same name, different directory — compiles fine but consider whether the existing profile-side dialog can be reused instead to avoid duplication.

**Purpose**: Confirmation dialog before disconnecting (revoking OAuth) a connected meeting provider.

**File**: `frontend/common/views/dashboard/settings/components/meetingIntegrations/DisconnectConfirmDialog.tsx` (settings-tab side).

**Responsibilities**:
- Wrap `BaseDeleteDialog` (from `@/frontend/common/components/ui/dialog/BaseDeleteDialog`) — do NOT create a raw MUI `Dialog`. NOTE: the actual directory is `dialog/` (singular), NOT `dialogs/` (plural).
- Show provider name + icon in the dialog body.
- Warn that disconnecting will revoke the OAuth token; existing meeting configs for that provider will stop auto-generating URLs until reconnected.
- Call `onConfirm(providerSlug)` which the ViewModel wires to `disconnectMeetingProviderOAuth(providerSlug)`.

**Props/Interface**:
```typescript
interface DisconnectConfirmDialogProps {
  open: boolean;
  providerName: string;         // resolved by ViewModel from labels
  providerSlug: string;
  isLoading: boolean;          // ViewModel mutation loading state
  onConfirm: (providerSlug: string) => void;
  onClose: () => void;
}
```

**BaseDeleteDialog mapping** (actual required props: `open`, `onClose`, `title`, `body`, `cancelLabel`, `confirmLabel`, `isLoading`, `onConfirm`):
- `open` → `open`
- `onClose` → `onClose`
- `title` → i18n key `disconnectWarningTitle` (reuse from `Ui.MeetingConfig` namespace — do NOT duplicate)
- `body` → i18n key `disconnectWarningMessage` (interpolated with `providerName`); the `disconnectWarningImpact` key carries the impact-warning line interpolated into the body
- `cancelLabel` → i18n key `actions.cancel` (REQUIRED — not optional)
- `confirmLabel` → i18n key `actions.disconnect` (the existing `Ui.MeetingConfig` `actions.disconnect` key — fine as-is)
- `isLoading` → `isLoading` (NOT `loading`)
- `onConfirm` → wraps `onConfirm(providerSlug)`

**States**:
- Confirm button shows `CircularProgress` when `isLoading` is true
- If the mutation errors, show `Alert severity="error"` inside the dialog body with a translated message + logger.error from the ViewModel

**Animations**: Dialog slide-in (standard MUI Dialog transition), button loading spinner.

**Accessibility**: `aria-describedby` pointing to the body text; focus trap handled by `BaseDeleteDialog`.

---

#### 3.14 NEW: `OAuthCallbackHandler`

**Purpose**: Auto-detect OAuth callback completion and refresh provider list.

**Responsibilities**:
- Check URL params on mount: `?oauth_status=success&provider=zoom`
- If detected: trigger Apollo cache refetch for `myConnectedMeetingProviders`
- Show success toast: "Successfully connected {Provider}"
- Show error toast if `oauth_status=error`: "Failed to connect {Provider}: {error}"
- Clean URL params after handling (remove `oauth_status`, `provider`, `error`)
- Listen for `window` `focus` event (for popup-based OAuth)

**Implementation**:
```typescript
function OAuthCallbackHandler({ onCallbackDetected }: { onCallbackDetected: (status: string, provider: string, error?: string) => void }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth_status');
    const provider = params.get('provider');
    const error = params.get('error');

    if (oauthStatus && provider) {
      onCallbackDetected(oauthStatus, provider, error ?? undefined);
      // Clean URL
      params.delete('oauth_status');
      params.delete('provider');
      params.delete('error');
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }

    // Also listen for window focus (popup OAuth)
    const handleFocus = () => {
      // Trigger refetch
      onCallbackDetected('focus', '');
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [onCallbackDetected]);
}
```

**Accessibility**: `aria-live="polite"` region for screen reader announcements

---

#### 3.15 NEW: `ReconnectAllAction` (Batch Reconnect)

**Purpose**: Batch action button to reconnect all providers with expiring/expired tokens.

**Responsibilities**:
- Show "Reconnect All ({count})" button when ≥2 providers need reauth
- Sequentially initiate OAuth flow for each provider
- Show progress: "Reconnecting 1 of 3..." with `CircularProgress`
- Toast on completion: "Reconnected {n} providers" or "{n} failed to reconnect"

**Props/Interface**:
```typescript
interface ReconnectAllActionProps {
  expiringProviders: ConnectedMeetingProvider[];
  onReconnect: (providerSlugs: string[]) => Promise<void>;
}
```

**States**:
- Idle: "Reconnect All (3)" button with `SyncOutlined` icon
- Processing: Button disabled, "Reconnecting 1 of 3..." with `CircularProgress`
- Complete: Toast notification with results

**Interactions**: Click → sequentially calls `onConnect` for each provider

**Accessibility**: `aria-label="Reconnect all expiring providers"`, progress announced via live region

---

#### 3.16 `AutoGenerationSupportCallout` (Enhanced)

**Purpose**: Interactive info card explaining auto-generation feature.

**Enhancements**:
- Add "Learn More" expandable section with step-by-step guide
- Add visual illustration (icon-based, not image)
- Add link to create first meeting config

**States**: Collapsed (summary only) → Expanded (step-by-step guide)

**Interactions**: "Learn More" toggles expansion, "Create Config" opens form dialog

**Accessibility**: `aria-expanded` on toggle, `aria-controls` linking to expandable content

---

#### 3.17 `ReauthNeededBanner` (Enhanced)

**Purpose**: Proactive warning banner for expiring/expired tokens.

**Enhancements**:
- Show per-provider "Reconnect" button inline
- Color-coded: amber (<7 days), red (expired)
- Dismissible with "Remind me later" (shows again on next session)
- "Reconnect All" button when ≥2 providers need reauth

**Props/Interface**:
```typescript
interface ReauthNeededBannerProps {
  expiringProviders: ConnectedMeetingProvider[];
  onReconnect: (providerSlug: string) => void;
  onReconnectAll: () => void;
  onDismiss: () => void;
}
```

**States**:
- Expiring (<7 days): `<Alert severity="warning">` with per-provider reconnect
- Expired: `<Alert severity="error">` with per-provider reconnect
- Empty: Not rendered

**Animations**: Alert slide-down on mount, slide-up on dismiss

**Accessibility**: `role="alert"`, `aria-live="assertive"` for expiring, `aria-live="polite"` for reminder

---

#### 3.18 `MeetingConfigFormDialog` (Enhanced)

**Purpose**: Create/edit meeting config form with zod validation.

**Enhancements**:
- Ensure `EntityFormDialogActions` for footer (props: `formId`, `cancelLabel`, **`saveLabel`** — not `confirmLabel`, **`isLoading`** — not `loading`, `onClose`)
- Add zod validation for all fields
- Add "Test Config" button that calls `generateMeetingUrl` for preview
- Show auto-generation preview callout

**Props/Interface**:
```typescript
interface MeetingConfigFormDialogProps {
  open: boolean;
  config: MeetingConfig | null;
  onClose: () => void;
  onSubmit: (values: MeetingConfigFormValues) => Promise<void>;
  mode: "create" | "edit";
}
```

**Zod Schema** (factory pattern, pre-resolved labels — not a `t` function; same shape as `createSessionConfigFormSchema`):
```typescript
// schemas/meetingConfigForm.schema.ts
export function createMeetingConfigFormSchema(labels: Pick<MeetingConfigFormLabels, "nameRequired" | "providerRequired">) {
  return z.object({
    name: z.string().trim().min(1, labels.nameRequired),
    providerSlug: z.string().min(1, labels.providerRequired),
    isDefault: z.boolean(),
    autoGenerate: z.boolean(),
    settings: z.record(z.string(), z.unknown()),
  });
}
export type MeetingConfigFormValues = z.infer<ReturnType<typeof createMeetingConfigFormSchema>>;
```

**States**: Loading (submitting + testing), Error (validation + API), Success (close + toast)

**Interactions**:
- "Test Config" → calls `generateMeetingUrl` → shows preview URL in dialog
- Submit → validates → calls `onSubmit` → closes on success

---

#### 3.19 `ClassMeetingConfigsSection` (Enhanced)

**Purpose**: Class-level meeting configs with generation status.

**Enhancements**:
- Show generation status badge per class instance (pending/success/failed)
- "Retry Generation" button for failed instances
- Copy URL button for generated URLs
- URL expiration display

**Props/Interface**:
```typescript
interface ClassMeetingConfigsSectionProps {
  classConfigs: ClassMeetingConfig[];
  onRetry: (classConfigId: string) => void;
  onCopyUrl: (url: string) => void;
}
```

**States**: Loading, Error, Empty ("No class meeting configs"), Success (list with status badges)

---

#### 3.20 NEW: `TokenExpiryWarning`

**Purpose**: Display token expiration warning for individual provider tokens.

**Responsibilities**:
- Show countdown: "Expires in 5 days" / "Expires in 3 hours" / "Expired"
- Color-coded: green (>14 days), amber (<7 days), red (expired)
- "Reconnect" button inline

**Props/Interface**:
```typescript
interface TokenExpiryWarningProps {
  expiresAt: string | null;
  providerName: string;
  onReconnect: () => void;
}
```

**States**:
- Safe (>14 days): Not rendered (no warning needed)
- Warning (<7 days): Amber chip with "Expires in X days" + reconnect button
- Critical (<24 hours): Red chip with "Expires in X hours" + reconnect button
- Expired: Red chip with "Expired" + reconnect button

**Accessibility**: `role="status"`, `aria-live="polite"` for countdown changes

---

#### 3.21 NEW: `CopyMeetingUrlButton`

**Purpose**: Copy meeting URL to clipboard with toast notification.

**Responsibilities**:
- Copy URL to clipboard via `navigator.clipboard.writeText()`
- Show toast: "URL copied to clipboard"
- Handle clipboard API fallback for older browsers

**Props/Interface**:
```typescript
interface CopyMeetingUrlButtonProps {
  url: string;
  size?: "small" | "medium" | "large";
  variant?: "icon" | "button" | "text";
}
```

**States**:
- Default: `ContentCopyOutlined` icon button with `aria-label`
- Copied: `CheckOutlined` icon (green) for 2 seconds, then reverts
- Error: Toast "Failed to copy URL"

**Interactions**: Click → clipboard copy → icon change → toast

**Accessibility**: `aria-label="Copy meeting URL"`, `aria-pressed` for copied state

---

### Meeting URL Display Components

---

#### 3.22 `MeetingJoinAction` (Enhanced)

**Purpose**: Reusable join meeting button with URL status, copy, and retry.

**Enhancements**:
- Add `showCopyButton` prop for non-admin users
- Add URL status badge (pending/generated/failed/expired)
- Add retry action for failed generations
- Add `expiresAt` display

**Current props** (from `frontend/common/components/ui/display/meetingConfig/types/meetingJoinAction.types.ts`): `joinUrl`, `meeting` (EffectiveMeetingFieldsFragment), `label`, `variant` (`"button"|"action"|"icon"`), `disabled`, `id`, `onJoinAction`, `emptyRole` (`"teacher"|"parent"|"class"`), `setupHref`.

**Target (enhanced) props** (the rewrite this plan proposes):
```typescript
interface MeetingJoinActionProps {
  url: string | null;
  status: "pending" | "generated" | "failed" | "expired";
  expiresAt?: string | null;
  variant: "action" | "button" | "icon";
  showCopyButton?: boolean;
  onRetry?: () => void;
  tooltipContent?: string;
  disabled?: boolean;
}
```

**States**:
- Pending: `CircularProgress` (small) + "URL pending..." chip
- Generated: Join button (primary) + optional copy button
- Failed: Error chip + "Retry" button (if `onRetry` provided)
- Expired: Warning chip + "URL expired" tooltip

**Interactions**:
- Join click → opens URL in new tab (`window.open(url, '_blank', 'noopener,noreferrer')`)
- Copy click → `CopyMeetingUrlButton` behavior
- Retry click → calls `onRetry`

**Accessibility**: `aria-label` per state, `role="button"`, keyboard navigable

---

#### 3.23 NEW: `MeetingUrlStatusBadge`

**Purpose**: Status badge for meeting URL in data tables.

**Responsibilities**:
- Show compact status indicator: pending (spinner), generated (green), failed (red), expired (amber)
- Optional tooltip with details

**Props/Interface**:
```typescript
interface MeetingUrlStatusBadgeProps {
  status: "pending" | "generated" | "failed" | "expired";
  size?: "small" | "medium";
  tooltip?: string;
}
```

**States** (visual):
- Pending: `CircularProgress` (size=16) + "Pending" text, `theme.palette.info.main`
- Generated: `CheckCircleOutlined` icon + "Ready" text, `theme.palette.success.main`
- Failed: `ErrorOutlined` icon + "Failed" text, `theme.palette.error.main`
- Expired: `ScheduleOutlined` icon + "Expired" text, `theme.palette.warning.main`

**Accessibility**: `role="status"`, `aria-label` with full status text, `title` for tooltip

---

#### 3.24 NEW: `MeetingUrlCell`

**Purpose**: Data table cell combining join + copy + status for meeting URLs.

**Responsibilities**:
- Compact layout for data table columns
- Show status badge + join button + copy button (if applicable)
- Handle null URLs gracefully

**Props/Interface**:
```typescript
interface MeetingUrlCellProps {
  url: string | null;
  status: "pending" | "generated" | "failed" | "expired";
  expiresAt?: string | null;
  showCopy: boolean;
  onRetry?: () => void;
}
```

**Desktop**: Inline layout: badge + button(s) inside `<Stack direction="row">` (standard MUI Stack prop — widely used across the codebase in 100+ components; `direction` IS a valid direct prop on `Stack` in MUI v9).
**Mobile**: Card section: badge on top, buttons below

**Accessibility**: `aria-label` describing full state ("Meeting URL ready, click to join")

---

### Shared/New Components

---

#### 3.25 NEW: `MeetingGenerationStatusIndicator`

**Purpose**: Visual indicator for auto-generation states in class meeting configs.

**Responsibilities**:
- Show detailed status with message: pending (with spinner), success (with URL), failed (with error + retry)
- Expandable details for error messages

**Props/Interface**:
```typescript
interface GenerationStatusIndicatorProps {
  status: "pending" | "success" | "failed";
  url?: string | null;
  error?: string | null;
  generatedAt?: string | null;
  expiresAt?: string | null;
  onRetry?: () => void;
  onCopyUrl?: (url: string) => void;
}
```

**States**:
- Pending: `CircularProgress` + "Auto-generating meeting URL..." + pulsing animation
- Success: Green check + "URL generated" + URL display + copy button + expiresAt
- Failed: Red error + error message (expandable) + "Retry Generation" button

**Animations**: Pulse animation on pending, fade-in on status change

---

#### 3.26 NEW: `MeetingProviderLogo`

**Purpose**: Provider-specific logo/icon component.

**Responsibilities**:
- Render correct logo for: Zoom, Google Meet, MS Teams, custom
- Fallback to `VideocamOutlined` icon for unknown providers
- Size variants: small (20px), medium (32px), large (48px)

**Props/Interface**:
```typescript
interface MeetingProviderLogoProps {
  providerSlug: string;
  size?: "small" | "medium" | "large";
}
```

**Implementation**: Use provider-specific SVG icons or MUI icons:
- Zoom: `VideocamOutlined` (blue background)
- Google Meet: `VideoCallOutlined` (multi-color background)
- MS Teams: `GroupsOutlined` (purple background)
- Custom/unknown: `VideocamOutlined` (neutral background)

**Accessibility**: `alt` text "{Provider Name} logo", `role="img"`

---

#### 3.27 NEW: `OAuthConnectionStatusBadge`

**Purpose**: Connection status badge for OAuth provider connections.

**Responsibilities**:
- Show status: connected (green), expiring (amber), expired (red), disconnected (grey)
- Optional expiry countdown text

**Props/Interface**:
```typescript
interface OAuthConnectionStatusBadgeProps {
  status: "connected" | "expiring" | "expired" | "disconnected";
  expiresAt?: string | null;
  size?: "small" | "medium";
}
```

**States**:
- Connected: Green dot + "Connected"
- Expiring: Amber dot + "Expires in X days"
- Expired: Red dot + "Expired"
- Disconnected: Grey dot + "Not connected"

**Accessibility**: `role="status"`, `aria-label` with full status text

---

#### 3.28 NEW: `MeetingBreadcrumb` (Settings + Profile)

**Purpose**: Show contextual breadcrumb navigation for current location (AC-4.5).

**Files**:
- `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsBreadcrumb.tsx` (settings tab)
- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsBreadcrumb.tsx` (profile tab)

**Responsibilities**:
- Render `Breadcrumbs` from `@mui/material/Breadcrumbs` with `aria-label="breadcrumb"`
- Settings tab: "Settings > Meeting Integrations" (non-clickable "Settings", active "Meeting Integrations")
- Profile tab: "Profile > Meeting Configs" (non-clickable "Profile", active "Meeting Configs")
- Both items use i18n-resolved labels from the ViewModel's `labels` prop
- RTL aware: the `>` separator flips automatically in RTL via MUI's `dir` context — no manual flip needed

**Props/Interface**:
```typescript
interface MeetingIntegrationsBreadcrumbProps {
  labels: {
    settingsLabel: string;       // from Dashboard.Settings namespace
    meetingIntegrationsLabel: string; // from Dashboard.SettingsMeetingIntegrations
  };
}
interface MeetingConfigsBreadcrumbProps {
  labels: {
    profileLabel: string;        // from Ui.MeetingConfig or Profile namespace
    meetingConfigsLabel: string; // from Ui.MeetingConfig
  };
}
```

**States**: None (always rendered at top of tab content)

**Interactions**: None (display only; "Settings" / "Profile" are non-clickable context — not navigation links, to avoid circular tab state issues)

**Accessibility**: `aria-label="breadcrumb"`, `aria-current="page"` on the active (last) item.

---

### 3.A Animation Specification

> **Intent**: Provide lightweight, performant animations that guide the user's attention without being distracting. All animations respect `prefers-reduced-motion`.

**Library choice**: Use MUI v9 built-in transitions (`Fade`, `Slide`, `Collapse`, `Grow`) from `@mui/material`. No external animation library (Framer Motion, etc.) — keeps bundle size minimal and aligns with the existing design system.

**Animation inventory**:

| Component | Animation | Duration | Easing | Reduced-motion |
|-----------|-----------|----------|--------|----------------|
| `ReauthNeededBanner` | Slide-down on mount | 300ms | `easeOut` | Instant appear (no slide) |
| `MeetingUrlStatusBadge` | Fade color change on status transition | 200ms | `easeInOut` | Instant color change |
| `CopyMeetingUrlButton` | Icon swap (Link → Check, back) | 150ms | `easeInOut` | Instant swap |
| `MeetingGenerationStatusIndicator` | Spinner → CheckCircle fade | 200ms | `easeOut` | Instant swap |
| `DisconnectConfirmDialog` / `RevokeTokenDialog` / `MeetingConfigFormDialog` | Dialog slide-up + fade | 225ms (standard MUI Dialog) | `easeOut` | Instant appear |
| `TokenExpiryWarning` | Amber pulse on mount (if ≤1 day) | 1s × 2 pulses | `easeInOut` | No pulse |
| `OAuthConnectionStatusBadge` | Dot color transition | 200ms | `easeInOut` | Instant |
| `ProfileLinkCallout` / MeetingConfigsManager header cross-link button | Fade in on mount | 200ms | `easeOut` | Instant |
| Toast notifications | Slide-up + fade (standard Toolpad) | 300ms | `easeOut` | Instant |

**Reduced motion**: All transitions must check `prefers-reduced-motion: reduce` via `useMediaQuery('(prefers-reduced-motion: reduce)')` and disable animation when true. MUI's `Transition` components already respect this natively — wrap custom transitions in a `useReducedMotion` check. For keyframe-based pulses (TokenExpiryWarning), skip the CSS animation entirely.

**No `@keyframes` in component files** — use MUI's `sx` prop with `transition` property or MUI `Transition` components. Only `TokenExpiryWarning`'s pulse may define a `@keyframes` via `sx`'s `@keyframes` block (scoping it to the component).

---

## 4. Data Flow

### OAuth Connect Flow
```
User clicks "Connect"
→ ViewModel calls `connectMeetingProviderOAuth(providerSlug)`
→ Mutation returns `{ authorizeUrl, state }`
→ ViewModel calls `window.location.assign(authorizeUrl)`
→ Browser redirects to provider OAuth page
→ User authorizes
→ Provider redirects to `/api/oauth/{provider}/callback?code=xxx&state=xxx`
→ Callback route stores token, redirects to `returnPath` with `?oauth_status=success&provider=zoom`
→ Page loads with URL params
→ `OAuthCallbackHandler` detects params, triggers Apollo refetch
→ Provider list refreshes, toast shows "Successfully connected Zoom"
→ URL params cleaned
```

### OAuth Disconnect Flow
```
User clicks "Disconnect"
→ `DisconnectConfirmDialog` opens with warning
→ User confirms
→ ViewModel calls `disconnectMeetingProviderOAuth(providerSlug)`
→ Apollo cache evicts affected queries
→ Provider card updates to "Disconnected" state
→ Toast: "Disconnected from {Provider}"
```

### Config CRUD Flow
```
User clicks "Create Config" / "Edit Config"
→ `MeetingConfigFormDialog` opens with zod validation
→ User fills form, clicks "Save"
→ ViewModel validates via zod
→ If valid: calls `createUserMeetingConfig` / `updateUserMeetingConfig` mutation (the GraphQL operations are named `createUserMeetingConfig`/`updateUserMeetingConfig`/`deleteUserMeetingConfig` — NOT `createMeetingConfig`/`updateMeetingConfig`/`deleteMeetingConfig`; see `backend/graphql/mutation/meeting/meeting.mutation.ts`)
→ Apollo cache updates (optimistic or refetch)
→ Dialog closes, toast shows success
→ If error: Alert in dialog with translated error + retry
```

### URL Generation Preview Flow
```
User clicks "Test Config" in form dialog
→ ViewModel calls `generateMeetingUrl(configId)` (preview only)
→ Returns `{ url, providerSlug }` (non-persisting)
→ Preview URL displayed in dialog with copy button
→ Toast: "Preview URL generated (not saved)"
```

### Admin Test Connection Flow
```
Admin clicks "Test Connection" on provider
→ ViewModel calls `testMeetingProviderConnection(providerSlug)`
→ `TestConnectionResultPanel` shows "Testing..."
→ Mutation returns `{ success, latency, endpoint, authStatus }`
→ Panel shows result (success green / failure red + retry)
→ Toast notification
```

### Admin Revoke Token Flow
```
Admin clicks "Revoke Token"
→ `RevokeTokenDialog` (BaseDeleteDialog) opens with warning
→ Admin confirms
→ ViewModel calls `adminRevokeMeetingProviderToken(accountId)`
→ Apollo cache evicts connected accounts
→ Account row updates to "Disconnected"
→ Toast: "Token revoked for {Provider} ({user email})"
```

### URL Status in Data Tables Flow
```
Page loads (teacher schedule / student dashboard / parent dashboard)
→ Apollo query fetches class meeting configs / recurring meeting configs
→ Each row includes `meetingUrl` and `meetingUrlStatus` fields
→ `MeetingUrlCell` renders per row with correct status badge
→ User can copy URL or click join directly from table
→ If URL is pending: skeleton/spinner shown
→ If URL failed: error badge with retry (if backend supports)
```

---

## 5. State Management

### Zustand Store Updates: `meetingIntegrationsSettingsStore`

**Current fields**: providers, connectedAccounts, loading, error

**New fields to add**:
```typescript
interface MeetingIntegrationsSettingsState {
  // Existing
  providers: MeetingIntegrationProvider[];
  connectedAccounts: MeetingIntegrationConnectedAccount[];
  loading: boolean;
  error: string | null;

  // New
  testingProviderSlug: string | null;      // Currently being tested
  revokingAccountId: string | null;        // Currently being revoked
  connectingProviderSlug: string | null;   // Currently initiating OAuth from settings
  testConnectionResult: TestConnectionResult | null;
  metadataDialogAccountId: string | null;  // For TokenMetadataDialog
  credentialFormProvider: MeetingIntegrationProvider | null; // For credential form
  credentialFormMode: "create" | "edit";
}
```

### Zustand Store Updates: `meetingConfigsStore` (profile)

**Current fields**: `connectingSlugs`, `reauthProviderSlugs` (both `useState` **internal** to `useMeetingConfigsManagerViewModel` — NOT returned from the hook), `generationStatus`.

> The hook (`useMeetingConfigsManagerViewModel.ts`) currently **exposes** `reauthProviders` and `requiresReconnect` (lines ~592-637 return object). The `connectingSlugs`/`reauthProviderSlugs` arrays are internal `useState` and are NOT part of the ViewModel's return value. To consume them in the UI (e.g. for the OAuth-callback/connecting spinner), the ViewModel return value must be **extended** to expose them. Pick one:
> - Option A (preferred for read-only display): use the already-exposed `reauthProviders`/`requiresReconnect` instead of the internal slugs.
> - Option B (if the connecting state truly needs to be read): extend the ViewModel return type to include `connectingSlugs`/`reauthProviderSlugs` (and document the new return field).
>
> The new-state additions below assume the ViewModel return value is extended (Option B) so the store/eslint can read them.

**New fields to add**:
```typescript
interface MeetingConfigsState {
  // Existing (internal-only — must be exposed via ViewModel return to consume; see Option B above)
  connectingSlugs: string[];
  reauthProviderSlugs: string[];
  generationStatus: Record<string, GenerationStatus>;

  // New
  oauthCallbackStatus: "idle" | "success" | "error";
  oauthCallbackProvider: string | null;
  oauthCallbackError: string | null;
  reconnectAllProgress: { current: number; total: number; providerSlug: string } | null;
  copiedUrlProvider: string | null;  // For copy button feedback
}
```

### Apollo Cache Strategy

- `myConnectedMeetingProviders` — `fetchPolicy: 'cache-first'`, refetch on OAuth callback
- `userMeetingConfigs` — `fetchPolicy: 'cache-and-network'` for real-time updates
- `classMeetingConfigs` — `fetchPolicy: 'cache-and-network'` for generation status
- `meetingIntegrationProviders` — `fetchPolicy: 'cache-first'` (rarely changes)
- `meetingIntegrationConnectedAccounts` — `fetchPolicy: 'cache-and-network'`

---

## 6. GraphQL Document Changes

### Existing Documents (No Changes Needed)
- `meetingIntegrationProviders` query — `frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents.ts`
- `meetingIntegrationConnectedAccounts` query — same file
- `testMeetingProviderConnection` mutation — same file
- `adminRevokeMeetingProviderToken` mutation — same file
- `myConnectedMeetingProviders` query — `frontend/common/graphql/sharedDocuments/meeting/meeting.documents.ts`
- `connectMeetingProviderOAuth` mutation — same file
- `disconnectMeetingProviderOAuth` mutation — same file
- `generateMeetingUrl` mutation — same file

### New Documents Needed

The new query document follows the project's `TypedDocumentNode` convention (`frontend/common/graphql/sharedDocuments/AGENTS.md`): camelCase query name `classMeetingConfigsWithStatus` → const `classMeetingConfigsWithStatusQueryDocument`, cast as `TypedDocumentNode<Operations.ClassMeetingConfigsWithStatusQuery, Types.QueryClassMeetingConfigsWithStatusArgs>`. `gql` and `TypedDocumentNode` are imported **from `@apollo/client`** (never `@apollo/client/core`). The schema arg is `classInstanceId` (matching the existing `classMeetingConfigs` query at `meeting.documents.ts:223`), the variable must be `$classInstanceId`, and the provider slug lives on the nested `provider { slug }` field (top-level `providerSlug` does **not** exist on `ClassMeetingConfig`).

```typescript
// Add to frontend/common/graphql/sharedDocuments/meeting/meeting.documents.ts
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

const CLASS_MEETING_CONFIG_WITH_STATUS_FIELDS = gql`
  fragment ClassMeetingConfigWithStatusFields on ClassMeetingConfig {
    id
    classInstanceId
    meetingUrl
    meetingUrlStatus       # NEW field (requires backend)
    meetingUrlExpiresAt    # NEW field (requires backend)
    meetingUrlError        # NEW field (requires backend)
    provider {
      id
      slug                  # nested — top-level providerSlug does NOT exist on ClassMeetingConfig
    }
  }
`;

export const classMeetingConfigsWithStatusQueryDocument: TypedDocumentNode<
  Operations.ClassMeetingConfigsWithStatusQuery,
  Types.QueryClassMeetingConfigsWithStatusArgs
> = gql`
  ${CLASS_MEETING_CONFIG_WITH_STATUS_FIELDS}
  query classMeetingConfigsWithStatus($classInstanceId: ID!) {
    classMeetingConfigs(classInstanceId: $classInstanceId) {
      ...ClassMeetingConfigWithStatusFields
    }
  }
`;
```

**Note**: New fields (`meetingUrlStatus`, `meetingUrlExpiresAt`, `meetingUrlError`) require backend changes documented as design constraints. The `provider { slug }` access requires a DataLoader-backed `provider` field resolver (see backend/loader conventions). Frontend should handle null gracefully until backend supports them. After editing the `.documents.ts` file, run `bun run generate:gqlSchema && bun codegen` to generate the `Operations.ClassMeetingConfigsWithStatusQuery` and `Types.QueryClassMeetingConfigsWithStatusArgs` types referenced by the cast.

---

## 7. i18n Translation Keys

### Namespace: `Dashboard.SettingsMeetingIntegrations`

**Existing keys**: (preserved)

**New keys needed**:
```typescript
// Health metrics
totalProviders: string;
connectedProviders: string;
providersWithIssues: string;
disconnectedProviders: string;

// Connect provider action
connectProvider: string;
connecting: string;
connectProviderSuccess: string;
connectProviderError: string;

// Cross-link
viewProfileMeetingConfigs: string;
adminProviderSettings: string;

// Credential form (zod validation)
clientIdRequired: string;
clientSecretRequired: string;
scopesRequired: string;
credentialFormCreateTitle: string;
credentialFormEditTitle: string;
credentialsSaved: string;

// Test connection
// Note: `testConnectionSuccess` duplicates existing `testSuccess` — reuse `testSuccess` instead of adding a new key.
testConnectionIdle: string;
testConnectionTesting: string;
// testSuccess (existing — reused, do NOT add testConnectionSuccess)
testConnectionFailure: string;
retryTest: string;

// Revoke dialog
// Note: `revokeTokenTitle`/`revokeTokenWarning` duplicate existing `actions.revokeConfirmTitle`/`actions.revokeConfirm`.
// Reuse the existing `actions.*` keys; do NOT add revokeduplicates. Only add `revoke`/`tokenRevoked` if missing.
// actions.revokeConfirmTitle (existing — reused)
// actions.revokeConfirm      (existing — reused)
revoke: string;
tokenRevoked: string;

// Token metadata
tokenMetadata: string;
tokenIssuedAt: string;
tokenExpiresAt: string;
tokenScopes: string;
tokenType: string;

// Endpoints
copyEndpointUrl: string;
endpointCopied: string;
```

### Namespace: `Ui.MeetingConfig` (existing — NOT `Dashboard.ProfileMeetingConfigs`)

> The `Dashboard.ProfileMeetingConfigs` namespace does **not** exist. The actual namespace is `Ui.MeetingConfig` (registered in `shared/locale/namespaces/translation.ts` as `Translation.Ui.MeetingConfig`, used at `useMeetingConfigsTabViewModel.ts:17` as `useAppTranslation(Translation.Ui.MeetingConfig)`). The keys below are **additions** to this existing namespace, not a preserved set from a non-existent namespace.

**Existing keys** (in `Ui.MeetingConfig`): the namespace already ships baseline keys (e.g. config dialog fields, provider labels) — see the namespace file at `shared/locale/namespaces/ui/meetingConfig.namespace.ts` (lowercase `ui/`, single `*.namespace.ts` file, NOT a `Ui/MeetingConfig/` directory). The new keys below are additions.

**New keys needed** (additions to `Ui.MeetingConfig`):
```typescript
// OAuth callback
oauthCallbackSuccess: (provider: string) => string;
oauthCallbackError: (provider: string, error: string) => string;

// Reconnect all
reconnectAll: string;
reconnecting: (current: number, total: number) => string;
reconnectAllSuccess: (count: number) => string;
reconnectAllError: (count: number) => string;

// Token expiry
expiresInDays: (count: number) => string;
expiresInHours: (count: number) => string;
expired: string;
reconnect: string;

// Copy URL
copyMeetingUrl: string;
urlCopied: string;
urlCopyFailed: string;

// Generation status
generationPending: string;
generationSuccess: string;
generationFailed: string;
retryGeneration: string;
generationPreviewCallout: string;
testConfig: string;
previewUrlGenerated: string;

// Empty state
connectFirstProvider: string;
connectFirstProviderDescription: string;

// Disconnect warning
disconnectWarningTitle: string;
disconnectWarningMessage: string;
disconnectWarningImpact: string;
```

### Namespace: `Dashboard.MeetingUrlStatus` (NEW)

```typescript
urlPending: string;
urlReady: string;
urlFailed: string;
urlExpired: string;
joinMeeting: string;
copyUrl: string;
retryUrlGeneration: string;
urlNotGenerated: string;
setupMeetingConfig: string;
```

### Namespace: `Dashboard.OAuthFlow` (NEW)

```typescript
connectingTo: (provider: string) => string;
redirectingToProvider: string;
connectionSuccessful: string;
connectionFailed: string;
tokenExpired: string;
tokenExpiringSoon: string;
reconnectNow: string;
remindMeLater: string;
```

### Namespace: `Dashboard.MeetingGeneration` (NEW)

```typescript
autoGenerateEnabled: string;
autoGenerateDescription: string;
generationPreview: string;
generationStatusPending: string;
generationStatusSuccess: string;
generationStatusFailed: string;
generationRetry: string;
generationSuccessRate: string;
generationAvgTime: string;
```

### New-Namespace Registration (REQUIRED for all three new namespaces)

> The three new namespaces — `Dashboard.MeetingUrlStatus`, `Dashboard.OAuthFlow`, and `Dashboard.MeetingGeneration` — do **not** exist yet. Each must be fully registered per `shared/AGENTS.md`. For every new namespace the implementing agent must add:
>
> 1. **Namespace directory + files** under `shared/locale/namespaces/dashboard/<segment>/` (lowercase) following the existing pattern `shared/locale/namespaces/dashboard/settings/meetingIntegrations.namespace.ts` (single `*.namespace.ts` file per namespace, NOT a capitalized `Dashboard/<NamespaceName>/` directory) containing the namespace definition, locale implementations (`en`/`ar`), and the key signatures.
> 2. **Type file + re-export** so the key types are pickable as `Pick<TranslationNamespaces["Dashboard.MeetingUrlStatus"], "x" | "y">`.
> 3. **EN implementation** and **AR implementation** for every key. AR must mirror EN exactly (same keys, translated strings). Interpolation keys are functions `(arg) => string`; pluralization keys are `(count) => string`.
> 4. **`translation.ts` import + `Translation` map entry**: import the namespace in `shared/locale/namespaces/translation.ts` and add it under the `Translation` const at the correct path (e.g. `Dashboard: { MeetingUrlStatus: meetingUrlStatus, OAuthFlow: oauthFlow, MeetingGeneration: meetingGeneration }`). After this step `Translation.Dashboard.MeetingUrlStatus` resolves to the typed namespace.
> 5. **Locale type schema** — add the new namespace's key signatures to `shared/locale/types/message.ts` so the compile-time `Translation`/`TranslationNamespaces` types include it (per `shared/AGENTS.md` step 3). Without this, `Pick<TranslationNamespaces["Dashboard.MeetingUrlStatus"], ...>` will not typecheck.
> 6. **Server-side resolution**: register the namespace path so it resolves server-side. For Server Components use `getTranslations(locale)` (single argument — returns the FULL translations tree) exported from `shared/locale/server.ts`; access the namespace as a property: `const t = await getTranslations(locale); const labels = t.Dashboard.MeetingUrlStatus;`. For API Routes/Scripts/Tests use `getServerTranslations(locale)` (single argument) exported from `shared/locale/server-graphql.ts`: `const t = await getServerTranslations(locale); const labels = t.Dashboard.MeetingUrlStatus;`. GraphQL resolvers use `ctx.t("Dashboard.MeetingUrlStatus")` (already bound to `ctx.locale`).
>
> Consuming components import the enum: `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` (client) / server access via `const t = await getTranslations(locale); const labels = t.Dashboard.MeetingUrlStatus;` (Server Components). Until all six steps land, the type-level `Translation.Dashboard.*` lookups will not compile — schedule this work next to (or folded into) the first PR that references these namespaces.

---

## 8. Error Handling

### Error Code → UI State Mapping

| Error Code | UI State | User Message | Recovery Action |
|------------|----------|--------------|-----------------|

> **i18n note**: All "User Message" strings below are **illustrative English prose** for table readability only. At implementation time, every message MUST be replaced by a typed translation key from the appropriate namespace (`Ui.MeetingConfig`, `Dashboard.MeetingUrlStatus`, `Dashboard.OAuthFlow`, `Dashboard.MeetingGeneration`). Never hardcode these English strings — the compile-time i18n system in `shared/locale/` enforces typed access. The interpolations like `{Provider}` and `{error}` map to typed function signatures (e.g. `oauthCallbackError: (provider: string, error: string) => string`).
| `OAUTH_REDIRECT_FAILED` | Alert in provider card | "Failed to redirect to provider. Please try again." | "Retry" button |
| `OAUTH_CALLBACK_ERROR` | Toast error | "Failed to connect {Provider}: {error}" | "Reconnect" button |
| `OAUTH_TOKEN_EXPIRED` | Red badge on provider | "Token expired. Reconnect to continue." | "Reconnect" button |
| `OAUTH_TOKEN_REVOKED` | Grey badge on provider | "Not connected" | "Connect" button |
| `MEETING_URL_GENERATION_FAILED` | Red error badge | "Failed to generate meeting URL: {error}" | "Retry Generation" button |
| `MEETING_URL_EXPIRED` | Amber warning badge | "Meeting URL expired" | "Regenerate" button |
| `PROVIDER_CONNECTION_FAILED` | Alert in test panel | "Connection test failed: {error}" | "Retry" button |
| `CONFIG_VALIDATION_ERROR` | Field-level error | Translated validation message | Fix field |
| `PERMISSION_DENIED` | Alert | "You don't have permission to perform this action" | None (contact admin) |
| `NETWORK_ERROR` | Alert with retry | "Network error. Check your connection." | "Retry" button |
| `UNKNOWN_ERROR` | Alert | "An unexpected error occurred. Please try again." | "Retry" button |

### Error Recovery User Flows

> Every error path below **MUST** log via `logger.error(...)` (imported from `@/frontend/utils/logger` — never `console.*`) in addition to surfacing a toast/alert. The `logger` call should include the error code/raw message and enough context (provider slug, class instance id) for triage; the toast message is the i18n-translated string shown to the user.

1. **OAuth Connection Failure**: `logger.error("OAuth connect failed", { providerSlug, error })` → Error toast → "Reconnect" button → Re-initiates OAuth flow
2. **URL Generation Failure**: `logger.error("Meeting URL generation failed", { classInstanceId, error })` → Error badge → "Retry Generation" → Calls generateMeetingUrl mutation
3. **Copy URL Failure**: `logger.error("Copy meeting URL failed", { meetingUrl, error })` → Toast "Copy failed" → icon reverts → user can retry
4. **Provider Connection Test Failure**: `logger.error("Provider connection test failed", { providerSlug, error })` → Alert in panel → "Retry" → Re-tests connection
5. **Config Save Failure**: `logger.error("Meeting config save failed", { error })` → Alert in dialog → Fix validation → Resubmit
6. **Revoke Token Failure**: `logger.error("Revoke token failed", { tokenId, error })` → Alert in dialog → Close dialog → Manual retry

### Apollo Error Handling

> Import `useNotifications` from the **subpath** `@toolpad/core/useNotifications` (NOT the bare `@toolpad/core`), then call `const notifications = useNotifications()` inside the ViewModel before using `notifications.show(...)`. Pair each `notifications.show` error branch with a `logger.error(...)` call.

```typescript
import { useNotifications } from "@toolpad/core/useNotifications";
import { logger } from "@/frontend/utils/logger";

// In ViewModel
const notifications = useNotifications();
useQuery(MY_CONNECTED_PROVIDERS, {
  fetchPolicy: 'cache-and-network',
  onError: (error) => {
    const message = error.graphQLErrors?.[0]?.message ?? t('unknownError');
    logger.error("Connected providers query failed", { error });
    notifications.show(message, { severity: 'error' });
  },
});
```

---

## 9. Testing Strategy

### Component Tests (Happy DOM + mocked Apollo)

| Component | Test Cases |
|----------|------------|
| `MeetingIntegrationsHealthHeaders` | Renders 4 metrics, loading skeleton, empty (0), error state |
| `ConnectedAccountsTable` | Renders rows, sorts by column, filters by status, revoke action, metadata action, permission-gated actions, empty state |
| `MeetingProviderCredentialForm` | Renders all fields, zod validation errors, submit success, submit error, password toggle, mode (create/edit) |
| `TestConnectionResultPanel` | Idle state, testing state, success state, failure state, retry button |
| `RevokeTokenDialog` | Opens, confirm triggers revoke, cancel closes, loading state, warning text |
| `TokenMetadataDialog` | Opens, shows metadata, copy token ID, close |
| `ConnectProviderAction` | Button click triggers connect, loading state, error state |
| `ProfileLinkCallout` | Renders, click navigates to profile |
| `ConnectProviderAccount` | Disconnected/connecting/connected/expiring/expired states, connect/disconnect/reconnect actions |
| `OAuthCallbackHandler` | Detects success params, detects error params, cleans URL, focus event |
| `ReconnectAllAction` | Shows when ≥2 providers, sequential progress, completion toast, partial failure |
| `AutoGenerationSupportCallout` | Collapsed/expanded states, learn more toggle, create config action |
| `ReauthNeededBanner` | Warning (expiring), error (expired), per-provider reconnect, reconnect all, dismiss |
| `MeetingConfigFormDialog` | Renders fields, zod validation, test config, submit success/error |
| `ClassMeetingConfigsSection` | Lists configs, generation status badges, retry, copy URL |
| `TokenExpiryWarning` | Safe (>14d), warning (<7d), critical (<24h), expired |
| `CopyMeetingUrlButton` | Copy success, copy error, icon feedback (check → copy) |
| `MeetingJoinAction` | All variants, all states, copy button, retry action |
| `MeetingUrlStatusBadge` | All 4 states, tooltip, accessibility |
| `MeetingUrlCell` | Renders with URL, renders without URL, join + copy, retry |
| `MeetingGenerationStatusIndicator` | Pending with spinner, success with URL, failed with error + retry |
| `MeetingProviderLogo` | Zoom, Google Meet, MS Teams, unknown fallback, size variants |
| `OAuthConnectionStatusBadge` | All 4 states, expiry countdown |

### E2E Tests (Playwright — production server)

| Test | Steps |
|------|-------|
| Admin settings tab | Login as admin → Navigate to settings → Verify health metrics render → Verify connected accounts table → Test connection → View metadata |
| Admin credential form | Login as admin → Settings meeting tab → Edit provider credentials → Fill form → Save → Verify toast |
| Admin revoke token | Login as admin → Settings meeting tab → Revoke token → Confirm → Verify toast |
| Teacher OAuth connect | Login as teacher → Profile meeting tab → Connect Zoom → OAuth redirect → Callback → Verify auto-refresh |
| Teacher config CRUD | Login as teacher → Profile meeting tab → Create config → Edit config → Set default → Delete config |
| Teacher copy URL | Login as teacher → Profile meeting tab → Copy URL → Verify clipboard |
| Teacher schedule URL | Login as teacher → Schedule grid → Verify URL status badges → Copy URL → Join meeting |
| Student join meeting | Login as student → Dashboard → Next class card → Copy URL → Join meeting |
| Parent view student | Login as parent → Dashboard → Student's meeting URLs → Copy → Join |
| Mobile settings | Mobile viewport → Login as admin → Settings meeting tab → Verify mobile layout |
| Mobile profile | Mobile viewport → Login as teacher → Profile meeting tab → Verify mobile layout |
| RTL Arabic | Switch to Arabic → All meeting views → Verify RTL layout |

### Storybook Stories

Every component must have stories for all states:
- Default/Loading/Error/Empty for containers
- All status states for badges/indicators
- All variants for buttons/actions
- Mobile and desktop variants

---

## 10. Design Decisions

### Decision 1: Use `BaseDeleteDialog` for Revoke Token (not raw Dialog)

**Context**: The revoke token dialog currently uses a raw MUI `Dialog` component, which is inconsistent with other delete/confirm dialogs in the project.

**Options Considered**:
1. Keep raw `Dialog` — Pros: No migration needed / Cons: Inconsistent, missing focus trap, no loading state pattern
2. Use `BaseDeleteDialog` — Pros: Consistent with project pattern, built-in focus trap, loading state, translated labels / Cons: Requires migration

**Decision**: Use `BaseDeleteDialog` with custom title/message translations.

**Rationale**: The project's `BaseDeleteDialog` provides built-in accessibility (focus trap, restore), loading state, and consistent styling. All other settings tabs use this pattern. Consistency is a core design goal.

---

### Decision 2: Use `DesktopAppDataGrid` / `MobileCardList` for Connected Accounts (not raw DataGrid)

**Context**: The connected accounts table currently uses a raw MUI `DataGrid` component.

**Options Considered**:
1. Keep raw `DataGrid` — Pros: Already working / Cons: Not responsive, no mobile variant, inconsistent with other tabs
2. Use `DesktopAppDataGrid` + `MobileCardList` — Pros: Responsive, consistent, virtualization, permission-gated columns / Cons: Refactor needed

**Decision**: Use `DesktopAppDataGrid` (desktop) + `MobileCardList` (mobile) with `ResponsiveViewSwitch`.

**Rationale**: Every other settings tab uses the `DesktopAppDataGrid`/`MobileCardList` pattern. Using raw DataGrid breaks mobile support and creates inconsistency. The `DesktopAppDataGrid` also provides built-in virtualization for performance with large account lists.

---

### Decision 3: Auto-Refresh OAuth Callback via URL Params (not manual refresh)

**Context**: After OAuth redirect returns to the profile page, users currently must manually refresh to see their newly connected provider.

**Options Considered**:
1. Manual refresh — Pros: Simple, no code needed / Cons: Poor UX, confusing, users think it failed
2. URL param detection — Pros: Automatic, seamless UX, clean URL after / Cons: Requires `OAuthCallbackHandler` component
3. `window.focus` event — Pros: Works for popup OAuth / Cons: Fragile, may trigger on unrelated focus events
4. `postMessage` from popup — Pros: Reliable for popup flow / Cons: Requires server-side changes for redirect

**Decision**: Use URL param detection (option 2) with `window.focus` fallback (option 3).

**Rationale**: URL param detection is the simplest reliable approach. The OAuth callback route already redirects with URL params (`?oauth_status=success&provider=zoom`). The `OAuthCallbackHandler` component checks these params on mount, triggers Apollo refetch, shows toast, and cleans the URL. The `window.focus` event provides a fallback for popup-based OAuth flows.

---

### Decision 4: Use `DesktopMetricCardGrid` for Health Headers (not raw Card+Grid)

**Context**: Provider health headers currently use raw `Card` + `Grid` components for displaying counts.

**Options Considered**:
1. Keep raw `Card` + `Grid` — Pros: Already working / Cons: Inconsistent, no interactivity, no mobile variant, no standard loading skeleton
2. Use `DesktopMetricCardGrid` / `MobileMetricCardGrid` — Pros: Consistent, interactive (clickable), responsive, built-in loading skeleton / Cons: Refactor needed

**Decision**: Use `DesktopMetricCardGrid` (desktop) + `MobileMetricCardGrid` (mobile).

**Rationale**: `MetricCardGrid` is the project's standard for displaying summary metrics (counts, rates, health). It provides:
- Responsive grid layout (4 columns desktop, 2 columns mobile)
- Loading skeleton state
- Interactive cards (click to filter)
- Consistent metric card design (icon, value, label, color)
- Theme-aware colors (no hardcoded)

---

### Decision 5: Sequential Reconnect All (not parallel)

**Context**: When multiple providers need reauth, a "Reconnect All" batch action should reconnect them.

**Options Considered**:
1. Parallel reconnect — Pros: Faster / Cons: Multiple OAuth redirects simultaneously = browser confusion
2. Sequential reconnect — Pros: One OAuth redirect at a time, clear progress, handles failures per-provider / Cons: Slower
3. Open all OAuth URLs in tabs — Pros: User controls which to authorize / Cons: Popup blockers, confusing UX

**Decision**: Sequential reconnect — one OAuth redirect at a time with progress indicator.

**Rationale**: OAuth requires browser redirect. Opening multiple redirects simultaneously would cause browser confusion. Sequential flow provides clear progress ("Reconnecting 1 of 3...") and handles failures per-provider gracefully. The user can see which providers were reconnected and which failed.

---

## Outcome & Knowledge Transfer Protocol

- **BEFORE Execution**: Executing agents MUST read ALL files in `.ai/plans/auto-meeting-url/ui/outcome/` to absorb prior research.
- **AFTER Execution**: Executing agents MUST write `.ai/plans/auto-meeting-url/ui/outcome/<task-id>-outcome.md` with implementation details.
- **PROGRESS TRACKING**: Executing agents MUST update task checkboxes `[ ]` -> `[x]` in `tasks.md`.

---

## Design Checklist

- [x] All requirements addressed in design
- [x] Component responsibilities well-defined
- [x] Interfaces between components specified (props, state, callbacks)
- [x] Error handling covers expected failures (error code mapping table)
- [x] Security considerations addressed (permissions, token exposure prevention)
- [x] UX/Navigation Specification complete (routes, sidebar, roles, per-audience, mobile/desktop, permissions)
- [x] Data flow documented for all user flows
- [x] State management designed (Zustand store updates)
- [x] i18n translation keys enumerated
- [x] Testing strategy defined (unit, E2E, Storybook)
- [x] Design decisions documented with rationale
