# WhatsApp UI/UX Improvement Requirements

## Document Information

- **Feature Name**: WhatsApp UI/UX Improvements
- **Target Directory**: `.ai/plans/whatsapp/ui-spec`
- **Outcome Directory**: `.ai/plans/whatsapp/ui-spec/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Copilot CLI
- **Parent Plan**: `.ai/plans/whatsapp/` (implementation complete — do NOT modify)
- **Stakeholders**: SUPER_ADMIN, ACADEMY_ADMIN (full CRUD); TEACHER, PARENT, SUPERVISOR, STUDENT (opt-in only)
- **Research Sources**: 6 parallel research subagents (see `outcome/research-*.md`)

## Introduction

The WhatsApp integration plan (`.ai/plans/whatsapp/`) was fully implemented (30 tasks, all [x]) and committed (`62c4ac915`). However, comprehensive review across 6 research threads revealed significant UI/UX gaps that prevent the WhatsApp settings page from being production-ready. This plan addresses ONLY the frontend UI/UX layer — no backend changes.

### Feature Summary
Complete the WhatsApp settings UI: wire create/edit account forms, persist templates, localize all raw enum values, implement deferred opt-in features, add URL-synced tab navigation, validation, loading/error/empty states, animations, mobile/desktop parity, and full test coverage.

### Business Value
A production-ready WhatsApp settings page where admins can manage accounts, credentials, and templates; non-admins can manage opt-in preferences; all users see localized, validated, accessible UI with responsive behavior.

### Scope

**In Scope:**
- Frontend views, components, stores, GraphQL documents, i18n labels
- ViewModel hooks (wiring existing unused mutations)
- App Router loading/error boundaries
- Test coverage (component + ViewModel)
- Mobile/desktop parity
- Navigation, tabs, deep-linking
- Animations and transitions
- Form validation
- Shared component adoption (FormSuccessSnackbar, StatusBadge, etc.)

**Out of Scope:**
- Backend services, repositories, schema changes
- GraphQL resolvers (Pothos) changes
- Webhook handler logic
- Notification dispatch logic
- The parent plan (`.ai/plans/whatsapp/specs.md`, `implementation.md`, `trackable-tasks.md`)

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria
1. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/plans/whatsapp/ui-spec/outcome/` to absorb prior research, search results, and pitfalls.
2. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/plans/whatsapp/ui-spec/outcome/<task-id>-outcome.md` detailing research findings, implementation details, and carry-over points.
3. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `trackable-tasks.md`.
4. WHEN any file is modified THEN system SHALL execute per-file verification (`bun tsgo` + `bun biome:check` + lint-queue) on that specific file.
5. WHEN any subtask is completed THEN system SHALL execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

### Requirement 1: Create/Edit Account Form (UI-REQ-1)

**User Story:** As an academy admin, I want to create a new WhatsApp Business account and edit existing account display names, so that I can manage multiple phone numbers with identifiable names.

#### Acceptance Criteria
1. WHEN admin clicks "Add Account" button THEN system SHALL display a Create Account dialog with fields: display name, phone number ID, WABA ID.
2. WHEN admin fills the create form with valid data and clicks submit THEN system SHALL call `createWhatsappAccount` mutation and refetch the accounts list.
3. WHEN admin fills the create form with invalid data THEN system SHALL show inline validation errors and NOT submit the mutation.
4. WHEN create mutation succeeds THEN system SHALL show success snackbar and close the dialog.
5. WHEN create mutation fails THEN system SHALL show error snackbar with the GraphQL error message and keep the dialog open.
6. WHEN admin clicks "Edit Name" in the account menu THEN system SHALL display an Edit Name dialog pre-filled with the current display name.
7. WHEN admin submits the edit form THEN system SHALL call `updateWhatsappAccount` mutation with the new display name.
8. IF the display name field is empty or exceeds 100 characters THEN system SHALL show a validation error.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Existing `CreateWhatsappAccountMutationDocument`, `UpdateWhatsappAccountMutationDocument` in `whatsapp.documents.ts` (already defined, never wired; exported as camelCase `createWhatsappAccountMutationDocument` / `updateWhatsappAccountMutationDocument` — the PascalCase names refer to the Operations types). Existing form types in `whatsappSettingsTypes.ts` (declared but unused — wire them).
- **Assumptions**: Backend resolvers for create/update already exist and are permission-gated with `WHATSAPP_MANAGE`.

### Requirement 2: Template Persistence & Preview (UI-REQ-2)

**User Story:** As an academy admin, I want templates to persist across page navigations and see a preview of each template's body content, so that I don't lose synced template data on remount and can review template content.

#### Acceptance Criteria
1. WHEN admin navigates to the Templates tab THEN system SHALL query persisted templates from the server (not rely on sync mutation result only).
2. WHEN the synced templates query returns empty THEN system SHALL show the empty state with a "Sync Templates" call-to-action button.
3. WHEN admin clicks "Sync Templates" THEN system SHALL call `syncFromMeta` mutation and update the templates list with the result.
4. WHEN a template row is expanded THEN system SHALL show the template body content, language, category, and button structure.
5. WHEN the page is remounted after a sync THEN system SHALL still show the previously synced templates from the persisted query.
6. IF the templates query fails THEN system SHALL show an error state with a retry button.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: New `WhatsappTemplatesQueryDocument` GraphQL document (not yet defined; the exported constant should be camelCase `whatsappTemplatesQueryDocument` to match the existing convention in `whatsapp.documents.ts` — the PascalCase name refers to the Operations type, not the exported constant). Backend resolver may already exist or needs a thin query wrapper. The new query document MUST include `id` field on each object type selection for Apollo cache normalization.
- **Assumptions**: Templates are stored in the database from the sync operation (backend already persists them).

### Requirement 3: Full i18n Coverage (UI-REQ-3)

**User Story:** As a user in either English or Arabic locale, I want all visible text to be localized, so that I never see raw enum values like "GREEN", "TIER_1K", or "STANDARD" in the UI.

#### Acceptance Criteria
2. WHEN a phone number's quality rating is GREEN THEN system SHALL display the localized "High Quality" label from `t.qualityGreen`.
2. WHEN a phone number's quality rating is YELLOW/RED/ORANGE/unknown THEN system SHALL display the corresponding localized label.
3. WHEN a phone number's tier is TIER_1K/TIER_10K/TIER_100K/TIER_250K/TIER_1M/unknown THEN system SHALL display the corresponding localized label.
4. WHEN a template's status is APPROVED/PENDING/REJECTED/PAUSED/PENDING_DELETION/DISABLED THEN system SHALL display the corresponding localized label.
5. WHEN an account is unverified or in coexistence mode THEN system SHALL show the appropriate warning label.
6. WHEN a delivery failure occurs THEN system SHALL show the localized delivery failure title/body/retry labels.
7. WHEN the TIER_100K enum value is encountered THEN system SHALL display a localized label (currently no i18n key exists for TIER_100K — a new key must be added to the type schema and both locale implementations).
8. WHERE the locale is Arabic THEN system SHALL display all text right-to-left with proper RTL alignment.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Several i18n keys defined in `shared/locale/types/whatsapp/index.ts` and implemented in EN + AR but not yet wired to UI components (exact count requires audit — prior research estimated ~31 but many listed key names were not found in the actual codebase and the true count is smaller). Raw enum values currently rendered in `tabs/shared/NumberCard.tsx` (quality rating, tier, throughput) and `tabs/shared/TemplatesTabContent.tsx` (template status) — values are interpolated directly without i18n translation.
- **Assumptions**: All ~76 existing i18n keys are correct and complete. New keys for create/edit form fields and validation messages need to be added.

### Requirement 4: URL-Synced Tab Navigation (UI-REQ-4)

**User Story:** As a user, I want to deep-link to a specific WhatsApp settings tab, so that I can share or bookmark a URL that opens directly to that tab.

#### Acceptance Criteria
1. WHEN user navigates to `/settings/whatsapp?tab=templates` THEN system SHALL open the Templates tab.
2. WHEN user navigates to `/settings/whatsapp?tab=numbers` THEN system SHALL open the Numbers tab.
3. WHEN user navigates to `/settings/whatsapp?tab=optin` THEN system SHALL open the Opt-in tab.
4. WHEN user navigates to `/settings/whatsapp` with no tab param THEN system SHALL default to the first tab (numbers).
5. WHEN user navigates to `/settings/whatsapp?tab=invalid` THEN system SHALL fall back to the first tab.
6. WHEN user clicks a tab THEN system SHALL update the URL query param via `router.replace` without full page reload.
7. WHEN tab changes THEN system SHALL render the tab content with a Suspense fallback while loading.
8. IF the user lacks the tab's required permission THEN system SHALL show a "Permission Denied" message instead of the tab content.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Migrate from Pattern B (useState) to Pattern A (URL-synced via `useSearchParams` + `router.replace`). Pattern A is already used by the main Settings page. Drop `ssr: false` from lazy loading.
- **Assumptions**: Per-tab Suspense and RequirePermission wrapping follows the existing Pattern A convention.

### Requirement 5: Form Validation & Input Security (UI-REQ-5)

**User Story:** As an admin, I want form validation on credential and account dialogs, so that I cannot submit invalid data and get clear error messages before the server call.

#### Acceptance Criteria
1. WHEN admin enters an access token shorter than 50 characters THEN system SHALL show "Access token appears too short" error and disable submit.
2. WHEN admin enters a two-step PIN that is not exactly 6 digits THEN system SHALL show "PIN must be exactly 6 digits" error and disable submit.
3. WHEN admin enters a display name longer than 100 characters THEN system SHALL show "Display name must be 100 characters or less" error.
4. WHEN admin enters a phone number ID that is not numeric THEN system SHALL show "Phone Number ID must be numeric" error.
5. WHEN admin enters a WABA ID that is not numeric THEN system SHALL show "WABA ID must be numeric" error.
6. WHEN all fields in a form pass validation THEN system SHALL enable the submit button.
7. WHEN a validation error is shown THEN system SHALL NOT call the GraphQL mutation.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Existing form types in `whatsappSettingsTypes.ts`. MUI `TextField` error/helperText props for inline validation display.
- **Assumptions**: Client-side validation complements (does not replace) server-side validation.

### Requirement 6: Deferred Opt-in Features (UI-REQ-6)

**User Story:** As a non-admin user, I want to see a table of my opt-in history with filters and bulk actions, so that I can manage my WhatsApp notification preferences at a granular level.

#### Acceptance Criteria
1. WHEN non-admin user opens the Opt-in tab THEN system SHALL show their current opt-in state AND an opt-in history table.
2. WHEN non-admin user toggles opt-in THEN system SHALL update the state and add an entry to the history table.
3. WHEN non-admin user filters the opt-in history by date range THEN system SHALL show only entries within that range.
4. WHEN non-admin user selects multiple history entries and clicks "Export" THEN system SHALL export the selected entries as CSV.
5. WHEN admin opens the Opt-in tab THEN system SHALL show a consolidated table of all users' opt-in states with search/filter.
6. IF the opt-in history query returns empty THEN system SHALL show an empty state with explanatory message.

#### Additional Details
- **Priority**: Medium
- **Complexity**: High
- **Dependencies**: Tasks 26.3-26.6 from the parent plan (defined but never implemented). May need a new `WhatsappOptInAuditQueryDocument` GraphQL document (the exported constant should be camelCase `whatsappOptInAuditQueryDocument` to match the existing convention in `whatsapp.documents.ts` — the PascalCase name refers to the Operations type, not the exported constant). The new query document MUST include `id` field on each object type selection for Apollo cache normalization. Admin view needs a different layout from non-admin view.
- **Assumptions**: Backend audit trail queries may already exist or need thin query wrappers. The parent plan's Q11 explicitly called for these features.

### Requirement 7: Loading, Error & Empty States (UI-REQ-7)

**User Story:** As a user, I want clear feedback during loading, errors, and empty states, so that I always know what's happening and what to do next.

#### Acceptance Criteria
1. WHEN the accounts query is loading THEN system SHALL show a skeleton loader matching the tab's layout (not just a centered spinner).
2. WHEN the accounts query fails THEN system SHALL show an error state with retry button.
3. WHEN the accounts list is empty THEN system SHALL show an empty state with a call-to-action ("Add Your First WhatsApp Number").
4. WHEN the templates list is empty THEN system SHALL show an empty state with a "Sync Templates" call-to-action.
5. WHEN a specific row is being deleted THEN system SHALL show a per-row loading indicator (linear progress or skeleton) on that row.
6. WHEN a specific row is being synced THEN system SHALL show a per-row sync icon spinner.
7. WHEN a mutation is in progress on a dialog THEN system SHALL disable the submit button and show a spinner.
8. WHEN the page first loads THEN system SHALL show a `loading.tsx` skeleton for the initial server render.
9. WHEN a runtime error occurs in the page THEN system SHALL show an `error.tsx` boundary with a retry button.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: New `loading.tsx` and `error.tsx` files at `app/(dashboard)/settings/whatsapp/`. Per-row loading requires ViewModel to expose `deletingId`, `syncingId` states.
- **Assumptions**: MUI `Skeleton` component for skeleton loaders. `LinearProgress` for per-row loading.

### Requirement 8: Delete Confirmation with Account Name (UI-REQ-8)

**User Story:** As an admin, I want the delete confirmation dialog to show the account's display name, so that I know exactly which account I'm deleting.

#### Acceptance Criteria
1. WHEN admin clicks "Delete" on an account THEN system SHALL show a confirmation dialog that includes the account's display name.
2. WHEN admin clicks "Confirm" in the dialog THEN system SHALL call the delete mutation for that account.
3. WHEN admin clicks "Cancel" in the dialog THEN system SHALL close the dialog without deleting.
4. WHEN the delete mutation is in progress THEN system SHALL disable both buttons and show a spinner.
5. WHEN mobile user clicks "Delete" on an account THEN system SHALL show the same confirmation dialog (not silently delete).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: `DeleteConfirmDialog` already exists in `NumbersTab.desktop.tsx:48-85` and is wired at lines 290-296, but is buggy — it ignores the `state` prop and doesn't render the account name. This plan repairs the existing dialog to show the account name. Mobile `NumbersTab.mobile.tsx` does not have one and needs a separate implementation.
- **Assumptions**: Interpolation key `deleteConfirmMessage` needs to accept a `displayName` parameter in the i18n type schema.

### Requirement 9: Shared Component Adoption (UI-REQ-9)

**User Story:** As a developer, I want the WhatsApp settings page to use shared canonical UI components, so that it is consistent with the rest of the application and easier to maintain.

#### Acceptance Criteria
1. WHEN a mutation success message is shown THEN system SHALL use `FormSuccessSnackbar` instead of the custom `NumbersSnackbar`.
2. WHEN a mutation error message is shown THEN system SHALL use `FormErrorSnackbar` instead of the custom `NumbersSnackbar`.
3. WHEN a status chip is rendered THEN system SHALL use `StatusBadge` with a WhatsApp category mapping instead of inline `Chip` with `statusChipColor`.
4. WHEN the accounts list is rendered on desktop THEN system SHALL use `AppDataGrid` with pagination if more than 10 accounts.
5. WHEN the accounts list is rendered on mobile THEN system SHALL use `MobileCardList` + `MobileCardListItem` for consistent mobile entity display.
6. WHEN the tab bar is rendered THEN system SHALL use `GenericTabNav` via `ResponsiveViewSwitch` (Pattern A tab navigation).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Shared components exist in `frontend/common/components/ui/`. `StatusBadge` needs a WhatsApp status category (APPROVED, PENDING, REJECTED, PAUSED, etc.). `FormSuccessSnackbar`/`FormErrorSnackbar` are the canonical snackbar pattern.
- **Assumptions**: Replacing custom `NumbersSnackbar` with shared snackbar components is a refactor of the ViewModel's snackbar state management.

### Requirement 10: Status Chip Color Completeness (UI-REQ-10)

**User Story:** As an admin, I want each template status to have a distinct visual indicator, so that I can quickly scan the templates list and identify each template's state.

#### Acceptance Criteria
1. WHEN template status is APPROVED THEN system SHALL render a green status badge.
2. WHEN template status is PENDING THEN system SHALL render a yellow/amber status badge.
3. WHEN template status is REJECTED THEN system SHALL render a red status badge.
4. WHEN template status is PAUSED THEN system SHALL render a blue/grey status badge.
5. WHEN template status is PENDING_DELETION THEN system SHALL render an orange status badge.
6. WHEN template status is DISABLED THEN system SHALL render a grey status badge.
7. WHEN template status is unknown THEN system SHALL render a default neutral status badge.

#### Additional Details
- **Priority**: Low
- **Complexity**: Low
- **Dependencies**: Current `statusChipColor.ts` (at `tabs/shared/statusChipColor.ts`) only handles TEMPLATE statuses (APPROVED, PENDING, REJECTED). Needs PAUSED, PENDING_DELETION, DISABLED cases for template statuses. Account-level statuses (quality rating, tier, throughput) are rendered as raw enum values in `NumberCard.tsx` — these need separate localized label helpers. Should migrate to `StatusBadge` with a WhatsApp category.
- **Assumptions**: Theme palette colors (success, warning, error, info, neutral) map to the status semantics.

### Requirement 11: Animations & Transitions (UI-REQ-11)

**User Story:** As a user, I want smooth tab transitions and mutation feedback animations, so that the UI feels polished and responsive.

#### Acceptance Criteria
1. WHEN switching tabs THEN system SHALL apply a subtle fade-in transition (200ms) to the new tab content.
2. WHEN a new account is added to the list THEN system SHALL apply a slide-in animation to the new row/card.
3. WHEN an account is deleted from the list THEN system SHALL apply a fade-out animation before removing the row/card.
4. WHEN a sync is in progress on a row THEN system SHALL show a pulsing sync icon animation.
5. WHEN the opt-in toggle state changes THEN system SHALL show a smooth toggle transition.
6. WHEN a dialog opens THEN system SHALL use MUI's default Dialog transition (fade + scale).
7. WHEN a snackbar appears THEN system SHALL use MUI's default Snackbar slide transition.
8. WHERE the locale is RTL THEN animations SHALL respect RTL direction (slide direction reversed).

#### Additional Details
- **Priority**: Low
- **Complexity**: Low
- **Dependencies**: MUI `theme.transitions.create()` for micro-interactions. No framer-motion needed (keep it simple, use MUI built-in transitions). `@keyframes` may be added to theme if needed.
- **Assumptions**: Animations are subtle and enhances UX, not distract. 200ms duration is the MUI default for transitions.

### Requirement 12: Mobile/Desktop Parity (UI-REQ-12)

**User Story:** As a mobile admin user, I want the same functionality on mobile as desktop, so that I can manage WhatsApp settings from any device.

#### Acceptance Criteria
1. WHEN mobile admin views the Numbers tab THEN system SHALL show all accounts with their quality rating, tier, and status (same info as desktop, compact layout).
2. WHEN mobile admin taps an account THEN system SHALL show an action menu with Edit Token, Edit Pin, Edit Name, Delete, and Sync options.
3. WHEN mobile admin taps "Delete" THEN system SHALL show a confirmation dialog (same as desktop).
4. WHEN mobile admin taps "Edit Token" or "Edit Pin" THEN system SHALL show the credential dialog (same as desktop).
5. WHEN mobile admin taps "Add Account" THEN system SHALL show the create account dialog.
6. WHEN mobile admin views the Templates tab THEN system SHALL show the template list with expandable body preview.
7. WHEN non-admin user opens Opt-in tab on mobile THEN system SHALL show the same opt-in toggle and history as desktop.
8. WHERE the platform is mobile THEN system SHALL use `MobileCardList` for entity lists instead of `AppDataGrid`.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Current mobile `NumbersTab.mobile.tsx` is read-only by design (per Q10 in parent plan). This plan reverses that decision — mobile admins should have full CRUD capability. Mobile needs action menu (Bottom Sheet or Speed Dial), credential dialogs, and delete confirmation.
- **Assumptions**: Mobile dialogs use MUI `Dialog` with `fullScreen` on small viewports or `useMediaQuery` for responsive dialog sizing.

## UX/Navigation Requirements (MANDATORY)

### New Routes & Role-Based Access

| Route | Purpose | Permission | Roles with Access |
|-------|---------|------------|-------------------|
| `/settings/whatsapp` | WhatsApp settings (default tab) | `WHATSAPP_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/settings/whatsapp?tab=numbers` | Numbers tab (deep-link) | `WHATSAPP_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/settings/whatsapp?tab=templates` | Templates tab (deep-link) | `WHATSAPP_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/settings/whatsapp?tab=optin` | Opt-in tab (deep-link) | `WHATSAPP_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, TEACHER, PARENT, SUPERVISOR, STUDENT |
| `app/(dashboard)/settings/whatsapp/loading.tsx` | Route-level loading skeleton | — | — |
| `app/(dashboard)/settings/whatsapp/error.tsx` | Route-level error boundary | — | — |

### Sidebar Navigation Placement
WhatsApp settings appear under the **Integrations** (`grp_integrations`) group in the sidebar, labeled "WhatsApp Settings" (`navItemWhatsappSettings`), icon `hub`. No changes to sidebar structure. Mobile bottom nav does not include WhatsApp (admin-only feature, full CRUD on mobile via page navigation).

### Per-Audience Rendering

| Audience | What They See |
|----------|---------------|
| SUPER_ADMIN / ACADEMY_ADMIN | Numbers tab (full CRUD): accounts list, create/edit/delete, credential management, sync. Templates tab: sync + preview. Opt-in tab: admin view of all users' opt-in states. |
| TEACHER / PARENT / SUPERVISOR / STUDENT | Opt-in tab only: personal opt-in toggle + history. Numbers and Templates tabs hidden. |
| STAFF | Same as admin (if `WHATSAPP_VIEW` permission granted). |
| GUEST | No access (hidden from navigation, permission denied on direct URL). |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Tab navigation | Horizontal tab bar via `GenericTabNav` | Horizontal tab bar via `GenericTabNav` (scrollable if needed) |
| Numbers list | `AppDataGrid` with columns (name, status, quality, tier, actions) | `MobileCardList` with `MobileCardListItem` per account |
| Account actions | Row-level menu (tree-dot menu in AppDataGrid) | Tap to expand card → action menu (Bottom Sheet or Speed Dial) |
| Credential dialogs | Centered `Dialog` | `Dialog` fullScreen on small viewports |
| Delete confirmation | `DeleteConfirmDialog` (centered) | `DeleteConfirmDialog` (fullScreen or Alert) |
| Create account | Centered `Dialog` | `Dialog` fullScreen on small viewports |
| Templates list | `AppDataGrid` with expandable rows | `MobileCardList` with expandable cards |
| Opt-in toggle | Switch with description | Switch with description (same as desktop) |
| Snackbar | Top-center or bottom-center | Bottom-center (above bottom nav) |

### Permission Mapping

| Component / Tab | Permission Required |
|---|---|
| WhatsApp settings page | `WHATSAPP_VIEW` |
| Numbers tab | `WHATSAPP_VIEW` (view), `WHATSAPP_MANAGE` (create/edit/delete/credential) |
| Templates tab | `WHATSAPP_VIEW` (view), `WHATSAPP_TEMPLATES_MANAGE` (sync) |
| Opt-in tab (admin view) | `WHATSAPP_VIEW` |
| Opt-in tab (non-admin) | `WHATSAPP_OPT_IN_MANAGE` (toggle) |
| Create/Edit account form | `WHATSAPP_MANAGE` |
| Delete account | `WHATSAPP_MANAGE` |
| Edit access token / PIN | `WHATSAPP_MANAGE` |
| Sync from Meta | `WHATSAPP_TEMPLATES_MANAGE` |

## Non-Functional Requirements

### Performance Requirements
- WHEN the accounts list has fewer than 50 items THEN system SHALL render without pagination (inline list).
- WHEN the accounts list exceeds 50 items THEN system SHALL paginate using `AppDataGrid` with 20 items per page.
- WHEN switching tabs THEN system SHALL load each tab's content independently via Suspense (no full-page reload).
- WHEN the page first loads THEN system SHALL render `loading.tsx` skeleton within 200ms.

### Security Requirements
- WHEN user lacks `WHATSAPP_VIEW` permission THEN system SHALL deny access and show "Permission Denied" UI.
- WHEN user lacks `WHATSAPP_MANAGE` permission THEN system SHALL hide create/edit/delete actions.
- WHEN credential dialogs are open THEN system SHALL mask the access token field (type="password") by default with a show/hide toggle.
- WHEN form fields contain sensitive data THEN system SHALL NOT log them to console (use `logger` with redaction).

### Usability Requirements
- WHEN any form field has a validation error THEN system SHALL display the error inline with the field and set `aria-invalid` attribute.
- WHEN a dialog is open THEN system SHALL trap focus within the dialog and close on Escape key.
- WHEN a loading state is shown THEN system SHALL use `aria-busy` attribute on the loading container.
- WHEN a snackbar appears THEN system SHALL auto-hide after 6 seconds and provide a close button.
- WHERE the locale is Arabic THEN system SHALL render all layouts right-to-left with proper text alignment.

### Reliability Requirements
- WHEN a GraphQL mutation fails THEN system SHALL show an error message and NOT leave the UI in an inconsistent state.
- WHEN a tab content fails to load THEN system SHALL show an error boundary with retry instead of a blank page.
- WHEN the page encounters a runtime error THEN system SHALL show `error.tsx` boundary with a retry button.
- WHEN a GraphQL query times out THEN system SHALL show a timeout error with a manual refresh button.

## Constraints and Assumptions

### Technical Constraints
- **Runtime**: Bun (not Node.js)
- **Frontend**: React 19, MUI v9 (style props NOT valid — must use `sx`), Apollo Client v4
- **No Zustand store for WhatsApp** (per Q2 in parent plan — state lives in ViewModel hook)
- **No framer-motion** for views (only MUI `theme.transitions` for micro-interactions)
- **No `useLazyQuery`** — use stateful `useQuery` exclusively
- **No `console.*`** — use `logger` from `@/frontend/utils/logger`
- **Path aliases**: all imports use `@/` prefix
- **i18n**: compile-time TypeScript system in `shared/locale/` (not next-intl)

### Business Constraints
- Backend resolvers already exist for create/update account mutations (just not wired in UI)
- Templates are already persisted in the database from sync operations (just no query to fetch them)
- Mobile was intentionally read-only (Q10) — this plan reverses that decision for admin users
- No new database migrations needed

### Assumptions
- The `WhatsappTemplatesQueryDocument` (exported as `whatsappTemplatesQueryDocument` — camelCase convention) backend resolver already exists or can be trivially added (backend stores templates)
- The `WhatsappOptInAuditQueryDocument` (exported as `whatsappOptInAuditQueryDocument` — camelCase convention) backend resolver may need to be added for audit trail
- All ~76 existing i18n keys are correct; a subset needs to be wired to UI components (audit required for exact count)
- The parent plan's implementation is stable and will not be modified

## Success Criteria

### Definition of Done
- [ ] All 12 UI requirements (UI-REQ-1 through UI-REQ-12) are fully implemented
- [ ] No raw enum values visible in the UI (all localized)
- [ ] All ~76+ i18n keys are wired to UI components
- [ ] Create/edit account forms are functional with validation
- [ ] Templates persist across remounts
- [ ] Tabs are URL-synced and deep-linkable
- [ ] Mobile has full admin CRUD parity with desktop
- [ ] Loading, error, and empty states for all tabs
- [ ] Per-row loading indicators for delete/sync
- [ ] Delete confirmation includes account name
- [ ] Shared components (FormSuccessSnackbar, FormErrorSnackbar, StatusBadge) used
- [ ] All animations use MUI theme.transitions (no framer-motion)
- [ ] `loading.tsx` and `error.tsx` route boundaries added
- [ ] Component tests cover all mutation paths
- [ ] ViewModel tests cover create/update/validation flows
- [ ] `bun tsgo`, `bun biome:check`, `bun run lint` all pass with 0 errors

### Acceptance Metrics
- 0 raw enum values rendered in any component (audit via grep)
- 100% i18n key utilization (all keys in type schema are rendered somewhere)
- ≤ 200ms tab switch transition time
- 100% mobile/desktop feature parity for admin actions
- 0 custom snackbar components (all replaced with shared)
- ≥ 90% ViewModel test coverage (create/update/delete/sync/opt-in + validation)

## Glossary

| Term | Definition |
|------|------------|
| Pattern A | URL-synced tab navigation via `useSearchParams` + `router.replace`, used by main Settings page |
| Pattern B | State-only tab navigation via `useState`, currently used by WhatsApp (to be migrated to Pattern A) |
| Tier | Meta's messaging limit tier (TIER_1K, TIER_10K, TIER_100K, TIER_250K, TIER_1M) |
| Quality Rating | Meta's quality assessment (GREEN, YELLOW, RED, ORANGE) |
| WABA ID | WhatsApp Business Account ID |
| Credential Dialog | Dialog for editing access token or two-step PIN |
| ViewModel | `useWhatsappSettingsViewModel` hook managing all WhatsApp settings state |
| ssr:false | Server-side rendering disabled for lazy-loaded views (to be removed) |
| RequirePermission | Shared component that conditionally renders children based on user permission |
| GenericTabNav | Shared tab navigation component used with `ResponsiveViewSwitch` |
