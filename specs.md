# specs.md — Siraj Plan v5 Universal Subagent Specification

> **MANDATORY READING for every agent at every nesting level.**
> The orchestrator, every main subagent (MA1..MA12), every nested subagent
> (NS-1..NS-4 of each main), every fix-round nested subagent, and every
> reconciliation-wave subagent MUST read this file in full BEFORE doing any work.
> It is the single source of truth for what NOT to violate.
>
> The orchestrator's dispatch prompts MUST mention `specs.md` by absolute path
> (`/home/ahmed/Projects/siraj/specs.md`) and instruct the receiving subagent
> to (a) read it via the Read tool, (b) re-read it after every fix round,
> (c) reference it explicitly in any CROSS-FILE DEPENDENCY report. This file is
> equally binding on agents handling the smallest slice and on the final
> auditor (Subagent 12).
>
> Any rule in a higher-level plan or memory file (AGENTS.md, layer AGENTS.md,
> instruction files) that appears to contradict this document is OVERRIDDEN by
> this document for the Plan v5 migration wave only.

---

## 0. The Three Inviolable Rules (recite before doing anything)

1. **Mobile and desktop modules contain RENDERING ONLY.**
   No types, no utils, no helpers, no constants, no schemas, no hooks declared,
   no state, no queries, no mutations, no navigation, no side-effects. Just JSX
   + sx + prop-passdown. Anything else is a violation.

2. **All shared `interface`/`type`/`utils`/`constants`/`schemas`/`hooks`/`stores`
   live ONCE in `frontend/common/...`** and are imported by BOTH tiers. When
   the mobile and desktop shapes are identical they collapse to ONE shared
   declaration — NEVER a `*MobileProps` + `*DesktopProps` paired duplicate.

3. **All state lives in `frontend/common/stores/` Zustand stores.** It is read
   by `use*ViewModel.ts` (in common) and FLOWS DOWN to tier views as plain
   props. Tier views never call `useState`/`useReducer`/`useStore(...)`/
   `create(...)`/`useXViewModel(...)` — they receive values + setter callbacks
   via props from the Container → ViewModel chain.

If you find yourself about to write ANY of: `useState`, `useReducer`, `useQuery`,
`useMutation`, `useXStore(`, `useRouter(`, `useNotifications(`, `logger.`,
`window.open`, `setTimeout`, `import { z } from "zod"`, `import {...} from "date-fns"`,
`function useX(`, `interface XxxMobileProps`, `interface XxxDesktopProps`,
`const FOO_MAP: Record<E, K> = {...}`, or any lowercase pure-data helper
function inside a `frontend/mobile/` or `frontend/desktop/` file —
**STOP. You are about to violate the rules. Re-read sections 1-6 below.**

---

## 1. Folder strict-mode matrix

| Path prefix | What MAY live here | What MAY NEVER live here |
|---|---|---|
| `frontend/mobile/views/**` | Tier-specific rendering only (`*.mobile.tsx`) | `.types.ts`, `.utils.ts`, `.constants.ts`, `.schema.ts`, `.helpers.ts`, `use*` hook files, `index.ts` barrels re-exporting logic, `*.stories.tsx`, `*.test.ts`, inline `useState`/`useReducer`/`useEffect`/`useMemo`-data, `z.object`, `Record<E,K>` label-maps |
| `frontend/mobile/components/**` | Tier UI primitives (rendering) | Same as above |
| `frontend/desktop/views/**` | Tier-specific rendering only (`*.desktop.tsx`) | Same as mobile/views |
| `frontend/desktop/components/**` | Tier UI primitives (rendering) | Same |
| `frontend/common/views/dashboard/<domain>/types/` | Shared view-side type declarations | Tier-`Props` suffixes; only `{Xxx}` (single), `Base{Xxx}`, `*Variant` (with justification) |
| `frontend/common/views/dashboard/<domain>/utils/` | Pure-data helpers, formatters | Anything stateful |
| `frontend/common/views/dashboard/<domain>/constants/` | `Record<E,K>` label-maps, option arrays | Logic that runs effects |
| `frontend/common/views/dashboard/<domain>/schemas/` | Zod schemas (`.schema.ts`) | Inline schema instantiation |
| `frontend/common/views/dashboard/<domain>/use*ViewModel.ts` | ViewModel hooks (the SOLE owner of form state, mutations, derivations) | JSX rendering |
| `frontend/common/components/ui/<group>/types/` `.../utils/` `.../hooks/` `.../constants/` | Shared UI-primitive types, utils, hooks, constants | Tier-specific styling glue (that stays in `*.mobile.*`/`*.desktop.*`) |
| `frontend/common/stores/` | Zustand `create(...)` store files ONLY | Components, types-only files, view-models |
| `frontend/stories/` | Storybook stories (the only place) | Living alongside tier code |

**Tier file naming**: every file inside `frontend/mobile/` or `frontend/desktop/`
that contains JSX/TSX rendering MUST be `*.mobile.*` or `*.desktop.*` (or a
barrel `index.ts` re-exporting only `.mobile.tsx`/`.desktop.tsx` components).
A bare `*.ts` (non-index, non-types — see §5) inside tier is almost always a
violation.

---

## 2. Imports — what tier files MAY and MAY NOT bring in

### Tier files (`frontend/{mobile,desktop}/**`) MAY import:

1. **Same-tier UI primitives**:
   - Mobile: `@/frontend/mobile/components/ui/**`
   - Desktop: `@/frontend/desktop/components/ui/**`
2. **Common primitives' TYPES** (type-only): `import type { ... } from "@/frontend/common/components/ui/.../types/..."`
3. **Common utils/constants/schemas**: `@/frontend/common/views/dashboard/<domain>/{utils,constants,schemas}/*`
4. **Common lib + hooks (allowlist)**:
   - `@/frontend/common/lib/**` (currency, locale, payment-method)
   - `@/frontend/common/hooks/**` (only `useViewport`, `usePermissions`,
     `mergeSx`, `useAppLocale` — and ONLY when the calling site is allowed per §3)
5. **Common GraphQL types + documents**: `@/frontend/common/graphql/**`
6. **Common stores' TYPE imports**: `import type { Foo } from "@/frontend/common/stores/fooStore"`
7. **`@/shared/**`** (locale, i18n, schema constants)
8. **Third-party libraries** that produce ONLY rendering (MUI, react-hook-form
   type-only imports, Emotion styled)

### Tier files MUST NOT import:

1. `@/frontend/common/components/ui/**` — runtime or value imports
2. `@/frontend/common/views/**` — common View or Container (only the switcher common View may do that; tier files never may)
3. The opposite tier (`@/frontend/mobile` from `frontend/desktop`, and vice versa)
4. `zustand`, `create(...)`, `create<...>(...)` — Zustand stores live in `frontend/common/stores/` only
5. `date-fns` directly (`parse`, `format`, `addDays`, `differenceInCalendarDays`, ...) — use the formatters in `@/frontend/common/utils/date*` or `@/frontend/common/views/dashboard/<domain>/utils/`
6. `next/navigation`'s `useRouter` — navigation lives in the Container/ViewModel
7. `@toolpad/core/useNotifications` — toast side-effects live in the ViewModel
8. `@/frontend/common/utils/logger` or `@/backend/lib/logger` — logging is the ViewModel's concern
9. `@apollo/client/react` `useQuery`/`useMutation`/`useSubscription` — GraphQL happens in the ViewModel
10. `react-hook-form` `useForm`/`useWatch` creating the form — ViewModel owns the form; tier files only take `control`/`register`/`errors`/`setValue` as PROPS (type-only imports OK)
11. `zod` (`z.object`, `zodResolver`) — schemas live in `frontend/common/views/dashboard/<domain>/schemas/`
12. `useViewport`/`useMediaQuery` — the ONLY allowed tier-side caller is `MobileFab.tsx` (documented by mobile AGENTS.md); anywhere else is a violation
13. `RequirePermission` from `@/frontend/common/components/auth/RequirePermission` — permission gating lives in the common Container, NEVER in a tier view
14. `useUserStore(...)` direct subscriptions — that's state, lives in the ViewModel/Container

If a tier file needs something from a forbidden import, it's a sign the work
belongs in the Container/ViewModel, NOT in the tier view. Report it as a
CROSS-FILE DEPENDENCY (see §7) — do not just import it.

---

## 3. The Twelve Forbidden Patterns (auto-checked by Subagent 12)

Each subagent MUST self-check these GREP predicates against its touched files
before reporting completion. Each row is verifiable by `rg` (ripgrep).

| ID | Pattern forbidden in tier | Self-check grep (must return ~0 or commented) |
|---|---|---|
| **N1** | `useQuery`/`useMutation`/`useSubscription` in tier | `rg -n "use(Query\|Mutation\|Subscription)\(" frontend/mobile frontend/desktop` → 0 |
| **N2** | `useXStore(...)` direct subscription in tier | `rg -n "use[A-Z]\\w\*Store(" frontend/mobile frontend/desktop` → 0 |
| **N3** | `RequirePermission` / `useUserStore(` in tier | `rg -n "RequirePermission\|useUserStore(" frontend/mobile frontend/desktop` → 0 |
| **N4** | Inline `z.object` / `zodResolver` in tier | `rg -n "z\\.object\|zodResolver" frontend/mobile frontend/desktop` → 0 (or only `import`) |
| **N5** | Inline `Record<E,K>` label-maps >5 entries in tier | `rg -n "Record<\\w+,\\s\*(typeof\\s+\\w+\|keyof\\s+\\w+\|string)>" frontend/mobile frontend/desktop` → only `// TIER-SPECIFIC JUSTIFICATION:` lines |
| **N6** | `useEffect`/`useLayoutEffect` for data in tier | `rg -n "useEffect\|useLayoutEffect" frontend/mobile frontend/desktop` → 0 |
| **N7** | `useState`/`useReducer` in tier | `rg -n "useState\|useReducer" frontend/mobile frontend/desktop` → 0 |
| **N8** | `useRouter(` direct navigation in tier | `rg -n "useRouter\(" frontend/mobile frontend/desktop` → 0 |
| **N9** | Inline lowercase pure-data helpers in tier | `rg -n "^function [a-z]\|^const [a-z][A-Za-z]+\\s\*=\\s\*\\(" frontend/mobile frontend/desktop` → 0 |
| **N10** | Direct `date-fns` import anywhere in tier | `rg -n "from \"date-fns\"" frontend/mobile frontend/desktop` → 0; raw `parse(` / `format(` / `addDays(` / `differenceInCalendarDays(` calls → 0 |
| **N11** | Deriving `useMemo` chains in tier | `rg -n "useMemo\(" frontend/mobile frontend/desktop` → only lines tagged `// RENDER OPT JUSTIFICATION:` |
| **N13** | Cross-tier imports (mobile↔desktop) | `rg -n "@/frontend/(mobile\|desktop)/" frontend/mobile frontend/desktop` filtered to cross-imports → 0 |
| **N15** | `interface Xxx(Mobile\|Desktop)Props` duplicates | `rg -n "interface \\w+(Mobile\|Desktop)Props" frontend/mobile frontend/desktop` → only `// VARIANT JUSTIFICATION:` matches |
| **N16** | `useTheme()` for non-styling computation | Status→color / palette-key helpers live in common; tier only passes theme |
| **N17** | `useNotifications` / `@toolpad` / logger imports in tier | `rg -n "useNotifications\|@toolpad\|@/frontend/common/utils/logger\|@/backend/lib/logger" frontend/mobile frontend/desktop` → 0 |
| **N18** | `setTimeout` / `setInterval` / `clearTimeout` / `clearInterval` in tier | `rg -n "setTimeout\|setInterval\|clearTimeout\|clearInterval" frontend/mobile frontend/desktop` → only `// RENDER OPT JUSTIFICATION:` (long-press touch detection) lines |
| **N19** | `window.open` / `location.href` / `navigator.*` in tier | `rg -n "window\\.\\|location\\.href\|navigator\\." frontend/mobile frontend/desktop` → 0 |
| **N20** | `useFxLiveRefresh()` in tier | `rg -n "useFxLiveRefresh\(\)" frontend/mobile frontend/desktop` → 0 |
| **N23** | Tier `.tsx` file > 600 lines | `find frontend/mobile frontend/desktop -name "\*.tsx" -exec wc -l {} +` — every line count ≤ 600 |
| **N24** | Inline `styled(...)` factories duplicated per tier | `diff` over audit-listed twin files returns empty OR `// VARIANT JUSTIFICATION:` |
| **N25** | Custom `function useX(...)` declared in tier | `rg -n "^function use[A-Z]\|^const use[A-Z][A-Za-z]+\\s\*=" frontend/mobile frontend/desktop` → 0 (only React-component declarations capitalized) |
| **N26** | Tier calling `useXViewModel`/`useXState`/`useXFieldAccess`/`useXFormAccess`/`useXMetrics` | `rg -n "use[A-Z]\\w\*(ViewModel\|State\|FieldAccess\|FormAccess\|Metrics)\(" frontend/mobile frontend/desktop` → 0 |
| **N22** | `.stories.tsx` / `.stories.mdx` in tier | `find frontend/mobile frontend/desktop -name "\*.stories.\*"` → empty (live in `frontend/stories/`) |

### Allowance comments (the escape hatch — used sparingly)

Each `// ... JUSTIFICATION:` allowance comment is the only way to keep code
that would otherwise fail a criterion. Subagent 12 will reject an allowance
comment if it lacks the specific reason.

| Comment | Permitted only when |
|---|---|
| `// VARIANT JUSTIFICATION: extra field <name>` | The `interface XxxMobileProps`/`XxxDesktopProps` pair is GENUINELY divergent; you've also lifted `BaseXxxProps` to common; the variant ONLY adds the named extra field |
| `// TIER-SPECIFIC JUSTIFICATION: <reason>` | A `Record<E,K>` constant map exists in only ONE tier (the audit confirms there's no twin). The reason must explain the tier-only constraint (e.g., "MobileFab uses a documented Mobile-only viewport gate; desktop counterpart doesn't render this primitive") |
| `// RENDER OPT JUSTIFICATION: <reason>` | A `useMemo` or `useCallback` exists in a tier file ONLY to maintain stable JSX identity (caching a `NoRowsOverlay` slot, caching a ref-friendly callback for a child). Not used for data derivation. Reason must name the consumer component and why un-memoized would re-render. Also allowed for touch long-press `setTimeout` detection in `editableTypography` (cannot meaningfully cross tier) |
| `// EXCEPTION: documented in <path>` | Reserved for ONE documented global exception (e.g., `MobileFab.tsx` calling `useViewport`). Without a path reference, the exception clause is invalid |
| `// NEW FOR PLAN v5: <short description>` | Mandatory on every new Zustand store field/action or new common file added by this migration. Audited by Subagent 12 |

Comment clauses MUST be on the line immediately above the offending declaration.
Subagent 12's grep iterates over adjacent lines.

---

## 4. Type / Interface discipline — the ONE-PER-CONTRACT rule

For every concept named `Foo` (e.g., `ParentInvoicesCard`, `RecurringClassForm`,
`PermissionRow`, `TeacherAvailabilityGrid`), exactly ONE `FooProps` lives in
`frontend/common/views/dashboard/<domain>/types/foo.types.ts` (or
`frontend/common/components/ui/<group>/types/foo.types.ts` for UI primitives).
BOTH tier files import that single type into their component signatures.

### 4.1 Pre-classification decision tree (run BEFORE editing)

For every existing `interface XxxMobileProps` / `interface XxxDesktopProps`
pair currently declared in tier files, run a `diff` of their structural bodies
(ignoring whitespace and comments):

```bash
diff \
  <(sed -n '/interface XxxMobileProps/,/^}/p' frontend/mobile/.../xxx.mobile.tsx |
      perl -0777 -ne 's|//.*||g; s|\s+| |g; print') \
  <(sed -n '/interface XxxDesktopProps/,/^}/p' frontend/desktop/.../xxx.desktop.tsx |
      perl -0777 -ne 's|//.*||g; s|\s+| |g; print')
```

Outcomes:

| Class | Diff result | Action |
|---|---|---|
| **A. PASS-THROUGH ALIAS** | A tier's interface is just `type XxxMobileProps = XxxProps` (or `= FooVariantProps`) with NO body | DELETE the alias entirely; import the common type directly. No new common file needed (the alias was already pointing at common) |
| **B. UNIFIED ORIGINAL** (default — ~95% of pairs) | Diff EMPTY after whitespace-only normalization | Lift both declarations to a single `XxxProps` (NO tier suffix) in `frontend/common/views/dashboard/<domain>/types/xxx.types.ts`. Delete BOTH tier files' inline declarations. Both tier files import the SAME `XxxProps`. |
| **C. GENUINELY-DIFFERENT** | Diff shows intentional divergence — a tier omits/extra-adds a field | Lift the SHARED portion as `BaseXxxProps` in common. Each tier interface does `interface XxxMobileProps extends BaseXxxProps { readonly extraField: T; }`. Mark each variant interface with `// VARIANT JUSTIFICATION: extra field <name>` above its declaration. NEVER duplicate the shared fields inline in both tiers. |

### 4.2 Field-naming convention

When unifying two `FooMobileProps` + `FooDesktopProps`, the common type name
strips the tier suffix: `FooProps`. Rename usages across tier files
accordingly. The signature changes from
`function FooMobile(props: Readonly<FooMobileProps>)` to
`function FooMobile(props: Readonly<FooProps>)` (or simply
`function FooMobile(props: Readonly<FooProps>)` — the component name keeps
its tier suffix because it renders into a tier-specific tree).

### 4.3 The "card-list vs data-grid" pair case

When the mobile twin is named `FooCardListMobileProps` and the desktop twin is
`FooDataGridDesktopProps` (different variants of the same concept), the SHARED
row/item shape (`FooRow`) lifts to common as ONE type. Each tier's interface
WILL differ on layout-specific fields (e.g., desktop has `columnDefs`, mobile
has `cardRenderer`). This is a Class C variant — declare `BaseFooListProps`
(`rows`, `onRowClick`, `loading`, `labels`) and add the tier-specific extras
to each `interface XxxMobileProps extends BaseFooListProps { readonly cardRenderer: ... }`.

---

## 5. Util / Constants / Schemas / Hooks discipline

| Kind | Permitted location | NOT permitted |
|---|---|---|
| Pure-data functions (`formatDuration`, `getBadgeStatusKey`, `parseTimeValue`, `buildCreateRecurringClassInput`) | `frontend/common/views/dashboard/<domain>/utils/<name>.utils.ts` | Tier .tsx/.ts inline; `frontend/{mobile,desktop}/.../utils.ts` |
| `Record<E,K>` constant-maps (`STATUS_LABEL_KEYS`, `COMMUNICATION_ICONS`, `DAY_LABEL_KEY_MAP`) | `frontend/common/views/dashboard/<domain>/constants/<name>.constants.ts` | Tier .tsx inline (unless only used in ONE tier with `// TIER-SPECIFIC JUSTIFICATION:`) |
| Zod schemas (`z.object`, `zodResolver`) | `frontend/common/views/dashboard/<domain>/schemas/<formName>.schema.ts` | Tier .tsx inline |
| Custom hooks (`useJoinContext`, `useImageUpload`, `useEditSubjectForm`, `useMonthDrawerQuery`, `usePhoneInput`, `useNarrowContainer`) | `frontend/common/views/dashboard/<domain>/hooks/<name>.hooks.ts` OR `frontend/common/components/ui/<group>/hooks/<name>.hooks.ts` | Defined inside tier `.tsx`/`.ts` |
| Zustand stores | `frontend/common/stores/` only | Anywhere else |
| Storybook stories | `frontend/stories/` only | `frontend/{mobile,desktop}/...` |

### Rule of thumb

If you'd be tempted to define a `<lowercase-name>` inside a tier `.tsx`,
export it from `frontend/common/views/dashboard/<domain>/utils/<name>.utils.ts`
(or `constants/`, `schemas/`, `hooks/`) and import it. The tier file's body
then contains only the rendering code.

### Pure-data helpers vs sub-component render helpers

The N9 grep distinguishes them by capitalization:
- `function formatDuration(mins: number): string` → lowercase first letter → pure data → MUST live in common
- `function TeacherCard(props: ...) {...}` → capitalized first letter → React component → may live in tier

When a tier file MUST have a tiny internal sub-component (e.g., a memoized
cell renderer), it's allowed AS LONG AS the component name is PascalCase AND
it does NOT itself contain any forbidden patterns. The sub-component lives in
the same tier file (`MobileSlotItem` etc.); its props interface is local
(`SlotItemProps`) AND must NOT be a paired duplicate of a desktop twin (if it
is, unify under `frontend/common/views/dashboard/<domain>/types/`).

### Byte-identical twin modules

If a `.ts` file in `frontend/mobile/components/ui/<group>/` is byte-identical
to its `frontend/desktop/components/ui/<group>/` twin, the bytes live ONCE in
`frontend/common/components/ui/<group>/{utils,hooks}/...` and BOTH tier files
import. Examples flagged by the audit:
- `MetricCard/utils.ts` (both) — `formatValue`, `valueColor`, `*sx` helpers
- `paymentMethodDisplay.types.ts` (both)
- `meetingConfigDisplay.types.ts` (both) — type + a `effectiveMeetingToDisplayData()` helper leaked into the `*.types.ts`
- `currencyDisplay.constants.ts` (both)
- `countryOptionRow.utils.ts` (both)
- `currencyOptionRow.utils.ts` (both)
- `usePhoneInput.{ts,desktop.ts}` (~470 lines each)
- `useLocaleSwitchSuccess.{ts,desktop.ts}` (both)
- `useNarrowContainer.{ts,desktop.ts}` (both)

---

## 6. State ownership rule (zero-state-in-tier)

### 6.1 The container → ViewModel → view contract

```
app/(<scope>)/<page>/page.tsx
  renders frontend/common/views/dashboard/<domain>/<Domain>Container.tsx

<Domain>Container.tsx (common)
  - calls use<Domain>ViewModel(props)  ← ALL state/data lives here
  - wraps RequirePermission around <Domain>View>
  - passes the viewModel object via `props={viewModel}` to <Domain>View>

<Domain>View.tsx (common, switcher)
  - calls ResponsiveViewSwitch with mobile/desktop lazy components
  - passes viewModel down to the tier views

frontend/{mobile,desktop}/views/dashboard/<domain>/<domain>.{mobile,desktop}.tsx
  - READS viewModel fields via props
  - CALLS viewModel.* actions
  - RENDERS — nothing else
```

### 6.2 TheViewModel is the SOLE owner

A `use*ViewModel.ts` (in common) is the SOLE place that:
- subscribes to Zustand stores (`useXStore(selector)`)
- engages GraphQL via `useQuery`/`useMutation`/`useSubscription`
- calls `useRouter()` for programmatic navigation
- triggers `useNotifications().show(...)` for toasts
- emits `logger.info(...)`/`logger.error(...)`
- calls `useEffect` to subscribe to data sources (`useFxLiveRefresh`)
- instantiates forms via `useForm`/`useWatch` from `react-hook-form`
- constructs Zod schema instances via `createXxxSchema(labels)` (the schema
  file lives in `frontend/common/views/dashboard/<domain>/schemas/`)
- debounces inputs via `setTimeout`
- performs `window.open` action handlers (e.g., `onOpenResource`, `onOpenMeetingUrl`)

Tier view bodies NEVER touch the items above. They call the
`viewModel.handleX(payload)` callback; the ViewModel does the work.

### 6.3 Pass-down imperative — concrete shape

A ViewModel-typed prop object passed to a tier view looks like:

```typescript
interface ParentBillingViewModel {
  // STATE (read-only on tier side)
  readonly rows: readonly ParentInvoiceRow[];
  readonly loading: boolean;
  readonly activeTab: BillingTab;
  // LABELS (already fetched via useAppTranslation ONCE inside the VM)
  readonly labels: BillingManualLabels;
  readonly tErrors: ErrorLabels;
  // ACTIONS (callbacks the tier view calls)
  readonly onTabChange: (tab: BillingTab) => void;
  readonly onMarkPaid: (invoiceId: string) => Promise<void>;
  readonly onOpenInvoice: (url: string) => void;
}
```

The tier view's signature is `function ParentBillingMobile(props: Readonly<ParentBillingViewModel>)` —
it destructures those fields and wires them into the render. NO local state
helpers, NO GraphQL calls, NO transformers. Pure passdown.

### 6.4 Zustand store augmentation (NS-3 nested subagent protocol)

The NS-3 nested subagent OWN store changes. Its protocol:
1. Open the existing `frontend/common/stores/<domain>Store.ts`.
2. Read the current `interface <Domain>State` shape.
3. Determine the new fields/actions needed by NS-2's lifted state.
4. **Prefer extending an existing store** over creating `<domain>UiStore.ts`.
5. Any new field/action carries `// NEW FOR PLAN v5: <short description>`.
6. The store's selector helper should export a `use<Domain>Ui(...)` hook ONLY
   if it doesn't already — check before creating.
7. Run `bun tsgo` on `frontend/common/stores/<domain>Store.ts` AFTER editing
   and BEFORE letting other nested subagents depend on the new fields.
8. If the new fields belong in a store the migration wave hasn't created
   yet, CREATE `frontend/common/stores/<domain>UiStore.ts` with the prefix
   `// NEW FOR PLAN v5 (newly created for the migration wave)` at file top.

Subagent 12 audits all NEW FOR PLAN v5 additions: any addition without the
comment is rejected.

---

## 7. CROSS-FILE DEPENDENCY — the report shape

If a subagent (main or nested) needs to fix something outside its assigned file
set, it MUST NOT modify the un-assigned file. It MUST emit:

```
CROSS-FILE DEPENDENCY:
  Target file: <this file path>
  Blocked by: <other file path that needs changes>
  Rule violated: <F<n> from §3, or the exact rule name from §4/§5/§6>
  Required fix: <concrete description of the edits the other file needs>
  Severity: <BLOCKING | NON-BLOCKING>
```

The orchestrator collects these and dispatches a reconciliation wave once the
main wave completes. A subagent that silently edits out-of-scope files is a
contract violation — Subagent 12's `git diff --stat` cross-check will catch it.

---

## 8. Lint queue server — non-negotiable

The orchestrator starts the lint queue server ONCE before the wave:

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts    # listens on 4777
```

Every subagent MUST use the client:

```bash
curl -s -X POST http://localhost:4777/lint \
  -H 'Content-Type: application/json' \
  -d '{"id":"<unique-id-string>","files":["<path1>","<path2>"]}'
```

Response: `{ success: boolean, output: string, exitCode: number }`. Blocks
until the lint run on those files completes (server serializes requests).

**NEVER run `bun run lint` or `bun lint` directly.** Concurrent lint runs
cause resource contention and intermittent failures per AGENTS.md. A
subagent that does this fails its contract — orchestrator restarts it.

### Per-file verification order (progressive enforcement)

For each file modified/created, run sequentially (use
`bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>`):

| `--lifecycle` | Checks |
|---|---|
| `tsgo` | `bun tsgo` only |
| `biome` | tsgo → `bun biome:check` |
| `lint` | tsgo → biome → lint-queue-client |
| `codescene` | tsgo → biome → lint-queue → `codescene --file` |

Subagents start at the lowest relevant lifecycle and short-circuit at first
failure. Don't run later stages until earlier stages pass.

### Health check the queue

```bash
curl -s http://localhost:4777/status    # { running: true, queueLength: N }
```

If `running: false` or connection refused — stop and report to the
orchestrator as a CROSS-FILE DEPENDENCY targeting "lint-queue-server".

---

## 9. Pre-flight every subagent does (before its first edit)

1. **Read this `specs.md` in full** via the Read tool.
2. **Read the layer-AGENTS.md files** that apply to its slice (per the
   mapping in root AGENTS.md):
   - Files under `frontend/views/` → `frontend/views/AGENTS.md` + `frontend/AGENTS.md`
   - Files under `backend/services/` → `backend/services/AGENTS.md` + `backend/AGENTS.md`
   - Files under `frontend/common/graphql/sharedDocuments/` → that folder's AGENTS.md + `frontend/common/graphql/AGENTS.md` + `frontend/AGENTS.md`
   - Test files → `tests.instructions.md` + the relevant layer
3. **Read the instruction files** (`.github/instructions/*.instructions.md`)
   that match its file path:
   - `frontend/**` → `frontend.instructions.md`
   - `backend/**` → `backend.instructions.md`
   - `**/*.test.ts(x)` or `**/*.spec.ts(x)` → `tests.instructions.md`
   (Multiple may apply — read all.)
4. **Grep-check the slice files** against each of N1-N26 BEFORE editing —
   so you already know the violations exist; you won't accidentally pass them
   through unchanged.
5. **Grep existing common-side synonyms** before declaring a new common
   type/util: `rg "<TypeName>" frontend/common/` — if it exists, REUSE don't
   redeclare.

Skip step 1 only if your previous Read of `specs.md` was within the same
fix-loop round (≤3 rounds — re-read after the loop). Otherwise: always re-read.

---

## 10. Per-fix-loop-round re-verification

After each round of fixes (max 3 rounds per subagent):

1. Re-read `specs.md` section 3 (the 12 forbidden patterns + the
   justification comment table). The list drifts in your head otherwise.
2. Re-run the relevant grep checks (N1-N26) on the touched files.
3. If the grep returns violations, emit another fix-loop round.
4. On round 3 with remaining violations, STOP and report PARTIAL with
   CROSS-FILE DEPENDENCIES explaining the residual violations.

---

## 11. Reporting format — every subagent's final message

```
SUBAGENT <id-or-name> — <PASS | PARTIAL | FAIL>

Files changed (this agent's edits — `git diff --name-only` from the workspace
top is the authoritative list):
- <path> — <action: created | modified | deleted | repointed-imports>

Nested subagent results (if this is a Main-Subagent with nested):
- NS-1: <PASS/FAIL with file count>
- NS-2: <PASS/FAIL with file count>
- NS-3: <PASS/FAIL with file count>
- NS-4: <tsgo count / biome count / lint-queue exit code>

Store additions (NEW FOR PLAN v5):
- <storeName>.ts — fields: [ ... ], actions: [ ... ] (each noted with the
  `// NEW FOR PLAN v5` comment text)

CROSS-FILE DEPENDENCIES (blockers requiring orchestrator reconciliation):
- Target: <path> | Blocked by: <path> | Rule: <F<n> or section> | Required
  fix: <description> | Severity: <BLOCKING/NON-BLOCKING>

Acceptance criteria LOCAL checks (the 26 greps you ran on your touched files):
- N1: PASS — evidence "rg output: 0 lines"
- N2: PASS — evidence "..."
- ... (every N that applies to your scope; the rest as N/A: not-in-scope)
```

The orchestrator collects this format and feeds it to Subagent 12 for the
final acceptance dashboard.

---

## 12. The orchestrator's contract with subagents (reciprocal)

The orchestrator:
- Will NOT edit files itself during the wave (only pre-flights, dispatches,
  reconciles the cross-file-log, runs the auditor).
- Will include this file's ABSOLUTE path
  (`/home/ahmed/Projects/siraj/specs.md`) in every Task prompt it sends,
  with the line: `Read /home/ahmed/Projects/siraj/specs.md in full before
  your first action. It is binding on every nesting level.`
- Will include the file as `file_attachments: ["specs.md"]` for subagents
  that benefit from a pre-loaded copy.
- Will NOT paraphrase or summarize this file; subagents read the original.
- Will re-include `specs.md` in fix-round retries and reconciliation-wave
  prompts (the file may have been updated since the last read).

Main subagents:
- Pass this file's path down to their nested subagents in the same manner.
- Embedded nested-subagent prompt template (see "Main-subagent operations
  manual" §B in the plan) MUST contain the line: `Read
  /home/ahmed/Projects/siraj/specs.md in full. It binds you equally.`

Fix-round nested subagents:
- Receive the same instructions as initial nested subagents.

Reconciliation-wave subagents:
- Same — additionally the orchestrator tells them exactly which dependency
  they're unblocking, so they can read `specs.md` §6/§4 against the specific
  contract.

---

## 13. One-page reminder (paste it on every subagent prompt)

> **specs.md summary card** — you are bound by `/home/ahmed/Projects/siraj/specs.md`.
> Read it. Three top rules: (1) tier = rendering ONLY, (2) common = the ONLY
> place for types/utils/state/schemas/hooks, (3) state lives in common
> Zustand stores and flows DOWN via ViewModel props. Twelve forbidden
> patterns N1-N26 self-check via `rg` before reporting. Allowance comments
> are strict — no comment, no pass. No cross-tier imports. No
> `bun run lint` directly — use the queue client.
> Use lint client on port 4777. Per-file verify via
> `bun run scripts/health/sub-loop.ts <file> --lifecycle lint`. Emit the
> CROSS-FILE DEPENDENCY format if blocked. Stick to your scope. Cap fix
> loops at 3 rounds. Rate `PASS/PARTIAL/FAIL` with the canonical report
> format. Don't drift.
