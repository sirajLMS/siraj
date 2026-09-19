# 03 — Animation Infrastructure Audit (Siraj frontend)

> Audit date: 2026-08-02 · Scope: `frontend/**` desktop+mobile+common tiers, `app/**` App Router.
> Goal: inventory existing animation primitives so the email-template UI/UX design reuses them rather than introducing ad-hoc motion.

## Executive summary

| Concern | Status | Verdict for design |
|---|---|---|
| Motion library | `framer-motion@^12.43.0` installed, used in exactly 3 sibling files (MetricCard). | Present — reuse is possible but adoption is **shallow and recent**. |
| MUI transitions | `<Collapse>` ×3, `<Slide>` ×1. No `<Fade>/<Grow>/<Zoom>` authored. No `TransitionComponent` overrides on Dialog/Drawer. | Use MUI defaults (Dialog=Fade, Drawer=Slide) — do NOT reinvent. |
| CSS `@keyframes` | 5 distinct keyframes defined ad-hoc inline in `sx` (pulse×3, spin×2, fadeIn×3, profileContentEnter×2, profileTabFade×2). | **Duplicated & tacit.** Promote to a shared `sx` helper set. |
| Loading skeletons | Many skeleton components (MUI `<Skeleton>`). Suspense fallback used at the route/layout level. | Strong reuse base **for list/table skeletons** + block-canvas skeleton. |
| Global loading bar | **None.** No `nprogress`, no top loading bar on route nav. | If wanted, must be added new. |
| Toast/snackbar motion | Per-view local `<Snackbar>` (MUI default Slide). No Notistack, no global toast provider. | Add a **local snackbar** to the template editor; optionally a small global ToastProvider if many surfaces need it. |
| Page transitions | **None.** No `AnimatePresence` anywhere. Static Next.js route swap + Suspense fallbacks. | Do NOT add route-level AnimatePresence — keep parity with app convention. |
| Drag-and-drop animation | `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0` installed but **not imported in any source file** yet. dnd-kit ships CSS transform based "dropAnimation" + `restrictToVerticalAxis` etc.; framer-motion `Reorder` is *not* installed/used. | **New territory.** Design will be the first to wire it. Use dnd-kit built-in `dropAnimation` + `useSortable` CSS transitions — NOT framer-motion Reorder. |
| Success celebration | **None.** No confetti, lottie, checkmark animation. Existing "success" = static `CheckCircleOutlined` icon in a styled `<Snackbar>`. | Design's "email sent" success = add a checkmark success-animation; build new (small CSS keyframe or framer-motion variants). |
| Reduced-motion a11y | **`prefers-reduced-motion` respected NOWHERE.** Zero matches in the codebase. | Production-readiness gap. Add a `motionReduced()` helper + guard every custom animation. |
| Micro-interactions | MUI ripple built-in. Hover/active CSS transitions on cards/buttons. No `whileHover`/`whileTap` (framer-motion variants). | Stick with CSS transitions; introduce framer-motion hover/active only if genuinely needed. |

---

## 1. Motion libraries (package.json)

Checked keys (`package.json`):

| Package | Installed | Version |
|---|---|---|
| `framer-motion` | ✅ | `^12.43.0` |
| `motion` | ❌ | — |
| `react-transition-group` | ❌ | — |
| `auto-animate` / `@formkit/auto-animate` | ❌ | — |
| `gsap` | ❌ | — |
| `animxyz` | ❌ | — |
| `@dnd-kit/core` | ✅ | `^6.3.1` |
| `@dnd-kit/sortable` | ✅ | `^10.0.0` |
| `@dnd-kit/utilities` / `modifiers` / `accessibility` | ❌ | not installed |
| `nprogress` | ❌ | — |
| `notistack` | ❌ | — |
| `lottie` (`-react` / `-web`) | ❌ | — |
| `confetti` / `canvas-confetti` / `react-confetti` | ❌ | — |
| `focus-trap-react` / `react-focus-lock` | ❌ | (MUI's `Unstable_TrapFocus` is internal to Dialog/Drawer) |

### framer-motion import sites (only 3 files — sibling variants of one component)
```
frontend/common/components/ui/card/MetricCard/styled.tsx:4        import { motion } from "framer-motion"
frontend/desktop/components/ui/card/MetricCard/styled.tsx
frontend/mobile/components/ui/card/MetricCard/styled.tsx
```
Pattern: `motion.create(StyledCard)` → `MotionStyledCard`, used with `initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.4, delay:animationIndex*0.04, ease:[0.25,0.46,0.45,0.94]}}`. **This is a stagger-by-index entrance** (`frontend/common/components/ui/card/MetricCard/MetricCard.tsx:76-92`).
- Note: `RedirectNotification` and chatwoot hits (`AnimatePresence|motion\\.` adapters) are all in `chatwoot/**` (vendored Vue app), **not** in Siraj's own React frontend.

### dnd-kit
Installed in `package.json` but `rg "@dnd-kit" frontend --glob '*.tsx'` → **zero matches**. dnd-kit is wired into the dependency graph only; **no custumer code uses it yet.** The email-template design will be the first consumer.

---

## 2. MUI transitions in use (`<Fade>/<Grow>/<Slide>/<Zoom>/<Collapse>`)

Grep results — author-authored usage only (MUI internal transitions used by `Dialog`/`Drawer`/`Snackbar`/`Tooltip` are not counted):

| Component | File:Line | Purpose | Props |
|---|---|---|---|
| `<Collapse>` | `frontend/common/views/dashboard/components/client/SidebarShell.tsx:370` | Sidebar nav group expand/collapse | `in={!collapsed} timeout="auto" unmountOnExit` |
| `<Collapse>` | `frontend/mobile/views/dashboard/reports/components/reportFiltersCollapsible.mobile.tsx:85` | Report filter panel expand | `in={expanded}` |
| `<Collapse>` | `frontend/common/views/dashboard/admin/parents/home/parentFilterPanel.tsx:30` | Parent filter chips panel expand | `in={open}` |
| `<Slide>` | `frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabs.mobile.tsx:140` | Mobile channel tab horizontal swap (direction tracks next/prev) | `direction={slideDirection} in appear mountOnEnter unmountOnExit timeout={220}` — see `slideDirection: "left"\|"right"` from container (line 36-37) |

- **`<Fade>`, `<Grow>`, `<Zoom>` not authored anywhere.**
- **No `TransitionComponent=` or `TransitionProps=` overrides on `<Dialog>` or `<Drawer>`** across the codebase (rg returned empty). The 56 Dialog / 11 Drawer usages all rely on MUI defaults (Dialog → Fade, Drawer → Slide from edge, Snackbar → Slide from bottom).
- **Accordions:** 3 files; rely on MUI Accordion's internal `<Collapse>`.

**Reuse implication for design:**
- **Drawer slide** → use MUI `<Drawer>` default `Slide` (left/right); optionally `transitionDuration` prop. No custom transition component needed.
- **Dialog fade** → use MUI `<Dialog>` default `Fade`. No custom transition.
- **Accordion** (template "block" sections may expand) → use MUI `<Accordion>`/`<Collapse>`.
- **Tab transition between Metadata/Blocks/Preview tabs** → follow the mobile `preferencesChannelTabs` pattern: compute `slideDirection` from index delta, wrap content in `<Slide direction={slideDirection} timeout={220} mountOnEnter unmountOnExit>`. This is the only "tab transition" idiom present.

---

## 3. CSS keyframes / `animation:` in TS/TSX

All definitions are inline inside MUI `sx` callbacks (no shared stylesheet, no CSS module). The app uses the Emotion `sx` `@keyframes` shorthand (object-form). Defining files:

| Keyframe | Used for | Where (file:line) |
|---|---|---|
| `pulse` (opacity 1↔0.4, 1.5s infinite) | Status dot "live" pulse | `frontend/mobile/views/dashboard/parent/dashboard/components/parentClassStatusIndicator.mobile.tsx:34-38`; `frontend/desktop/views/dashboard/parent/dashboard/components/parentClassStatusIndicator.desktop.tsx:34-38` |
| `pulse` (opacity 1↔0.85, 2s cubic-bezier) | Warning banner pulse | `frontend/common/views/dashboard/classes/details/teacher/TimezoneWarningBanner.tsx:29-33`; `frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertBanners.desktop.tsx:38-42` |
| `spin` (`rotate(360deg)`, 1s linear) | Icon spinner while DST migration runs | `frontend/mobile/views/dashboard/tools/dst-migration/components/updateSchedulesButton.mobile.tsx:43`; `frontend/desktop/views/dashboard/tools/dst-migration/components/updateSchedulesButton.desktop.tsx:56` |
| `fadeIn` (opacity 0→1 + scale 0.9→1, 0.3s) | TagInput pill entrance | `frontend/common/components/ui/input/tagInput/TagInput.tsx:56-62`; `frontend/mobile/components/ui/input/tagInput/tagInput.mobile.tsx:58`; `frontend/desktop/components/ui/input/tagInput/tagInput.desktop.tsx:57` |
| `profileContentEnter` (opacity 0→1 + translateY 8→0, 0.3s) | Profile view mount | `frontend/mobile/views/dashboard/profile/core/profileShell.mobile.tsx:70-74`; `frontend/desktop/views/dashboard/profile/core/profileShell.desktop.tsx:73-77` |
| `profileTabFade` (opacity 0→1, 0.2s) | Profile tab swap | `frontend/mobile/views/dashboard/profile/core/profileShell.mobile.tsx:103-107`; `frontend/desktop/views/dashboard/profile/core/profileShell.desktop.tsx:104-108` |

**Observation:** `pulse` and `fadeIn` are duplicated 5× and 3× across the tier split. These are good candidates to extract into a shared `sx/animations.ts` helper. The `fadeIn` (scale+fade) and `profileContentEnter` (translateY+fade) are the closest existing primitives to "dialog fade" / "list stagger" the design may want.

---

## 4. Loading patterns

### Skeletons (MUI `<Skeleton>`)
Many exist; key reusable ones:
- **`DashboardShellSkeleton`** — `frontend/common/views/dashboard/components/DashboardShellSkeleton.tsx:9` — full chrome (nav + header + content) Suspense fallback.
- **`DashboardRoleSkeleton`** — `frontend/common/views/dashboard/dashboard/DashboardRoleSkeleton.tsx:12` — per-role dashboard grid; comment at line 11 confirms it's used as `<Suspense fallback={<DashboardRoleSkeleton />} />`.
- **Profile skeletons** (shared + tier): `frontend/common/views/dashboard/profile/core/ProfileSkeleton.tsx:19` (ResponsiveViewSwitch); plus desktop/mobile tier variants and per-role `StaffProfileLoadingSkeleton.tsx` (line 5), `ParentProfileLoadingSkeleton.tsx`, `TeacherProfileLoadingSkeleton.tsx`.
- **Inline `ChannelTabsSkeleton`** — `frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabs.mobile.tsx:40` (Skeleton "table-row" pattern with branching variant=rectangular).
- **Tier skeleton variants**: `frontend/desktop/views/dashboard/profile/core/profileSkeleton.desktop.tsx`, `frontend/mobile/views/dashboard/profile/core/profileSkeleton.mobile.tsx`, search-schedule results skeleton (`.desktop.tsx` / `.mobile.tsx`).

### Progress indicators
`<CircularProgress>` and `<LinearProgress>` are widely used (40+ files). Common idiom: `isSubmitting ? <CircularProgress size={24} color="inherit" /> : ...` inside a Button (e.g. `frontend/views/auth/login/components/LoginForm.tsx:247`).

### Global route loading bar (NProgress-style)
- `nprogress` is **NOT installed** (`package.json` no entry).
- `rg 'nprogress|top-loading|TopLoader|routeLoading|RouterProgress'` → zero matches.
- Route-level loading is handled purely by Next.js `<Suspense>` + per-route skeleton components (see `(dashboard)/layout.tsx:37` `fallback={<DashboardShellSkeleton />}`). **No animated top progress bar.**

**Reuse implication:** for "send email" → loading spinner reuse the in-button `<CircularProgress size={20}>` idiom; for the template editor's initial data load reuse the `<Suspense fallback={...Skeleton} />` pattern (mount a `EmailEditorSkeleton` mirroring the editor canvas — copy `DashboardRoleSkeleton`'s structure).

---

## 5. Toast / snackbar motion

- `notistack`: **not installed**, **not used**.
- There is **no global `<SnackbarProvider>` / ToastProvider.** Toasts are **per-view local `<Snackbar>`** instances.
- Reusable exported snackbar components (`frontend/common/components/ui/index.ts:24-25`): `FormErrorSnackbar`, `FormSuccessSnackbar`. There are desktop+mobile tier variants:
  - `frontend/common/components/ui/form/snackbar/FormSuccessSnackbar.tsx:12` — plain `<Snackbar>` (default bottom-center) wrapping a styled `<Box>` with `CheckCircleOutlined` + message. **No custom transition** (MUI default Slide-from-bottom applied automatically).
  - `frontend/common/components/ui/form/snackbar/FormErrorSnackbar.tsx` (mirrors the above).
  - Tier variants: `frontend/desktop/components/ui/form/snackbar/DesktopFormSuccessSnackbar.tsx`, `frontend/desktop/components/ui/form/snackbar/DesktopFormErrorSnackbar.tsx`, and equivalent mobile `*.mobile.tsx` (note: desktop file comment line 16 states "Self-contained — no shared base component", i.e. duplication).
- Inline Alert+Snackbar usage: `frontend/desktop/views/dashboard/profile/core/notifications/notificationPreferencesTab.desktop.tsx:3` (`<Snackbar><Alert severity={snackbarSeverity}>...</Alert></Snackbar>`) — idomatic "save confirmed/error" pattern.

**No custom `Slide`/`Grow` transition is authored on toasts.** They all inherit MUI's default `Slide` (bottom → up).

**Reuse implication:** for the template editor "draft saved" / "test email sent" / "publish succeeded" toasts, **reuse `FormSuccessSnackbar`/`FormErrorSnackbar`** (or the inline Alert+Snackbar idiom) — they already animate in via MUI default Slide. If multiple surfaces in the editor need to enqueue toasts concurrently (e.g. autosave tick + validation error), introduce a small local `EditorSnackbarIsland` (see `frontend/common/views/dashboard/teachers/dashboard/components/TeacherDashboardSnackbarIsland.tsx` for the pre-existing "snackbar island" pattern), not a global Notistack.

---

## 6. Page transition

- `rg 'AnimatePresence' frontend app --glob '*.tsx'` → **zero matches** (excluding chatwoot).
- No `framer-motion` route-level swap. The app uses plain Next.js App Router with `<Suspense>` boundaries; navigation is a static content swap, with `DashboardShellSkeleton` as the only intermediate state.

**Reuse implication:** do **not** add route-level `AnimatePresence` for the template editor sub-routes. Match the existing "Suspense + skeleton" convention. Tab-level swaps are the place for motion (use `<Slide>` per step 2).

---

## 7. Drag-and-drop reorder animation

- `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0` installed; **no source file imports them yet** → the email-template block editor will be the first consumer.
- `framer-motion` `Reorder`/`<Reorder.Group>` is not used and `motion` package isn't installed — do NOT introduce react-dnd/react-beautiful-dnd/@hello-pangea/dnd (not installed).
- dnd-kit ships its own animation: the default `dropAnimation` on `<DragOverlay>`, plus `useSortable()` exposes `transform`+`transition` props that you apply as `style` on each draggable's CSS — this gives smooth "lift + settle" via plain CSS transitions (no framer-motion needed). `@dnd-kit/utilities` (the `CSS.Transform` helper) is **not installed**, so either add it to `devDependencies` or inline `transform: CSS.Translate.toString(transform)`.

**Reuse / new recommendation:**
- **Reuse** the dnd-kit built-in animations; do NOT pull in framer-motion `Reorder`.
- Add `@dnd-kit/modifiers` (optional, for restricting draggable axis) and `@dnd-kit/utilities` (CSS transform helpers) — current deps lack these.
- Stagger entrance (initial block list fade-in) should reuse the **`MetricCard` stagger-by-index pattern** (`frontend/common/components/ui/card/MetricCard/MetricCard.tsx:84-88`) — `delay: index * 0.04` — either via framer-motion `motion.div` (since framer-motion is already installed) or via the `fadeIn` keyframe (see step 3).

---

## 8. Empty / success state animation

- `rg 'confetti|lottie|Lottie|checkmark|success-animation|celebrat|CheckmarkCircle'` → **no celebration library, no Lottie.**
- The existing "success checkmark" is the static `CheckCircleOutlined` icon used inside `FormSuccessSnackbar` (no anim).
- No "email sent" success animation currently exists.

**Reuse implication:** the design's "email sent" success animation is **new**. Recommendation: add a small `SuccessCheckMark` using framer-motion (already installed) with `pathLength` animation on the SVG check (single tiny component), gated by a `prefers-reduced-motion` check (see step 9). Avoid pulling in lottie/confetti — overkill and adds bundle weight + a11y risk.

---

## 9. `prefers-reduced-motion` accessibility

- `rg 'prefers-reduced-motion'` across the whole repo → **no matches in Siraj code** (one hit in chatwoot's Vue layer, irrelevant).
- No `useReducedMotion()` hook (framer-motion ships one but it's not used here).

**Reuse implication:** this is a **production-readiness gap** the design should close. Add a shared helper, e.g. `frontend/common/lib/motion-reduced.ts`:
```ts
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
```
…and wrap every custom animation (stagger, success check, block drag settle) so they render the end-state instantly when reduced. MUI's `Dialog`/`Drawer`/`Snackbar`/`Tooltip` already respect the media query via their internal Theme style overrides + Emotion — only custom animations need the guard.

---

## 10. Micro-interactions / haptics

- MUI `Button` ripple/ButtonBase touch ripple comes for free (used everywhere).
- Card hover/active are CSS transitions on border-color/box-shadow/transform (`.desktop.tsx:33-37` `transition: "border-color 0.15s ..."`, `StyledIconWrap` `transform 0.2s ease` at `styled.tsx:96`).
- framer-motion `whileHover` / `whileTap` → **not used** (rg returned empty). No haptic feedback API usage.
- TagInput pill uses `fadeIn` scale + fade keyframe (step 3).

**Reuse implication:** for the editor's navigation/toolbar buttons, prefer CSS `transition` (consistent with the chrome). Only introduce `whileHover={{scale:1.02}} whileTap={{scale:0.98}}` on truly interactive block-list rows if a tactile feel is desired — but stay minimal and guarded by reduced-motion.

---

## Design reference — `proposed design`

Searching the design text (`rg -i 'animat|framer|motion|transition|drawer|toast|snackbar|skeleton|drag|reorder|stagger|spinner|keyframe|reduced-motion|whileHover|whileTap|dnd-kit|DragLayer|success'`) returns **NO mentions** of any animation primitive, drawer, toast, skeleton, drag-reorder, stagger, or `prefers-reduced-motion`. The only "transition" hits are about **state-machine transitions** for templates ("status transitions DRAFT→PUBLISHED→ARCHIVED", lines 62, 759, 985) and async "success" return values from the email dispatcher backend (lines 592, 601, 610, 615, 628, 646, 959) — i.e. backend/contract concerns, **not UI animation**.

**Conclusion:** the design is currently silent on UI animation. The recommendations in this doc should be folded into the design; nothing in the design conflicts with the existing infrastructure.

Sections 3–6 of the design (per the read) are populated with backend service / dispatcher / scheduler / state-machine content, with no frontend animation or motion specifications — confirming there are no design-authored animation expectations to confirm/refute.

---

## Consolidated "Reuse or new" recommendation

| Design need | Reuse existing | Build new | Notes |
|---|---|---|---|
| **Drawer slide** | ✅ MUI `<Drawer>` default Slide | — | No `TransitionComponent` override needed; optionally tune `transitionDuration`. |
| **Tab transition (Metadata/Blocks/Preview)** | ✅ Mobile `preferencesChannelTabs.mobile.tsx:140` `<Slide direction={slideDirection}>` idiom | — | Compute direction from index delta; `timeout=220`. |
| **Dialog fade (confirm/archive/delete)** | ✅ MUI `<Dialog>` default Fade | — | Do not author `<Fade>` manually. |
| **Success toast (test email sent / publish)** | ✅ `FormSuccessSnackbar` (`FormSuccessSnackbar.tsx:12`) + inline `Alert+Snackbar` idiom | — (optional) EditorSnackbarIsland if multi-queue | MUI default Slide-in is applied. |
| **Loading spinner (in "Send test" button)** | ✅ in-button `<CircularProgress size={20}>` idiom (`LoginForm.tsx:247`) | — | |
| **Editor initial-load skeleton** | ✅ `<Suspense fallback={<EmailEditorSkeleton />}>` + mirror `DashboardRoleSkeleton.tsx` structure | Minor: build the `EmailEditorSkeleton` mirroring editor canvas | New component, reuse `<Skeleton>` primitives. |
| **List stagger on block editor entrance** | ✅ framer-motion stagger-by-index (`MetricCard.tsx:84-88`: `delay: index*0.04`) | — | framer-motion is already a dep. |
| **Drag-drop reorder animation** | ⚠️ dnd-kit installed but unused | ✅ wire `useSortable` + `DragOverlay dropAnimation` (built-in CSS transitions) | Design is first consumer; add `@dnd-kit/utilities`, optional `@dnd-kit/modifiers`. Do NOT add framer-motion Reorder. |
| **Empty-state / "email sent" success animation** | ❌ none | ✅ small framer-motion `SuccessCheckMark` (pathLength on SVG) | Reuse framer-motion (already installed); no lottie/confetti. |
| **Reduced-motion guard** | ❌ none — gap | ✅ shared `usePrefersReducedMotion` helper + wrap custom animations | Mandatory for production-readiness. MUI containers already handle it. |
| **Micro-interactions (hover/active)** | ✅ CSS transitions on cards (border/box-shadow/transform) | — | Only adopt `whileHover/whileTap` if truly needed; keep minimal. |
| **Global route top-loading bar** | n/a — app uses Suspense+skeleton | ✅ only if explicitly desired | Not required; app convention is skeleton fallbacks. |

