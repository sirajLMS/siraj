> **Source**: Frontend Component Patterns & UI Reusability Review via nvidia/moonshotai/kimi-k3
> **Target Domain / Focus**: `permissions`
> **Date**: 2026-08-29 06:00:54
> **Scope**: `permissions` Views alongside Living Shared UI Primitives & Tier Libraries
> **Verification**: All findings verified against the codebase on 2026-08-29. Verdicts inline (`✔ confirmed`, `~ partially correct`, `✗ wrong/stale`). Corrected line numbers and primitive signatures are authoritative below.

---

# Frontend Component Patterns & UI Reuse Review — `permissions`

## 1. Executive Summary

The `permissions` domain already follows the correct architectural skeleton (Container → ViewModel → `ResponsiveViewSwitch` → shared scaffolds in `__shared__/`, and desktop grids/mobile lists correctly use `DesktopAppDataGrid` / `MobileCardList` with `paginationOptions`). The defects are concentrated in **input reimplementation** (raw `<input>`, legacy standard-variant fields, ad-hoc search boxes) and **display reimplementation** (hand-rolled avatars, profile links, chips, pills, and status indicators).

| Category | Count | Severity Peak |
|---|---|---|
| Reinvented Tables/Grids | 0 (wrappers used correctly) | — |
| Reimplemented Inputs/Pickers | 7 | HIGH |
| Ad-Hoc Chips/Badges/Status | 7 | HIGH |
| Hand-Rolled Avatars & Profile Links | 4 | HIGH |
| Layout / Action Button Bypass | 4 | MED |
| Icon Naming & Form-Label Rules | 3 | MED |
| Hardcoded English UI Strings (found during verification) | 2 | HIGH |
| Tier Isolation / ViewModel | 0 violations | ✔ |

### Verified primitive reference (exact paths & props — use these, not guesses)

- `SearchBarField` — `frontend/common/components/ui/input/searchBarField/SearchBarField.tsx`; props `{ value: string; placeholder: string; searchingLabel?: string; isSearching?: boolean; onChange: (value: string) => void }`. Import from `@/frontend/common/components/ui/input/searchBarField` (NOT re-exported from the parent `input/index.ts` barrel). **Caveat**: always renders `fullWidth` — wrap in a width-constrained Box where the current toolbar uses fixed width (e.g. `sx={{ width: 360 }}`).
- `ButtonGroupSelectorShared` — defined at `frontend/common/components/ui/input/genderSelector/ButtonGroupSelectorShared.tsx`, but **import from `@/frontend/common/components/ui/input`** — `input/index.ts` re-exports `genderSelector`, and the barrel convention mandates the highest available barrel. Generic `<TValue>`; **requires `title` and `ariaLabel`** and renders a label row beside the group — it is NOT a bare segmented control. Adopting it for the overrides mode toggle needs a title/label decision or a light extension.
- Person-profile-link family — shared: `frontend/common/components/ui/display/personProfileLink/` (`PersonProfileLink`, `PersonProfileLinkCell`); desktop: `frontend/desktop/components/ui/display/personProfileLink/` (`DesktopPersonProfileLink`, `DesktopPersonProfileLinkCell`); mobile: `frontend/mobile/components/ui/display/personProfileLink/` (`MobilePersonProfileLink`, `MobilePersonProfileLinkCell`). Props: `{ href?, name, avatarUrl?, showAvatar?, avatarSize?, fallbackInitial?, label?, typographyVariant?, fontWeight?, emphasizeLink? }`. **There is NO `profileHrefForUser` prop** — `profileHrefForUser` is a standalone util (`@/frontend/common/utils/profileHref`) passed via `href`. **Caveat**: `ProfileLinkBase` renders `label` (email) ABOVE the name, while all four hand-rolled blocks render name first — adopting the primitive flips the visual order (already accepted in `userOverridesDataGrid.desktop.tsx`).
- `UserAvatar` — `frontend/common/components/ui/avatar/UserAvatar.tsx`; props `{ src?, label?, size?, variant?, sx?, children? }`; tier wrappers `DesktopUserAvatar` / `MobileUserAvatar` exist. Default fallback styling already matches the hand-rolled avatars (`primaryContainer`/`onPrimaryContainer`).
- `avatarInitials` — exists at `frontend/common/utils/avatar.ts`, but takes `name: string` and does NOT uppercase; the local `getAvatarInitials` takes a user object and DOES uppercase. Not a drop-in — uppercase at call site or extend the util.
- `StatusBadge` — `frontend/common/components/ui/badge/StatusBadge.tsx` (+ `DesktopStatusBadge` / `MobileStatusBadge`); `StatusBadgeCategory` at `frontend/common/components/ui/badge/types/statusBadgeShared.types.ts` (15 categories, `"session"` among them). Adding `"overrideStatus"` = union entry + a `case` in `resolveStatusPaletteKey` (`statusBadgeShared.utils.ts`). **No shared count-badge/pill primitive exists anywhere** — Task 2.1 must CREATE one, not reuse one.
- Action presets — `frontend/common/components/ui/button/ActionButtons.tsx` (`PrimaryPageAction`, `FilterButton`, `ExportButton`); tier variants in `frontend/desktop/components/ui/button/DesktopActionButtons.tsx` and `frontend/mobile/components/ui/button/MobileActionButtons.tsx`.
- `BaseDeleteDialog` — `frontend/common/components/ui/dialog/BaseDeleteDialog.tsx`; props `{ open, onClose, onConfirm, isLoading, title, body, cancelLabel, confirmLabel, fullScreen? }`. Tier variants `DesktopBaseDeleteDialog` / `MobileBaseDeleteDialog` exist but the dominant cross-domain convention (whatsapp, quota) is common `BaseDeleteDialog` + `fullScreen` — which `deleteGroupDialogShared.tsx` already follows.
- `MobileEmptyState` — `frontend/mobile/components/ui/state/MobileEmptyState.tsx`; props `{ title, subtitle?, icon?, sx? }`. **No action/CTA slot** — cannot 1:1 replace the CTA-bearing `CurrentPermissionsEmptyState`.
- `standardInputSx` — `frontend/common/components/ui/form/field/formFieldStyles.ts`; documented as legacy (`frontend/COMPONENT_PATTERNS.md:265`: "avoid for new fields"). `permissionFilterBarShared.tsx` is its LAST component consumer.

---

## 2. Findings Log (verified)

```text
FINDING|HIGH|frontend/desktop/views/dashboard/permissions/components/assignedUsersTab.desktop.tsx:118 (renderCell 115)|Raw native <input type="checkbox"> inside DataGrid renderCell|MUI Checkbox|✔ confirmed. Bypasses theme, a11y, and sizing tokens. Also: hand-built search TextField in toolbar at lines 69-84 → SearchBarField.
FINDING|HIGH|frontend/mobile/views/dashboard/permissions/components/assignedUsersTab.mobile.tsx:62-78,155-160|Hand-styled OutlinedInput search box + native <input type="checkbox"> per card|SearchBarField + MUI Checkbox|✔ confirmed.
FINDING|HIGH|frontend/mobile/views/dashboard/permissions/components/addPermissionFilterBar.mobile.tsx:8-17,26-39|styled("input") raw search input (StyledSearchInput) with absolute-positioned icon|SearchBarField|✔ confirmed.
FINDING|MED|frontend/common/views/dashboard/permissions/components/__shared__/permissionFilterBarShared.tsx:31-51|Legacy standard-variant Input + Select with standardInputSx|SearchBarField + outlined labeled Select|✔ confirmed. standardInputSx deprecated per COMPONENT_PATTERNS.md:265; this file is its last consumer.
FINDING|MED|frontend/desktop/views/dashboard/permissions/components/permissionCatalogToolbar.desktop.tsx:27-54|Ad-hoc search TextField; Select has FormControl but NO InputLabel (floating label missing)|SearchBarField; add InputLabel|~ partially correct: FormControl IS present (only InputLabel missing). Mobile toolbar (permissionCatalogToolbar.mobile.tsx:62-90) has NO Select at all — categories are CategoryChip Buttons; only the search TextField fix applies there.
FINDING|MED|frontend/desktop/views/dashboard/permissions/components/addPermissionFilterBar.desktop.tsx:14-53|Hand-built TextField search (DesktopSearchSlot) + raw Select (DesktopCategorySlot, no label)|SearchBarField + labeled Select|✔ confirmed. NOTE: the shared scaffold `__shared__/addPermissionFilterBarShared.tsx` is a pure slot-rendering layout container with NO inputs — nothing to fix there; fixes belong in the desktop/mobile slot files only.
FINDING|MED|frontend/common/views/dashboard/permissions/components/__shared__/overridesToolbarShared.tsx:46-63,65-80|Custom segmented mode toggle (StyledModeToggleContainer/StyledModeToggleButton) + raw search TextField|ButtonGroupSelectorShared + SearchBarField|✔ confirmed, but ButtonGroupSelectorShared requires `title` + `ariaLabel` and renders a label row — needs adapting, it is not a drop-in segmented control.
FINDING|HIGH|frontend/desktop/views/dashboard/permissions/components/assignedUsersTab.desktop.tsx:126-150 and assignedUsersTab.mobile.tsx:128-161|Hand-rolled avatar + name + email + Link cell|DesktopPersonProfileLinkCell / MobilePersonProfileLink|✔ confirmed (mobile block lives inside AssignedUserCard in a card list, not a DataGrid column). Bonus gap: both ignore user.avatarUrl (initials only) — the primitive fixes that too.
FINDING|HIGH|frontend/mobile/views/dashboard/permissions/components/userOverridesDataGrid.mobile.tsx:37-58|Hand-rolled avatar + Link user header (desktop tier at userOverridesDataGrid.desktop.tsx:38-46 correctly uses DesktopPersonProfileLinkCell)|MobilePersonProfileLink|✔ confirmed tier asymmetry.
FINDING|MED|frontend/common/views/dashboard/permissions/components/__shared__/overridesUserSidebarShared.tsx:27-34,80-87 and userOverridesDataGridShared.tsx:14-21 + userOverridesDataGridShared.helpers.ts:3-12 (getAvatarInitials)|styled Avatar with manual initials|UserAvatar (size=80) + avatarInitials util|✔ confirmed; avatarInitials is not a drop-in (no uppercase, takes name string).
FINDING|HIGH|frontend/common/views/dashboard/permissions/components/OverridesCell.tsx:115-145|Custom "Conflict"/"Healthy" status row with Tooltip|StatusBadge with new "overrideStatus" category (conflict→blocked, healthy→active)|✔ confirmed. Colors use theme tokens (not literally hardcoded), but the strings "Conflict"/"Healthy" ARE hardcoded English — an i18n violation that must be fixed in the same pass.
FINDING|MED|frontend/common/views/dashboard/permissions/components/OverridesCell.tsx:55-113|Custom count pill Boxes for grants/revokes (renderGrants 55-83, renderRevokes 85-113)|New single shared count-pill component in __shared__|✔ confirmed, but NO existing count-badge primitive exists to reuse — it must be created.
FINDING|MED|frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.tsx:130-134 (via slots); permissionGroupsDataGrid.desktop.tsx:144-148; permissionGroupCardList.mobile.tsx:119-123|StatusBadge misused with category="session" (system→active / custom→pending)|Proper category mapping for group type|✔ confirmed at all three call sites.
FINDING|MED|userOverridesDataGridShared.tsx:40-55 (UserGroupsChips); overridesUserSidebarShared.tsx:49-58 (StyledGroupChip); permissionCatalogDataGrid.desktop.tsx:71-81 (UsedInCell); permissionCatalogCardList.mobile.tsx:92-106 (group chips)|Four independent custom secondaryContainer pill implementations|One shared PermissionGroupChip component|✔ confirmed (sidebar variant is styled as a row item; padding diverges px 1 vs 1.5).
FINDING|MED|addPermissionsTab.desktop.tsx:23-32; currentPermissionsTabShared.styles.ts:52-59 (StyledPermissionKeyChipShared); addPermissionsTab.mobile.tsx:37-49; permissionCatalogDataGrid.desktop.tsx:27-45; permissionCatalogCardList.mobile.tsx:31-45|5 divergent permission-key pill implementations|Single shared PermissionKeyChip|~ mostly correct: StyledPermissionKeyChipShared is NOT monospace; permissionCatalogCardList.mobile uses primaryContainer vs surfaceVariant elsewhere. Consolidation is still warranted.
FINDING|MED|frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.tsx:31-86|Custom StyledBackButton / StyledBackToGroupsButton / StyledEditButton|Tier FilterButton / PrimaryPageAction presets via slots|✔ confirmed. ALSO: hardcoded English strings "Back to All Groups" (line 151) and "Edit Group Details" (line 159) bypass the labels/t pattern — i18n violation, add to fix scope.
FINDING|LOW|overridesDialogFooterShared.tsx:12-26 (StyledCancelButton/StyledSaveButton); assignGroupDialogShared.tsx:76-92 (Assign submit only); addPermissionBulkBarShared.tsx:33-45 (StyledAssignButton)|Custom styled Cancel/Save/Assign buttons|Preset-button-based shared footer (template: subjects' EntityFormDialogActions)|~ partially stale: assignGroupDialogShared's Cancel button is ALREADY extracted to SharedDialogCancelButton (__shared__/sharedDialogButtons.tsx); only its Assign submit remains.
FINDING|MED|permissionRowShared.tsx:3 (Lock); permissionFilterBarShared.tsx:3 (Search); permissionGroupFormShared.tsx:3 (Close)|Non-Outlined icon names|LockOutlined / SearchOutlined / CloseOutlined|✔ confirmed (all at line 3).
FINDING|LOW|frontend/common/views/dashboard/permissions/components/__shared__/deleteGroupDialogShared.tsx|Common BaseDeleteDialog used for both tiers|— |✗ weakly grounded: this matches the dominant cross-domain convention (whatsapp NumbersDeleteConfirmDialog, quota detail both use common BaseDeleteDialog + fullScreen prop). Treat as verification-only; no change required.
FINDING|LOW|currentPermissionsTabShared.tsx:13-27 (custom icon-circle empty state) + currentPermissionsTab.mobile.tsx:23-35|Mobile reuses shared custom empty state (23-25) AND has bare centered-text fallback (27-35)|MobileEmptyState for the bare-text fallback only|~ partially correct: mobile is NOT purely bare text — it reuses CurrentPermissionsEmptyState first. MobileEmptyState has no action slot, so it can only replace the bare-text fallback (lines 27-35), not the CTA-bearing state.
```

---

# Frontend Component Patterns & UI Reuse Refactoring Plan (`permissions`)

## Non-Negotiable Execution Protocol

Every file edit MUST be followed immediately by:

```bash
bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
```

(`tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file`, progressive short-circuit, exit code 0 mandatory.)

Every task `X.Y` includes the mandatory 5-subtask breakdown: `X.Y.QL` Quality Loop, `X.Y.TE` Test Engineering, `X.Y.SEC` Security & Tenancy, `X.Y.SR` Semantic Review, `X.Y.IV` Instruction Verification.

Test Engineering conventions (per `frontend/common/components/ui/AGENTS.md`): new/updated component tests live in `test/ui/components/permissions/` mirroring the component structure; test mobile and desktop variants separately; the switcher test mocks the viewport (Task 4.1). No DB-layer tests apply to this plan.

---

## Selectors, Autocompletes & Search Inputs Consolidation

### Task 1.1 — Introduce `SearchBarField` across all permission search inputs
Replace the bespoke search fields with the shared primitive (exact props: `value`, `placeholder`, `onChange`, optional `isSearching`/`searchingLabel`). Import from `@/frontend/common/components/ui/input/searchBarField`. Because `SearchBarField` is always `fullWidth`, wrap it in a width-constrained Box where the current toolbar used fixed width.

- Files: `__shared__/permissionFilterBarShared.tsx` (Input at 31-42), `__shared__/overridesToolbarShared.tsx` (65-80), `permissionCatalogToolbar.desktop.tsx` (27-43), `permissionCatalogToolbar.mobile.tsx` (62-79), `addPermissionFilterBar.desktop.tsx` DesktopSearchSlot (14-30) + `addPermissionFilterBar.mobile.tsx` (delete `StyledSearchInput` at 8-17 and adornment 26-39), `assignedUsersTab.desktop.tsx` toolbar (69-84), `assignedUsersTab.mobile.tsx` (replace hand-styled `OutlinedInput` at 62-78).
- Do NOT touch `__shared__/addPermissionFilterBarShared.tsx` — it is a pure slot-layout container with no inputs.
- [ ] 1.1.QL **Quality Loop**: run sub-loop per edited file (exit 0).
- [ ] 1.1.TE **Test Engineering**: Happy-DOM tests asserting each toolbar renders a single search input wired to `onSearchChange`; remove obsolete styled-input assertions.
- [ ] 1.1.SEC **Security & Tenancy Audit**: search terms are local filter state only (no privilege-bearing queries); confirm no permission data leaks into uncontrolled DOM attributes.
- [ ] 1.1.SR **Semantic Review**: no raw `<input>`/hand-styled `OutlinedInput` search remains in `permissions/**`.
- [ ] 1.1.IV **Instruction Verification**: floating-label / placeholder conventions per `COMPONENT_PATTERNS.md` Forms section.

### Task 1.2 — Category selects: floating labels + outlined variant
- `permissionFilterBarShared.tsx`: replace `Input`+`Select variant="standard" displayEmpty` with `FormControl + InputLabel + Select` outlined; remove `standardInputSx` import (this retires the last consumer of the deprecated helper).
- `permissionCatalogToolbar.desktop.tsx`: its Select already has `FormControl` — only add the missing `InputLabel`.
- `addPermissionFilterBar.desktop.tsx` DesktopCategorySlot: add `FormControl + InputLabel`.
- `permissionCatalogToolbar.mobile.tsx`: NO Select exists (categories are chip Buttons) — out of scope for this task.
- [ ] 1.2.QL / 1.2.TE / 1.2.SEC / 1.2.SR / 1.2.IV

### Task 1.3 — Replace raw checkboxes with MUI `Checkbox`
- `assignedUsersTab.desktop.tsx:118` checkbox `renderCell`, `assignedUsersTab.mobile.tsx:155-160` card checkbox → MUI `Checkbox` (proper `aria-label` from labels; drop inline `style={{ width: 20, height: 20 }}`).
- [ ] 1.3.QL / 1.3.TE (toggle callbacks) / 1.3.SEC (selection ids are UUIDs already scoped by group) / 1.3.SR / 1.3.IV

### Task 1.4 — Overrides mode toggle → `ButtonGroupSelectorShared`
- Replace `StyledModeToggleContainer`/`StyledModeToggleButton` (overridesToolbarShared.tsx:46-63) with `ButtonGroupSelectorShared` imported from `@/frontend/common/components/ui/input` (highest barrel). NOTE: it requires `title` + `ariaLabel` props and renders a label row — supply a visually-consistent title (or use `options.buttonSx`/layout options) rather than forcing a drop-in swap.
- [ ] 1.4.QL / 1.4.TE / 1.4.SEC / 1.4.SR / 1.4.IV

---

## Status Badges, Avatars, Profile Links & Chip Consolidation

### Task 2.1 — OverridesCell status/grant pills → StatusBadge family
- Extend `StatusBadgeCategory` with `overrideStatus` (union entry in `statusBadgeShared.types.ts` + palette case in `statusBadgeShared.utils.ts`; conflict→blocked, healthy→active) and use tier `StatusBadge` via slot. Keep the Tooltip as a caller-side wrapper (StatusBadge supports `icon`; conflict-detail tooltip stays caller-side).
- Replace grants/revokes pill Boxes (OverridesCell.tsx:55-113) with ONE new shared count-pill component in `__shared__` — none exists in the codebase today, so create it (do not search for one to reuse).
- Same pass: route the hardcoded strings "Conflict"/"Healthy" through the i18n system (violation found during verification). Per `frontend/common/views/AGENTS.md` Rule 7: add keys to the permissions namespace in `shared/locale/`, expose them on the ViewModel `labels`/`labelsBySection` object, and pass down as props — components must NOT call `useAppTranslation` themselves.
- [ ] 2.1.QL / 2.1.TE (badge category/status/label triads; tooltip retained) / 2.1.SEC / 2.1.SR (no inline palette chips, no hardcoded strings) / 2.1.IV

### Task 2.2 — Eliminate hand-rolled user identity blocks
- `assignedUsersTab.desktop.tsx` (126-150) name column → `DesktopPersonProfileLinkCell`; `assignedUsersTab.mobile.tsx` (128-161, inside AssignedUserCard) → `MobilePersonProfileLink`; `userOverridesDataGrid.mobile.tsx` (37-58) → `MobilePersonProfileLink`; `overridesUserSidebarShared.tsx` 80px avatar (80-87) → `UserAvatar size={80}`; delete `StyledUserAvatar` styled wrappers and `getAvatarInitials` (userOverridesDataGridShared.helpers.ts:3-12).
- Props mapping: `href={profileHrefForUser(user.id)}`, `name`, `avatarUrl`, `label={email}`, `avatarSize` — there is NO `profileHrefForUser`/`initials` prop on the primitives.
- Accept the primitive's visual order (email label rendered above name — matches the already-conformant `userOverridesDataGrid.desktop.tsx`); this also fixes the ignored `user.avatarUrl` in assignedUsersTab.
- `avatarInitials` (`@/frontend/common/utils/avatar`) does not uppercase — rely on `UserAvatar`'s internal fallback or uppercase at call site; do not assume drop-in.
- [ ] 2.2.QL / 2.2.TE (profile hrefs preserved) / 2.2.SEC (no user PII beyond existing props) / 2.2.SR / 2.2.IV

### Task 2.3 — Single shared `PermissionKeyChip` + `PermissionGroupChip`
- Create both in `permissions/components/__shared__/`, driven by theme tokens (monospace + `surfaceVariant` for key chip; `secondaryContainer` for group chip).
- Replace all 5 key-pill implementations (`addPermissionsTab.desktop.tsx:23-32`, `currentPermissionsTabShared.styles.ts:52-59` — note this one is NOT monospace today, normalize it, `addPermissionsTab.mobile.tsx:37-49`, `permissionCatalogDataGrid.desktop.tsx:27-45`, `permissionCatalogCardList.mobile.tsx:31-45` — this one uses primaryContainer, normalize to surfaceVariant) and 4 group-pill implementations (`userOverridesDataGridShared.tsx:40-55`, `overridesUserSidebarShared.tsx:49-58`, `permissionCatalogDataGrid.desktop.tsx:71-81`, `permissionCatalogCardList.mobile.tsx:92-106`).
- [ ] 2.3.QL / 2.3.TE / 2.3.SEC / 2.3.SR / 2.3.IV

### Task 2.4 — Fix `StatusBadge category="session"` misuse + icon naming
- Introduce correct mapping for group type badge at the three call sites (`singleGroupHeaderShared.tsx:130-134` via slots, `permissionGroupsDataGrid.desktop.tsx:144-148`, `permissionGroupCardList.mobile.tsx:119-123`) — e.g. extend the `overrideStatus`-style approach with a `groupType` category, or use plain non-status presentation where no semantic status exists.
- Swap `Lock`/`Search`/`Close` → `LockOutlined`/`SearchOutlined`/`CloseOutlined` at `permissionRowShared.tsx:3`, `permissionFilterBarShared.tsx:3`, `permissionGroupFormShared.tsx:3`.
- i18n fix in same pass: `singleGroupHeaderShared.tsx:151,159` hardcoded "Back to All Groups" / "Edit Group Details" → add to the permissions locale namespace and consume via the ViewModel-provided `labels` props (Rule 7 — no `useAppTranslation` in components; group into the existing labels shape rather than adding flat string props).
- `deleteGroupDialogShared.tsx`: **NO CHANGE** — verification showed common `BaseDeleteDialog` + `fullScreen` is the established cross-domain convention (whatsapp, quota do the same).
- [ ] 2.4.QL / 2.4.TE / 2.4.SEC (delete gating for `isSystem` groups unchanged) / 2.4.SR / 2.4.IV

---

## Layout, Action Buttons & Empty States

### Task 3.1 — Replace bespoke action buttons with action presets
- `singleGroupHeaderShared.tsx` (StyledBackButton 31-39, StyledBackToGroupsButton 69-75, StyledEditButton 77-86) → slot-injected tier `FilterButton`/`PrimaryPageAction`.
- `overridesDialogFooterShared.tsx` (12-26), `addPermissionBulkBarShared.tsx` (StyledAssignButton 33-45), and `assignGroupDialogShared.tsx` Assign submit (76-92) → preset-based footer; template: `EntityFormDialogActions` (subjects domain) — extend the existing `SharedDialogCancelButton` (`__shared__/sharedDialogButtons.tsx`) rather than starting over.
- [ ] 3.1.QL / 3.1.TE (handlers + loading/disabled parity) / 3.1.SEC (mutation buttons still permission-gated upstream) / 3.1.SR / 3.1.IV

### Task 3.2 — Empty state standardization
- `currentPermissionsTab.mobile.tsx:27-35` bare centered-text fallback → `MobileEmptyState` (`title` from labels). Scope limited to this fallback: `MobileEmptyState` has no action slot, so it cannot replace the CTA-bearing `CurrentPermissionsEmptyState` (mobile lines 23-25) — keep that shared state (optionally drop its custom icon-circle styling per tier badge/panel conventions).
- [ ] 3.2.QL / 3.2.TE / 3.2.SEC / 3.2.SR / 3.2.IV

---

## Verification Sweep (no structural change expected)

### Task 4.1 — Tier isolation & ViewModel audit confirmation
- Confirm no `useMediaQuery`/`useViewport` in any `.desktop.tsx`/`.mobile.tsx`/ViewModel; confirm all grids/lists keep mandatory `paginationOptions` after refactors; confirm switcher (`PermissionManagementContainer`) untouched semantics.
- [ ] 4.1.QL / 4.1.TE (switcher-render test with mocked viewport) / 4.1.SEC (RequirePermission boundaries intact) / 4.1.SR / 4.1.IV

---

## Files Changed Summary Table

| File | Change |
|---|---|
| `__shared__/permissionFilterBarShared.tsx` | SearchBarField + outlined labeled Select (retires last `standardInputSx` consumer); SearchOutlined |
| `__shared__/overridesToolbarShared.tsx` | ButtonGroupSelectorShared (with required title/ariaLabel) + SearchBarField |
| `addPermissionFilterBar.desktop.tsx` + `addPermissionFilterBar.mobile.tsx` | SearchBarField + labeled Select; delete `StyledSearchInput`. (Shared scaffold `addPermissionFilterBarShared.tsx` untouched — pure layout.) |
| `permissionCatalogToolbar.desktop.tsx` | SearchBarField + add missing InputLabel to existing FormControl Select |
| `permissionCatalogToolbar.mobile.tsx` | SearchBarField only (no Select exists — chip categories stay) |
| `assignedUsersTab.{desktop,mobile}.tsx` | SearchBarField, MUI Checkbox, tier PersonProfileLink (also gains avatarUrl support) |
| `userOverridesDataGrid.mobile.tsx` | MobilePersonProfileLink |
| `overridesUserSidebarShared.tsx`, `userOverridesDataGridShared.tsx` (+helpers) | UserAvatar; drop getAvatarInitials |
| `OverridesCell.tsx` | StatusBadge with new `overrideStatus` category; new shared count pill; localize Conflict/Healthy strings |
| New: `__shared__/permissionKeyChipShared.tsx`, `permissionGroupChipShared.tsx` | Single chip primitives; 9 call sites migrated (normalize non-mono + primaryContainer outliers) |
| `singleGroupHeaderShared.tsx`, `overridesDialogFooterShared.tsx`, `assignGroupDialogShared.tsx`, `addPermissionBulkBarShared.tsx` | Tier action-button presets via slots; extend SharedDialogCancelButton pattern |
| `singleGroupHeaderShared.tsx`, `permissionGroupsDataGrid.desktop.tsx`, `permissionGroupCardList.mobile.tsx` | Fix `category="session"` StatusBadge misuse; localize Back/Edit strings |
| `permissionRowShared.tsx`, `permissionGroupFormShared.tsx` | `*Outlined` icons (imports at line 3) |
| `currentPermissionsTab.mobile.tsx` | MobileEmptyState for bare-text fallback (27-35) only |
| `deleteGroupDialogShared.tsx` | NO CHANGE (common BaseDeleteDialog + fullScreen is the established convention) |
