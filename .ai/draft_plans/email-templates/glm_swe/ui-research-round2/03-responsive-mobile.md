# Round 2 Audit — Responsive, Mobile & Tier Separation

## Summary

The v6 design establishes a solid tier-neutral ViewModel + switcher + Container architecture with explicit `frontend/mobile/views/` and `frontend/desktop/views/` tiers. However, **the Frontend section (lines 781-1096) and i18n section (lines 1097-1187) lack explicit responsive/mobile definitions for 9 of 10 audit categories**. The design describes *what* components exist but not *how they adapt* across breakpoints, touch, SafeArea, or mobile-first patterns. This audit identifies 4 Critical, 6 High, 8 Medium, and 5 Low-priority gaps with specific v7 edits.

---

## Critical Gaps

### 1. No responsive column hiding strategy for AppDataGrid (List View)
**Design references:** §C lines 860-870 define 7 columns.  
**Gap:** Zero definition of which columns hide at `xs` (<600px), `sm` (600-900px), `md` (900-1200px).  
**Codebase reality:** `AppDataGrid.tsx` wraps MUI X DataGrid v9 but **does not expose `columnVisibilityModel` or responsive column hiding**. The `slots` prop explicitly excludes `pagination` but has no column visibility configuration. MUI X DataGrid v9 supports `columnVisibilityModel` + `onColumnVisibilityModelChange` — but this is not wired.  
**Impact:** Mobile list will render all 7 columns horizontally (overflow) or require horizontal scroll — unusable on 375px.

### 2. Inspector panel on mobile — no Drawer anchor defined
**Design references:** §D line 911 says "bottom-anchored `<Drawer anchor='bottom'>`" for mobile inspector.  
**Gap:** No definition of:  
- Drawer max height (85vh like filter drawers? `maxHeight: "85vh"` in mobile filter drawer line 189)  
- Whether it blocks the soft keyboard (critical: Inspector must stay accessible above keyboard)  
- Swipe-to-dismiss gesture (mobile pattern: swipe down to close bottom sheet)  
- Backdrop click behavior  
- Whether the header `TuneOutlined` IconButton has `aria-expanded` + `aria-controls`

### 3. Preview tab viewport selector on mobile — no alternative defined
**Design references:** §E line 939: "On mobile tier: iframe is full-width (selector hidden)".  
**Gap:** "Hidden" is not a mobile pattern. A **mobile viewport simulator makes no sense on a mobile device**. Idiomatic alternatives not defined:  
- Remove selector entirely (assume mobile viewport = device)  
- Show "Desktop preview" link opening new tab at `/email-templates/[id]?viewport=desktop`  
- Toggle between "Mobile preview (current)" / "Desktop preview" via segmented control  
**Impact:** If selector renders hidden but exists in DOM, it adds dead code and confusion.

### 4. Send Test dialog — no mobile bottom sheet pattern
**Design references:** §F line 945: "MUI `<Dialog>` + `EntityFormDialogActions`".  
**Gap:** On mobile, a centered modal is non-idiomatic. Should be a **bottom sheet (Drawer anchor="bottom")** matching the localizedStringDrawer pattern (line 280: `anchor="bottom"`). No definition for:  
- Sample props editor: single column stack on mobile vs two-column desktop  
- Rate-limit notice: toast vs inline banner (design says inline error but not mobile variant)  
- "Send to my own email" quick button placement

---

## High-Priority Gaps

### 5. Three-tab Design/Preview/Code — mobile tab behavior undefined
**Design references:** §D lines 893-903 describe `<Slide>` transitions.  
**Gap:** On mobile, three tabs may not fit horizontally. MUI `Tabs` supports `variant="scrollable"` but design doesn't define:  
- Use `variant="scrollable"` with `scrollButtons="auto"` on mobile?  
- Or convert to **segmented control** (toggle button group) on mobile?  
- Tab labels: full "Design/Preview/Code" vs icons only on `xs`?  
- Slide animation direction on mobile (horizontal swipe gesture support?)

### 6. Save/Publish/Send Test actions — no sticky bottom bar on mobile
**Design references:** §D line 916: "sticky bottom of Inspector (`EntityFormDialogActions` slot)".  
**Gap:** On mobile, the Inspector is a bottom Drawer — actions at its bottom are **buried above the keyboard**. Need a **sticky bottom action bar** (fixed, above SafeArea inset) that:  
- Persists when Inspector Drawer is closed  
- Uses `pb: env(safe-area-inset-bottom)` (pattern exists in `bottomNavbar.mobile.tsx:29` and `localizedStringDrawer.desktop.tsx:193`)  
- Shows primary (Save Draft), secondary (Publish), tertiary (Send Test) with correct hierarchy

### 7. Merge-tag picker — no mobile full-screen modal definition
**Design references:** §D lines 912-915: `VariableMentionPicker` as popover.  
**Gap:** On mobile, a popover is too small for variable selection. Should be **full-screen modal** (Drawer anchor="bottom" with `maxHeight: 100%` or Dialog `fullScreen={true}`). No definition for:  
- Search/filter within picker on mobile  
- Recent/frequently used section  
- Keyboard dismissal on item tap

### 8. TipTap editor mobile UX — no touch-optimized toolbar definition
**Design references:** §D line 916 mentions TipTap; §B line 820 mentions `ScopedCssBaseline`.  
**Gap:** `@react-email/editor` bundles TipTap but **no mention of**:  
- `TouchSensor` vs `PointerSensor` for dnd-kit in editor (design installs `@dnd-kit/core` + `sortable`)  
- Floating bubble menu position on mobile (above selection vs fixed bottom)  
- Slash command menu mobile layout (full-width vs popover)  
- Whether editor auto-focuses on mobile (soft keyboard covers 50% viewport)  
- Block type selector on mobile (dropdown vs segmented control)

### 9. Keyboard appearing — Inspector accessibility not addressed
**Design references:** §D line 911 (mobile Inspector Drawer).  
**Gap:** When soft keyboard opens on mobile:  
- The bottom-anchored Inspector Drawer **will be pushed up or covered**  
- No definition for: `resize` observer to adjust Drawer `maxHeight`, `visualViewport` API, or `keyboard-aware-scroll-view` pattern  
- MUI Drawer has no built-in keyboard awareness

### 10. Pull-to-refresh on mobile list view — not defined
**Design references:** §C line 860 DataGrid usage.  
**Gap:** Mobile lists should support **pull-to-refresh** (swipe down from top). MUI DataGrid doesn't have this built-in. Need wrapper component or `react-pull-to-refresh` integration. Design mentions "Phase 2" for bulk actions but omits this mobile-native pattern.

---

## Medium-Priority Gaps

### 11. Swipe-to-archive on mobile list rows
**Design references:** §C line 870 row actions menu (icon button → Menu).  
**Gap:** iOS/Android mail apps use **swipe left → Archive/Delete**. No definition for:  
- `@dnd-kit` sortable with `KeyboardSensor` + `TouchSensor` for swipe actions  
- Or MUI `SwipeableDrawer` pattern per row  
- Undo toast after swipe action

### 12. Tap vs long-press distinction
**Design references:** §C line 865 "Clickable row click → navigate to editor".  
**Gap:** No definition for:  
- Tap = navigate to editor  
- Long-press = context menu (Edit/Preview/Duplicate/Archive)  
- This is standard mobile list behavior; current design only has icon-button menu

### 13. Search bar collapse on mobile
**Design references:** §C line 876-878: Search in page header actions slot.  
**Gap:** On mobile, header actions stack vertically (`MobilePageHeader.tsx:149` `flexDirection: "column"`). Search input becomes full-width. No definition for:  
- Collapse to search icon (magnifier) → tap expands to full-width input  
- Or keep full-width (current) but ensure it doesn't push Create button off-screen

### 14. Filter chips horizontal scroll on mobile
**Design references:** §C lines 879-885: Scope, Status, Locale, Segmented view control.  
**Gap:** Four filter groups won't fit on 375px. No definition for:  
- `HorizontalScrollRow` (exists as `MobileHorizontalScrollRow` in mobile primitives)  
- Or collapsible "Filters" bottom sheet (like `searchScheduleFilterDrawer.mobile.tsx`)  
- Active filter count badge positioning

### 15. Pagination: numbered pages desktop vs "Load more" mobile
**Design references:** §C line 886: `ListPaginationOptions` (10/25/50).  
**Gap:** Mobile pagination should be **"Load more" button** (infinite scroll) or simple Previous/Next, not numbered pages. `MobilePaginationControls` exists but supports page input + numbered — not "Load more". No definition for which pattern.

### 16. Bulk action bar position on mobile
**Design references:** §C line 887: "bulk Archive button appears in the header actions slot".  
**Gap:** On mobile, header is far from selected rows. Should be **fixed bottom bar** (like Gmail) showing "3 selected • Archive • Cancel". No definition.

### 17. History drawer — mobile full-screen vs desktop right-docked
**Design references:** §D line 922: `<Drawer anchor="right">` for desktop.  
**Gap:** Design says desktop = right drawer. Mobile not defined. Should be **full-screen bottom sheet** (`anchor="bottom"`, `maxHeight: "90vh"`) matching `localizedStringDrawer.mobile.tsx`. Restore confirmation modal also needs mobile variant (full-screen Dialog or bottom sheet).

### 18. dnd-kit touch sensors — activation distance not defined
**Design references:** §G line 959: `@dnd-kit/sortable` `useSortable` + `DragOverlay`.  
**Gap:** `@dnd-kit/core` requires `sensors: [PointerSensor, TouchSensor({ activationConstraint: { distance: 8 } })]` for touch. No definition for:  
- Activation distance (8px default may be too sensitive)  
- `KeyboardSensor` for accessibility  
- Whether drag handles are always visible or appear on hover/long-press

---

## Low-Priority Gaps / Nice-to-haves

### 19. iOS SafeArea insets — only partially implemented
**Design references:** §B line 851 `SectionPanel`; §D line 916 sticky bottom.  
**Gap:** `bottomNavbar.mobile.tsx:29` and `localizedStringDrawer.desktop.tsx:193` use `env(safe-area-inset-bottom)`. But:  
- `MobilePageContainer` has no SafeArea padding  
- Editor sticky action bar (Gap #6) needs it  
- Preview iframe may need `padding-bottom: env(safe-area-inset-bottom)`  
- MUI v9 `CssBaseline` does **not** add SafeArea CSS — must be explicit

### 20. Mobile landscape orientation — narrow height not addressed
**Design references:** None.  
**Gap:** Editor viewport in landscape (height ~320px with keyboard) needs:  
- Compact Inspector (collapsible sections)  
- Reduced toolbar density  
- Preview iframe height calculation

### 21. dnd-kit bundle impact on mobile
**Design references:** §G line 955: `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0` installed but UNUSED.  
**Gap:** ~45KB gzipped added to editor route. No definition for:  
- Code-split dnd-kit (only load on editor route — already via `EmailEditorWrapper` dynamic import)  
- Simplified mobile editor fallback (read-only preview + basic edits) without dnd-kit

### 22. TipTap bundle weight on mobile
**Design references:** §B line 824: "Turbopack dev-compile slowdown with Prism.js".  
**Gap:** `@react-email/editor` bundles TipTap + Prism.js (~200KB+). No definition for:  
- Lazy-load editor only when Design tab active (current: mounts on editor route)  
- "Simplified mobile editor" fallback (plain textarea + merge-tag picker) for slow devices

### 23. Routing — same routes or mobile master-detail?
**Design references:** §A lines 828-830: `/email-templates` and `/email-templates/[id]`.  
**Gap:** Design uses same routes for both tiers. Mobile idiomatic pattern:  
- `/email-templates` = full-screen list  
- Tap row → push `/email-templates/[id]` full-screen detail (master-detail)  
- Native back gesture (iOS edge swipe) must preserve editor state (Zustand survives tier switch per AGENTS.md)  
- Bottom nav entry: is "Email Templates" in mobile bottom nav? (design §A line 834 adds sidebar entry only)

---

## Verified Items (Design Aligns with Codebase)

| Item | Design Location | Codebase Evidence |
|------|---------------|-------------------|
| Tier-neutral ViewModel + switcher + Container pattern | §Frontend lines 787-795 | `FeedbackManageView.tsx`, `FeedbackManagePageContainer.tsx`, `FeedbackManagePageChrome.tsx` |
| `ResponsiveViewSwitch` with `createLazyView` + dynamic imports | §Frontend lines 789-793 | `ResponsiveViewSwitch.tsx`, `createLazyView.ts` |
| Mobile views in `frontend/mobile/views/`, desktop in `frontend/desktop/views/` | §Frontend lines 797-803 | Directory structures in AGENTS.md match |
| `MobilePageContainer` / `DesktopPageContainer` + `MobilePageHeader` / `DesktopPageHeader` | §B lines 844-850 | Both exist with correct props |
| `SectionPanel` shared component | §B line 851 | `SectionPanel.tsx` exists |
| Zustand stores for mutable state surviving tier switch | §Frontend line 794 (store ref), AGENTS.md line 14 | `feedbackManageTabsStore.ts`, stores AGENTS.md |
| `useViewport()` tier detection (mobile <600, tablet 600-900, desktop ≥900) | ViewportProvider | `ViewportProvider.tsx:36-50` |
| Mobile bottom-anchored Drawers for filters/pickers | §E line 939 | `searchScheduleFilterDrawer.mobile.tsx:182`, `localizedStringDrawer.mobile.tsx:280` |
| Desktop right-anchored Drawers | §D line 922 | `searchScheduleFilterDrawer.desktop.tsx:182`, `notificationDrawer.desktop.tsx:72` |
| Mobile bottom nav with SafeArea inset | `bottomNavbar.mobile.tsx:29` | `pb: "env(safe-area-inset-bottom)"` |
| Mobile pagination controls (`MobilePaginationControls`) | Search results | `paginationControls.mobile.tsx` |
| `Slide` tab transitions with `slideDirection` | §G line 956 | `preferencesChannelTabs.mobile.tsx:140` |
| `usePrefersReducedMotion` hook (NEW) | §G lines 964-981 | Defined in design; not yet in codebase |
| `EmailEditorWrapper` with `next/dynamic({ssr:false})` | §Frontend lines 805-818 | Defined in design; pattern is intentional deviation |

---

## Codebase Precedents Referenced

| File | Purpose |
|------|---------|
| `frontend/views/AGENTS.md` | Tier rules (ViewModel, switcher, lazy loading, Zustand) |
| `frontend/mobile/AGENTS.md` | Mobile primitives (3 categories), import conventions |
| `frontend/desktop/AGENTS.md` | Desktop primitives (tier-paired variants only), import conventions |
| `frontend/common/views/AGENTS.md` | ViewModel pattern, labels pass-down, switcher pattern |
| `frontend/common/stores/AGENTS.md` | Serialization rules, `useRef` for File objects |
| `frontend/common/components/ui/container/ResponsiveViewSwitch.tsx` | Tier switcher implementation |
| `frontend/common/components/ui/container/createLazyView.ts` | Lazy loading with `next/dynamic` |
| `frontend/mobile/views/dashboard/feedback/feedbackManage.mobile.tsx` | Mobile page shell + chrome pattern |
| `frontend/desktop/views/dashboard/feedback/feedbackManage.desktop.tsx` | Desktop page shell + chrome pattern |
| `frontend/common/views/dashboard/feedback/FeedbackManageView.tsx` | Switcher composition |
| `frontend/common/providers/theme/ViewportProvider.tsx` | Breakpoint tiers (mobile <600, tablet 600-900, desktop ≥900) |
| `frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx` | Mobile layout with bottom nav + SafeArea |
| `frontend/mobile/views/dashboard/components/bottomNavbar.mobile.tsx` | Fixed bottom bar with SafeArea |
| `frontend/mobile/views/dashboard/search-schedule/searchScheduleFilterDrawer.mobile.tsx` | Bottom-anchored Drawer (85vh, rounded top) |
| `frontend/mobile/components/ui/input/localizedString/localizedStringDrawer.mobile.tsx` | Bottom Drawer full-screen pattern |
| `frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabs.mobile.tsx` | Slide tab transitions with direction |
| `frontend/mobile/components/ui/filter/paginationControls.mobile.tsx` | Mobile pagination (numbered + page input) |
| `frontend/common/components/ui/dataGrid/AppDataGrid.tsx` | DataGrid wrapper (no column visibility) |
| `frontend/desktop/components/ui/input/localizedString/localizedStringDrawer.desktop.tsx` | Desktop Dialog + SafeArea inset |

---

## Recommended v7 Design Edits

### Add new subsection **R. Responsive & Mobile Specification** (after §Q, before i18n section)

```markdown
#### R. Responsive & Mobile Specification

This section makes explicit the responsive behavior, touch interactions, and mobile-specific patterns for every surface defined in §A–§Q. **All mobile patterns below are mandatory for Phase 1** — not Phase 2.

##### R.1 Breakpoints & Tier Definitions
- **Mobile**: `<600px` (`theme.breakpoints.down("sm")`) — `isMobile=true`
- **Tablet**: `600–900px` (`theme.breakpoints.between("sm", "md")`) — `isTablet=true`, `isMobile=true` (per ViewportProvider)
- **Desktop**: `≥900px` (`theme.breakpoints.up("md")`) — `isDesktop=true`
- Tier switch at 600px and 900px. `ResponsiveViewSwitch` reads `useViewport().isMobile` (mobile+tablet) vs `isDesktop`.

##### R.2 List View — AppDataGrid Responsive Columns
| Column | xs (<600) | sm (600-900) | md (900-1200) | lg+ (≥1200) |
|--------|-----------|--------------|---------------|-------------|
| Status badge | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| Name (displayName) | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| Scope | 🔴 Hidden | ✅ Visible | ✅ Visible | ✅ Visible |
| Locale | 🔴 Hidden | 🔴 Hidden | ✅ Visible | ✅ Visible |
| Version | 🔴 Hidden | 🔴 Hidden | ✅ Visible | ✅ Visible |
| Last edited | 🔴 Hidden | ✅ Visible | ✅ Visible | ✅ Visible |
| Allowed editor groups | 🔴 Hidden | 🔴 Hidden | 🔴 Hidden | ✅ Visible |

**Implementation**: Extend `AppDataGrid` to accept `columnVisibilityModel` + `onColumnVisibilityModelChange` props, driven by a `useResponsiveColumns(columnsConfig)` hook in the **ViewModel** (viewport-agnostic — the hook reads `useViewport()` internally and returns the model). The hook lives in `frontend/common/views/dashboard/email-templates/hooks/useResponsiveColumns.ts`. Column `hideable: true` on all except Status + Name.

##### R.3 List View — Mobile-Specific Patterns
- **Row actions**: On mobile, replace icon-button Menu with **swipe left → actions row** (Archive, Edit, Preview) using `@dnd-kit` `TouchSensor` with `activationConstraint: { distance: 12 }` + `KeyboardSensor`. Tap row = navigate to editor. Long-press (500ms) = context menu (fallback for non-swipe devices).
- **Search bar**: On mobile, render as **search icon in header** → tap expands to full-width `OutlinedInput` in a `MobilePageHeader` actions slot (animated width). Close on blur or Escape.
- **Filter chips**: Wrap Scope/Status/Locale/Segmented controls in `<MobileHorizontalScrollRow>` (peek scroll, `sx={{ pb: 1 }}`). Active filter count badge in header next to search icon.
- **Pagination**: Mobile = **"Load more" button** (infinite scroll) at bottom of list. Desktop = numbered pages (10/25/50). `MobilePaginationControls` extended with `variant="loadMore"` prop.
- **Bulk actions**: On mobile, **fixed bottom bar** (`position: fixed; bottom: 0; pb: env(safe-area-inset-bottom)`) showing "N selected • Archive • Cancel" when checkboxes active. Desktop = header actions slot.

##### R.4 Editor View — Mobile Inspector Drawer
- **Anchor**: `anchor="bottom"` (like `localizedStringDrawer.mobile.tsx`).
- **Max height**: `maxHeight: "85vh"` (match filter drawer).
- **Keyboard awareness**: Use `visualViewport` API — on `resize`, set Drawer `maxHeight = visualViewport.height - visualViewport.offsetTop - 16` so Inspector stays above soft keyboard. Add `resize` listener in ViewModel, store `inspectorMaxHeight` in Zustand.
- **Swipe to dismiss**: `swipeArea="anchor"` + `onClose` on swipe down (MUI Drawer supports `swipeArea`).
- **Header trigger**: `TuneOutlined` IconButton in `MobilePageHeader` actions with `aria-expanded`, `aria-controls="inspector-drawer"`.

##### R.5 Editor View — Three Tabs (Design/Preview/Code) Mobile
- **Variant**: `variant="scrollable"` `scrollButtons="auto"` on mobile (`xs`, `sm`). Desktop = default.
- **Labels**: Full text on `≥sm`; icons only on `xs` (Design=✏️, Preview=👁️, Code=📝) with `aria-label`.
- **Transitions**: Keep `<Slide direction={slideDirection}>` (design §G). On mobile, `slideDirection` computed from swipe gesture (hammer.js or `touchstart`/`touchend` delta) for native feel.

##### R.6 Editor View — Sticky Bottom Action Bar (Mobile)
- **Position**: Fixed bottom, `zIndex: appBar + 1`, `pb: env(safe-area-inset-bottom)`.
- **Visible always** (not inside Inspector Drawer) — persists when Drawer closed.
- **Buttons**: Primary (Save Draft, `variant="contained"`), Secondary (Publish, `variant="outlined" color="success"`), Tertiary (Send Test, `color="secondary"`).
- **Keyboard shortcut hint**: Show "⌘S Save" / "⌘Enter Publish" labels on desktop only (`sx={{ display: { xs: 'none', md: 'inline' }}}`).

##### R.7 Editor View — Merge-Tag Picker Mobile
- **Component**: `VariableMentionPicker` (design §D line 913).
- **Mobile**: Full-screen bottom sheet (`Drawer anchor="bottom" maxHeight="100%"` with `borderTopLeftRadius: 16, borderTopRightRadius: 16`).
- **Sections**: Search input (auto-focus) → Recent (last 5 used) → By Scope (grouped).
- **Insert**: Tap item → inserts `{{fieldName}}` at cursor in Subject field (focus returns to Subject), closes drawer.

##### R.8 Editor View — TipTap Mobile UX
- **Bubble menu**: On mobile, render **fixed bottom toolbar** (not floating) when selection exists. Toolbar: Bold, Italic, Link, Merge-tag, Block type (H1/H2/P), Undo/Redo.
- **Slash command**: Full-width modal (Drawer bottom) on mobile.
- **Block type selector**: Segmented control (H1/H2/P/Quote) on mobile vs dropdown desktop.
- **Auto-focus**: Do NOT auto-focus editor on mobile (keyboard covers 50% viewport). User taps to focus.
- **dnd-kit sensors**: `sensors: [PointerSensor, TouchSensor({ activationConstraint: { distance: 8 } }), KeyboardSensor]` in `SortableList` wrapper.

##### R.9 Preview Tab — Mobile Viewport Selector
- **Remove** the Desktop/Tablet/Mobile toggle on mobile tier entirely.
- **Alternative**: Single button "Preview on Desktop" → opens new tab at `/email-templates/[id]?viewport=desktop` (server reads `viewport` query, sets iframe width via `srcDoc` meta or CSS).
- **Iframe height**: `height: "100%"` with `minHeight: 500` on mobile; no stacking context issues with `sandbox=""` (verified).

##### R.10 Send Test Dialog — Mobile Bottom Sheet
- **Component**: Replace `<Dialog>` with `<Drawer anchor="bottom" maxHeight="90vh" paperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 }}}>` on mobile.
- **Sample props editor**: Single column stack (label above textarea). Desktop = two-column (label left, textarea right).
- **Rate-limit notice**: Inline `<Typography variant="caption" color="error">` below Submit button (not toast).
- **"Send to my own email"**: Tertiary button above To field.

##### R.11 History Drawer — Mobile Full-Screen
- **Mobile**: `Drawer anchor="bottom" maxHeight="90vh"` (same as Inspector).
- **Desktop**: `Drawer anchor="right" width={360}` (design §D).
- **Restore confirmation**: Mobile = full-screen Dialog (`fullScreen={true}`). Desktop = centered Dialog.

##### R.12 Touch Interactions — dnd-kit Configuration
```tsx
// frontend/common/components/ui/dnd/SortableList.tsx
import { PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DragOverlay } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```
- **Activation distance**: 8px (prevents accidental drag on scroll).
- **DragOverlay**: `dropAnimation: { sideEffects: (active, over) => { /* lift/settle */ } }` (design §G).
- **Drag handles**: Always visible on mobile (no hover). `touch-action: none` on handle.

##### R.13 Pull-to-Refresh — Mobile List
- **Component**: New `PullToRefresh` wrapper in `frontend/common/components/ui/container/` wrapping the list view content.
- **Trigger**: 80px drag down from top (`onRefresh` calls ViewModel `refetch()`).
- **Indicator**: `CircularProgress` + "Pull to refresh" / "Release to refresh" labels (i18n).
- **Disabled** when list is loading or at top of scroll (DataGrid handles scroll).

##### R.14 SafeArea Insets — All Sticky/Fixed Elements
| Element | SafeArea Prop |
|---------|---------------|
| Mobile bottom nav | `pb: "env(safe-area-inset-bottom)"` (exists) |
| Editor sticky action bar | `pb: \`calc(\${theme.spacing(3)} + env(safe-area-inset-bottom))\`` |
| Inspector Drawer bottom | `pb: "env(safe-area-inset-bottom)"` in Drawer paper `sx` |
| Send Test bottom sheet | Same as Inspector |
| History Drawer bottom | Same |
| Preview iframe container | `paddingBottom: "env(safe-area-inset-bottom)"` |
| MobilePageContainer | Add `paddingBottom: "env(safe-area-inset-bottom)"` to `sx` |

##### R.15 Mobile Landscape Orientation
- **Editor viewport**: Detect `orientation: landscape` + `height < 500` → compact mode:
  - Inspector Drawer `maxHeight: 70vh`
  - Toolbar density: `size="small"` buttons
  - Hide tab labels (icons only)
  - Reduce `sectionGap` from 3 to 2

##### R.16 Performance — Mobile Bundle Strategy
- **dnd-kit**: Already code-split via `EmailEditorWrapper` dynamic import (editor route only). No main bundle impact.
- **TipTap/Prism**: Same — only loaded on editor route via dynamic import.
- **Simplified mobile editor**: **NOT in Phase 1**. Full `@react-email/editor` on all tiers. Phase 2 may add `isMobile && isLowEndDevice` fallback (User-Agent + `navigator.deviceMemory` check) rendering read-only preview + basic textarea.

##### R.17 Routing & Navigation — Mobile Master-Detail
- **Routes**: Same (`/email-templates`, `/email-templates/[id]`) — tier switcher handles presentation.
- **Mobile pattern**: List = full-screen. Tap row → push editor full-screen. Back gesture (iOS edge swipe) = `router.back()` — Zustand store preserves `isDirty`, `designJson`, `sampleProps` across nav (store survives tier switch per AGENTS.md line 14).
- **Bottom nav**: Add `emailTemplates` to `bottomNavItems` in `DashboardLayoutMobile` props (design §A line 834 adds sidebar only). Icon: `EmailOutlined`. Label: `dashboard.emailTemplates.navLabel`.

##### R.18 Reduced Motion — All Custom Animations
- **Hook**: `usePrefersReducedMotion()` (design §G lines 964-981) — **must be implemented** in `frontend/common/lib/use-prefers-reduced-motion.ts`.
- **Guard every custom animation**:
  - List entrance stagger (§G line 957): `if (reduced) return { initial: false, animate: { opacity: 1, y: 0 } }`
  - Success checkmark (§G line 958): `if (reduced) return <SuccessIcon />` (no motion)
  - Tab Slide (§D line 899): `if (reduced) return <Box>{tabContent}</Box>`
  - Drag settle (§G line 959): `if (reduced) dropAnimation: undefined`
- **MUI Dialog/Drawer/Snackbar/Tooltip** already respect `prefers-reduced-motion` internally — no work needed.

---

### Inline Insertions into Existing Sections

**§A Routing & Navigation** — after line 834 add:
> - **Mobile bottom nav**: Add `emailTemplates` to `bottomNavItems` in `DashboardLayoutMobile` (`frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx`). Icon: `EmailOutlined`. Label from `dashboard.emailTemplates.navLabel`.

**§B Page Layouts** — after line 851 add:
> - **SafeArea on MobilePageContainer**: `sx={{ pb: "env(safe-area-inset-bottom)" }}` so full-screen content clears home indicator.

**§C List View** — replace lines 860-889 with R.2 + R.3 above (explicit column table + mobile patterns).

**§D Editor View** — after line 911 add R.4, R.5, R.6, R.7, R.8; after line 922 add R.11.

**§E Preview Tab** — replace line 939 with R.9.

**§F Send Test Dialog** — replace lines 945-951 with R.10.

**§G Animations** — after line 963 add R.12, R.13, R.18.

**§A-B-C-D-E-F-G** — all sections referencing mobile behavior should cross-reference **§R** (e.g., "See §R.4 for mobile Inspector Drawer definition").

---

### i18n Additions for Mobile-Specific Keys

Add to `dashboard.emailTemplates` namespace (§B lines 1168-1173):

```typescript
// Mobile-specific
pullToRefresh: "Pull to refresh",
releaseToRefresh: "Release to refresh",
refreshing: "Refreshing...",
swipeToArchive: "Swipe left to archive",
longPressForMenu: "Long press for more options",
searchExpand: "Search templates",
searchCollapse: "Close search",
loadMore: "Load more",
selectedCount: (n: number) => n === 1 ? "1 selected" : `${n} selected`,
inspectorTitle: "Template Settings",
inspectorClose: "Close settings",
keyboardShortcuts: {
  save: "⌘S Save Draft",
  publish: "⌘Enter Publish",
},
viewportDesktopPreview: "Preview on Desktop",
```

Add to `dashboard.emailTemplates.dialog.sendTest.*` (§B line 1172):
```typescript
samplePropsMobileHelp: "Edit test data below. Tap Send when ready.",
rateLimitNotice: (limit: number) => `Max ${limit} test emails per minute.`,
```

---

*End of Round 2 Audit — Responsive, Mobile & Tier Separation*
