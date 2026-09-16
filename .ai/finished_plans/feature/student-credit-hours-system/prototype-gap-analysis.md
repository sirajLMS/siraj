# Prototype Gap Analysis — student-credit-hours-system

Task ID: S1 · Read-only analysis · Branch: `feat/student-credit-hours-system` · No source files modified.

## Method & constraints

1. **Skill rules applied** (`.agents/skills/spec-implementation/SKILL.md` §Plan Intake & Validation, §Prototype-Aware Implementation, lines 47–131): prototypes are imagination aids whose IA/UX must be matched or exceeded; implementation conventions (MUI / `AppDataGrid` / theme-palette / RHF+Zod / i18n via `shared/locale`) **win** over prototype styling details; prototype data is 100% fake and judged only as an element inventory — never by verbatim Tailwind classes or hex tokens.
2. **Spec grounding**: `specs.md` read in full (482 lines). Verdicts cite EARS user stories (`US-x.y`), Edge Cases (`EC-n`) and NFRs. Where a prototype contradicts the spec, **spec wins**. Where the prototype is consistent with spec but absent from code → gap. Where the prototype goes beyond spec → listed separately as "beyond-spec candidate".
3. **Screenshot limitation**: PNGs could not be rendered in this sandbox sub-agent context (image reads return "[images are not available in sub-agent context]"). Per prototype skill the HTML carries the complete DOM/element inventory, so evidence base = HTML element structure + copy + Material-Symbols inventory; Tailwind token tables used as THEME HINTS ONLY.
4. `worklog.md` did not exist at intake time (no prior agent context available).
5. All 7 spec routes exist and were walked; per-screen method A–D was followed with fallback (HTML-first) noted above.

### Implemented-surface file map

| Prototype screen | Implemented surfaces |
|---|---|
| payments-dashboard | `app/(dashboard)/accounting/payments/page.tsx`; `frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.tsx`; `frontend/mobile/views/dashboard/accounting/PaymentsListView.mobile.tsx`; VM `frontend/common/views/dashboard/accounting/usePaymentsListViewModel.ts`; store `frontend/common/stores/accountingPaymentsStore.ts`; docs `frontend/common/graphql/sharedDocuments/accounting/accounting.documents.ts` |
| add-payment-form | `app/(dashboard)/accounting/payments/new/page.tsx` (+ `[id]/edit/page.tsx`); `PaymentFormView.desktop.tsx` / `PaymentFormView.mobile.tsx`; VM `usePaymentFormViewModel.ts`; schema `frontend/common/views/dashboard/accounting/schemas/paymentFormSchema.ts` |
| payment-detail | `app/(dashboard)/accounting/payments/[id]/page.tsx`; `PaymentDetailView.desktop.tsx` / `PaymentDetailView.mobile.tsx`; VM `usePaymentDetailViewModel.ts`; components `components/PaymentHistoryTimeline.tsx`, `components/PaymentDocumentPreview.tsx` |
| package-plans-catalog | `app/(dashboard)/accounting/packages/page.tsx` (+ new/edit); `PackagePlansListView.desktop|.mobile.tsx`, `PackagePlanFormView.desktop.tsx`; VMs `usePackagePlansListViewModel.ts`, `usePackagePlanFormViewModel.ts` |
| student-credit-hours | Tab mounted on both profile shells: `frontend/desktop/views/dashboard/students/profile/studentProfilePage.desktop.tsx:103,122` and `.mobile` twin; shared tab `frontend/common/views/dashboard/students/profile/StudentCreditHoursTab.tsx`; visibility gating `studentProfileTabs.ts:27–35` |
| my-credit-hours-mobile | Same shared `StudentCreditHoursTab` via mobile profile shell (spec: "Shared: ViewModels, GraphQL documents"); students' own entry via `/students/me/profile` redirect → `/profile` |

---

## Screen 1: Payments dashboard (desktop list) — **✓ At/equal-or-better than spec parity; prototype KPI money-aggregates simplified to honest row counts; Student/Parent filters are wired in store/locale but have NO UI control (spec US-3.1 violation)**

### Feature matrix

| # | Feature | Status | Prototype evidence | Implementation evidence (file:line) | Spec stance | Suggested scope |
|---|---|---|---|---|---|---|
| 1.1 | Page header + subtitle + "Add Payment" CTA | ✓ | `payments-dashboard.html` page header block (h1 "Credit-Hours Payments", copy, purple CTA) | `PaymentsListView.desktop.tsx:245–257` (`DesktopPageHeader` + `DesktopPrimaryPageAction` linking `/accounting/payments/new`) | Required (UX table `/accounting/payments`) | frontend only — done |
| 1.2 | 4 KPI cards | ~ | Money aggregates: Received This Month $124,500 w/ "+14% vs last month", Pending Online $18,230 across 42 txns, Overdue $5,420 / 12 accounts, Top Package Plan + adoption bar | `PaymentsListView.desktop.tsx:209–243` metrics built from real rows in `usePaymentsListViewModel.ts:122–130` (total / paid / unpaid / ΣcreditHours "h") | Spec requires no KPI strip (US-3.1 only table); counts are honest & real-data-driven; prototype's monthly-trend/adoption/overdue are **beyond-spec candidates** needing server aggregates | P2: either server-side currency-sum aggregate (Plan 3/5 territory) or caption "of loaded rows" — do not fake trend % |
| 1.3 | From/To date filters (inclusive) | ✓ | Date Range dropdown in filter bar | `PaymentsListView.desktop.tsx:48–65`; mobile `PaypaymentsListView.mobile.tsx:54–73`; filter mapping `usePaymentsListViewModel.ts:178–187` | Required (US-3.1) | done |
| 1.4 | Unpaid-only toggle | ✓ | (implicit under Status dropdown) | Desktop select `all/unpaid` `:66–77`; mobile Switch `:74–83` | Required (US-3.1 `isPaidStatusOn=false`) | done |
| 1.5 | **Student filter** | ✗ UI / ~ plumbing | Search box "Search receipt or student…" | Store fields + setters exist: `usePaymentsListViewModel.ts:147–172`; GraphQL input `studentId` `:180–186`; locale keys exist EN/AR `shared/locale/{en,ar}/dashboard/accounting/payments.ts` `filters.student` — **no control renders them** | **Required (US-3.1)** — wired backend, dead-end frontend | **P0**: add `StudentAutocomplete` filter control desktop + mobile |
| 1.6 | **Parent filter** | ✗ UI / ~ plumbing | Search box (prototype conflates) | same as 1.5 (`parentId` end-to-end except UI) | **Required (US-3.1)** | **P0**: add parent autocomplete filter (or fold into student filter row) |
| 1.7 | Text search (receipt/student) | ✗ | Top-bar search + in-filter search inputs | none | Beyond-spec candidate | P2 triage (needs server `search` arg) |
| 1.8 | Payment Type / Package Plan filter dropdowns | ✗ | Filter bar buttons | none | Beyond-spec candidates (gateway filter maps to enum; package filter trivially supported by data) | P2 triage |
| 1.9 | Export CSV button | ✗ | header + filter bar Export CSV | none | Beyond-spec candidate | P2 triage |
| 1.10 | Row selection checkboxes | ✗ | select-all + per-row checkbox | none | Beyond-spec candidate (bulk actions need backend) | P2 triage |
| 1.11 | Column set | ✓ better | Receipt #, Student(avatar+"Paid by"), Package(+hrs remaining), Amount+ccy, Type badge, Status pill, Date, ⋮ actions | `PaymentsListView.desktop.tsx:93–207`: studentName+parentName subtext, creditHours "`X.XX h`", amount+currency right-aligned, packageName+codename(mono), **gateway localized**, paymentDate, createdAt, status Chip, detail link; row-click→detail `:276` | Spec's 9 columns matched (receipt # has no schema field — prototype-only; Type badge contradicts spec `PaymentGateway` enum → **spec wins**, implementation correct) | done; receipt# only if product asks (needs code column) |
| 1.12 | Hover-reveal row action menu | ~ | more_vert icon fades in on hover | Always-visible detail chip + full-row click — equal affordance in grid conventions | Neutral | none (convention wins) |
| 1.13 | Pagination footer | ✓ | numbered pages "Showing 1 to 4 of 32" | `AppDataGrid` client pagination `:267–278`; fetch cap 500 `usePaymentsListViewModel.ts:13` | US-3.1 paginated | OK for catalog-size data; revisit if >500 |
| 1.14 | Loading / empty / error states | ✓ | n/a (static proto) | `DesktopListStateGate` gate `:265–279` with `t.empty`/`t.loadError`; skeletons on mobile `mobile:94–99` | NFR i18n empty message | done |
| 1.15 | Mobile card variant (Student/Credit/Paid/status/date) | ✓ | (separate mobile proto screens) | `PaymentsListView.mobile.tsx:100–147` card shows studentName, status chip, amount+currency, hours, packageName, date — exactly spec's mobile key-field set | Required (Mobile vs Desktop table) | done |
| 1.16 | Sidebar group placement | ✓ | active nav item "Credit-Hours Payments" | `navigationConfig.ts:240–241` grp_accounting, items `:582–614`, permission-gated | Required (UX & Navigation section) | done |

### Styling parity notes
- Zero Tailwind/hex leakage in views — all `sx={theme => …}` palette callbacks (`surfaceContainerLow`, `outlineVariant`, `onSurfaceVariant`). Status uses semantic `paymentStatusTone` success/warning (`accountingFormatters.ts:60–62`) instead of prototype's invented green/red hexes: correct translation.
- Deltas worth adopting (10/10 look): prototype's per-card accent icon chips and highlighted remaining-hours card already mirrored by `DesktopMetricCardGrid` variants incl. `"danger"`/`"highlight"` (`:231,:239`) — good.
- Deviation: desktop grid fixed height 560px (`:266`) truncates wide columns less gracefully than prototype's min-w scroll table; acceptable.

---

## Screen 2: Add Payment form — **✓ Exceeds prototype on all spec-required fields (adds Paid toggle + Note the prototype lacks); three prototype extras intentionally unimplemented per spec; Paid-toggle default ON contradicts spec's "default OFF"; currency list narrowed**

### Feature matrix

| # | Feature | Status | Prototype evidence | Implementation evidence (file:line) | Spec stance | Suggested scope |
|---|---|---|---|---|---|---|
| 2.1 | Back link / breadcrumbs + title/subtitle | ✓ | arrow_back + "Add Credit-Hours Payment" | `PaymentFormView.desktop.tsx:123–132` breadcrumbs | UX flow | done |
| 2.2 | Student search autocomplete (w/ ID hint) | ✓ | suggestion dropdown "James Smith – ID: 89342" | `StudentAutocompleteDesktop` `:227–244`; resolved option kept in local state `:108–111` (real query-backed options, not mock array) | Required (US-2.1 field list) | done |
| 2.3 | Package plan select (active only) | ✓ | select 10/20/50-Hour plans | `PackagePlanSelectShared` `common/components/…/PackagePlanSelectShared.tsx` wired `:249–263`; includes **ad-hoc "manual payment" option** exceeding prototype (EC-18 allows NULL plan) | Required | done |
| 2.4 | Auto-fill Credit/Paid/Currency from plan snapshot | ✓ | disabled Hours=10 / Amount="250 USD" inputs | `usePaymentFormViewModel.ts:126–147` — watch planId → fetch plan → setValue hours/amount/currency | Required (US-2.1 auto-fill) | done |
| 2.5 | Fields stay editable after auto-fill | ✓ better | "Override defaults" toggle gates editing | Fields always editable `:266–319` — capability superset; one control fewer (conscious divergence, note in review) | US-2.1 says "remain editable so the admin can override" → implementation is the spec-faithful reading | none |
| 2.6 | Payment Type segmented Cash/Online/Internal/CreditTransfer | ✗ spec-wins | 4-segment control + conditional online sub-form | Replaced by localized `PaymentGateway` Select NONE/PAYPAL/WESTERN_UNION/BANK/OTHER `GATEWAY_OPTIONS :33–39`, select `:326–344` | Spec enum wins (`paymentGatewayEnum NOT NULL DEFAULT NONE`) | none — prototype taxonomy must not survive |
| 2.7 | Bank Name select | ✗ beyond-spec | "CIB Egypt"-style bank list | none | Beyond-schema (no column) | beyond-spec candidate list (would need `bankName`/metadata) |
| 2.8 | Transfer Reference Number * (required-if-online validation) | ✗ beyond-spec | TRN-998234 field w/ inline error | None at create; **but `transactionRef` displays existing `transactionId` on detail** (`PaymentDetailView.desktop.tsx:145`) — half-feature asymmetry | Beyond-spec candidate; note `payments.transactionId` exists (Plan 7 webhook target) | P2 candidate: optional transactionId input in form OR drop display |
| 2.9 | Receipt upload drag&drop (PNG/JPG/PDF ≤5MB) | ✗ beyond-spec | cloud_upload zone | none | Beyond-spec (storage integration, no FK column) | beyond-spec candidate (depends on StorageService attachment pattern) |
| 2.10 | Payment Date picker | ✓ | absent in prototype! | `DesktopAppDatePicker :347–358`; ISO coercion comment `:180–182` | Required (US-2.1) | done (impl exceeds proto) |
| 2.11 | Paid toggle switch | ~ | absent in prototype (spec adds it) | Switch + dynamic label paid/unpaid `:360–369`; **default `isPaidStatusOn: true`** `usePaymentFormViewModel.ts:55` | Required, but US-2.1 specifies "**default OFF**" → deviation | **P1 one-liner**: default false |
| 2.12 | Note field | ~ | absent in prototype | multiline TextField 3 rows `:372–387` (plain text; spec parenthetically says "rich text") | Required; plain text acceptable unless repo rich-text convention exists elsewhere (billing notes) | P2 confirm convention; else keep |
| 2.13 | Client validation / submit disable / success+error snackbars | ✓ | (static errors shown) | zodResolver schemas `createPaymentFormSchema(t)` localized messages `:96–114`; submitting spinner state; `FormSuccessSnackbar`/`DesktopFormErrorSnackbar` `:401–402` | NFR a11y + UX | done |
| 2.14 | Edit flow locks snapshot, edits hours/gateway/note | ✓ | (not in prototype) | edit branch `:134–221`; VM `onEditSubmit :198–225` (expectedInvoiceVersion:null carry-forward flagged in code) | US-3.2 exact | done |
| 2.15 | Currency-mismatch soft warning | ✗ | absent | **locale keys exist but unused**: `currencyWarning` EN/AR (`shared/locale/ar/dashboard/accounting/payments.ts:68–69`) never referenced in `frontend/**` | Open Questions/R2 SE: "UI should warn when currency differs from student's most-recent payment currency" (EC-5) | **P1**: compute prev currency (GraphQL: `lastPaymentCurrency` on balance query or client peek at accountingPayments cache) → Alert under currency field |
| 2.16 | Mobile stacked form sections | ✓ | (mobile spec row) | `PaymentFormView.mobile.tsx` full stack incl. both option sets `:29–49` | Required | done |
| 2.17 | Currency option set | ~ | modal offers USD/EUR/GBP | Hardcoded narrow list EGP/USD/SAR/AED duplicated in BOTH form views (`PaymentFormView.desktop.tsx:41–53`, `.mobile.tsx:37–49`) while generated `CurrencyCode` has ≥13 members incl. EUR/GBP | Spec: "Reuse the existing currencyCodeEnum (EGP/USD/EUR/GBP/SAR…) — no new currency enum" | **P1**: unify into shared constant/guard reuse (pattern like `isSharedCurrency`), decide subset explicitly |

### Styling parity notes
- Section panels (`DesktopSectionPanel` Student/Package/Payment Details) reproduce prototype's 3-section card hierarchy with theme tokens — good density match.
- Inline helper/error text styled by MUI defaults; prototype's red inline error affordance preserved via `error`/`helperText`.
- RTL: switches/selects/autocomplete all direction-safe; date input relies on browser `type=date` (see repo-wide scan).

---

## Screen 3: Payment detail — **✓ Equal-or-better: real derived history timeline + live invoice PDF preview exceed prototype; Void Payment correctly omitted (v1 defers refund); mobile variant missing timeline + document access; cosmetic zoom strings hardcoded**

### Feature matrix

| # | Feature | Status | Prototype evidence | Implementation evidence (file:line) | Spec stance | Suggested scope |
|---|---|---|---|---|---|---|
| 3.1 | Breadcrumbs Billing▸Payments▸Receipt# | ✓ | breadcrumb trail | `PaymentDetailView.desktop.tsx:59–64` | UX | done (root crumb = Payments not Billing — fine, matches IA) |
| 3.2 | Hero amount + currency suffix + status pill | ✓ | "$250.00 USD" + Received chip | `:95–113` money/currency + status Chip w/ tone | US-3.1 data | done |
| 3.3 | **Mark Paid/Unpaid toggle action** | ✓ better | read-only pill in prototype | header secondary action lock/unlock `:66–78`; VM mutation `usePaymentDetailViewModel.ts:37–60` w/ refetch; error alert `:81–85`; success labels `togglePaidSuccessOn/Off` | US-2.2 required (impl ADDS what prototype lacked) | done |
| 3.4 | Field grid: Receipt#/Date/Student/PaidBy/Package/Hours/Gateway/Bank/TransferRef | ~ | synthetic CH-2026-0042; "Paid By Sara Hassan (Mother)"; Bank "CIB Egypt"; mono ref chip | `:117–147`: invoiceId, paymentDate, studentName→profile link (exceeds: navigable), parentName, package+cocoename, creditHours h, gateway localized, transactionRef, invoiceStatus; note block `:149–154` | Spec-required subset all present. Deviations: **no payer-relation label** (beyond-schema), **no Bank** field (beyond-spec, see 2.7), avatar absent (~ styling) | P2: relation via students↔parents join if product wants |
| 3.5 | History timeline card | ✓ better | 4 invented entries ("credited 20h", "marked Received", "Bank receipt uploaded", "created by Admin") | `PaymentHistoryTimeline.tsx:32–99` renders REAL derived events (kinds PAYMENT_RECORDED/HOURS_CREDITED/HOURS_ADJUSTED/MARKED_PAID resolved from credit ledger via `history` field on query `accounting.documents.ts:124–131`); kind-toned dots map `:21–26`; newest-first `:41`; empty label handled | Matches video intent, computed from actual `credit_transactions` (specs Architecture diagram) | done — model for "equal or better" |
| 3.6 | Document preview panel (zoom/rotate/expand) | ~ | iframe-ish doc w/ zoom_in/out, rotate_right, click-to-expand | `PaymentDocumentPreview.tsx:90–125` embeds `/api/invoices/{invoiceId}/download` iframe, zoom ±10% `:54,:65`, download icon-button `:72–87`, dashed empty-state | Spec has no PDF requirement (Plan 3 hooks it) — impl delivers early via existing route | P2 polish: rotate/expand; **P1 i18n**: hardcoded "Zoom out"/"Zoom in" tooltip+aria strings `:48,:52,:60,:64` |
| 3.7 | Sticky footer: Void Payment / Edit / Download PDF | ~ | Void(error)/Edit/DownloadPDF buttons | Header holds Mark-Paid toggle + Edit link; PDF via preview download `:179` | **Spec wins**: v1 explicitly does NOT implement refund/void (EC-6/Open Questions "True refund flow deferred to v2") → omit Void (list as future-plan candidate) | record decision in outcome doc |
| 3.8 | Audit extras createdAt/updatedAt | ✓ | timestamps inside timeline only | separate DetailFields `:165–168` | Neutral | done |
| 3.9 | Not-found / loading / toggle-error states | ✓ | n/a | `:38–55` + alerts | NFR | done |
| 3.10 | Mobile full-screen w/ collapsible sections | ~ | (mobile variant of surface) | `PaymentDetailView.mobile.tsx`: status card `:31–66`, fields card `:85–133`, audit card `:135–150`, action chips `:182–193` | Spec mobile row satisfied structurally; **sections not collapsible** (minor) and **timeline/document absent on mobile** → parity gap within feature | **P1 G7**: mount `PaymentHistoryTimeline` + a download link on mobile |

### Styling parity notes
- Two-column ⅔+⅓ layout mirrors prototype at lg (`Stack direction="row"` flex 2/1, `:87–171`) using palette dividers; sticky footer replaced by persistent header actions — consistent with desktop app shell conventions.
- Suggest: adopt prototype's colored-dot ring effect already approximated (`bgcolor tone.main`); fine.

---

## Screen 4: Package Plans catalog — **✓ Spec-prescribed DataGrid CRUD replaces bento cards (spec wins); validityMonths delivered end-to-end; archive+confirm implemented; only inline-archive-on-list and richer archived-visual fall short of prototype**

### Feature matrix

| # | Feature | Status | Prototype evidence | Implementation evidence (file:line) | Spec stance | Suggested scope |
|---|---|---|---|---|---|---|
| 4.1 | Header + New Package Plan CTA | ✓ | title+subtitle+button | `PackagePlansListView.desktop.tsx:184–194` | US-1.1 route | done |
| 4.2 | Catalog visualization: bento card grid | ~ spec-wins | 3-col cards w/ hourglass art, gradient tops, hover lift | DataGrid `:198–213` cols codename(mono)/displayName+description/hours hrs/price+currency/currency/active chip/sortOrder/actions | Specs Mobile-vs-Desktop table mandates "DataGrid CRUD" on desktop → translation correct; mobile keeps card list `PackagePlansListView.mobile.tsx:37–86` per spec | none (record divergence reason) |
| 4.3 | Validity badge ("6 Months" etc.) | ✓ better | chip per card + Validity Period select 1/3/6/12/Unlimited | Real `validityMonths` column end-to-end (schema/repo/service/zod/form `PackagePlanFormView.desktop.tsx:240–256`, labels `package-plans.en.ts:33`) exceeds prototype fiction; loss: preset-chip picker reduced to free number input (~ minor UX) | metadata.extensible intent → delivered as first-class column | P2 offer preset menu on top of number input |
| 4.4 | "Most Popular" star badge | ✗ | star icon on Standard 20h | none | Beyond-spec (needs sales aggregation) | beyond-spec candidate (P2, derives from accountingPayments) |
| 4.5 | Archived card treatment (grayscale overlay chip + disabled btns) | ~ | grayscale + "Archived" pill overlay | Active/Archived Chip col `:109–121`; mobile opacity 0.72 `mobile:47` | Information parity ok; visual drama lighter | P2 styling nicety |
| 4.6 | Archive action w/ confirmation explaining snapshot semantics | ✓ | archive icon (unconfirmed) | Form-header Archive button + confirm Dialog `PackagePlanFormView.desktop.tsx:95–108,289–303`; archiveBody copy explains snapshot non-retroactivity | US-1.2 required | done; **copy bug: trigger label uses `t.archived` ("Archived") instead of verb** `:104` |
| 4.7 | Unarchive path | ~ | unarchive icon on archived card | Via `active` Switch in edit form `:257–266` + `activeHelp` explanatory copy (EN locale line 31) — functional, discoverable-ish; list has NO inline archive/unarchive | US-1.2 (archive; revive implied by admin flows) | P2: inline archive button in list Actions col (mutation already exists `archivePackagePlanMutationDocument.documents.ts:195–208`) |
| 4.8 | Create modal fields | ✓ spec-over-proto | Modal: Name/Hours stepper/Validity/Price/Currency/Description — **no Codename!** | Full-page form incl. **required unique Codename** (disabled on edit) `:114–130` | **Spec wins** (US-1.1 codename REQUIRED + case-insensitive dedupe EC-10) — implementation correctly adds what prototype omitted | none |
| 4.9 | Hours precision | ✓ better | integer +/- stepper | decimal input step 0.5 min 0.5 `:169–184` | EARS `creditHours > 0` numeric(12,2) | done |
| 4.10 | Currency select | ~ | USD/EUR/GBP | Narrow literal list EGP/USD/SAR/AED duped `:33–45` (same issue as 2.17) | reuse full enum per spec | **P1 (shared with G6)** |
| 4.11 | KPI strip | ✓ better | none in proto | total/active/archived/price-leader cards `:149–182` from real rows | Neutral addition | done |
| 4.12 | Empty/loading/error + pagination | ✓ | static | `DesktopListStateGate` `:199–212`; client pagination | NFR | done |
| 4.13 | Mobile card w/ edit pencil | ~ | (spec mobile row) | whole-card Link→edit `mobile:38`, pencil-less but equal affordance; FAB create `:95` | Spec "Card list with edit pencil" | P2 add trailing pencil icon for explicitness |

### Styling parity notes
- Mono codename cell mirrors prototype's tech-code aesthetic via `fontFamily:"monospace"` + typography token (`:44–51`) — good tokenization.
- Price-leader highlight card uses theme "highlight" variant — prototype's decorative gradients correctly dropped.

---

## Screen 5: Student credit-hours tab (desktop) — **✓ All spec-mandated content shipped with clean real-data wiring; richest prototype ideas (donut, per-package accordions, timeframe chips, $ valuation) are beyond-v1-by-design; low-balance alert semantics diverge from spec threshold; ONE fabricated metric found (CRITICAL)**

### Feature matrix

| # | Feature | Status | Prototype evidence | Implementation evidence (file:line) | Spec stance | Suggested scope |
|---|---|---|---|---|---|---|
| 5.1 | Profile shell tabs incl. Credit Hours | ✓ | Overview…Credit Hours(active)…Notes tabs | STUDENT_PROFILE_TABS + gating `studentProfileTabs.ts:3,27–35` (comment: mirrors quota-tab audience = managers + assigned teachers; own-profile pass via student_identity.view_own) | Route `/students/[id]/profile?tab=credit-hours` | done |
| 5.2 | Timeframe filter chips (All Time/This month/Last 3 months) | ✗ | chips row above stats | none (query takes first-N only) | Beyond-spec candidate (would need dated range arg on transactions query) | beyond-spec triage |
| 5.3 | Stat: Total Purchased | ✓ | 30 hrs card | BalanceCard creditHoursTotal `StudentCreditHoursTab.tsx:151–156` ← `studentCreditHourBalanceQueryDocument` | US-5.1 | done |
| 5.4 | Stat: Used Hours | ✓ | 18.5 card | derived consumed=max(0,total−remaining) `:115,157–162` | derived value, real inputs | done |
| 5.5 | Stat: Remaining w/ progress bar (highlighted) | ✓ | 11.5h + 38% bar, primary-bordered card | highlight card + LinearProgress ratio `:163–170`; danger tint when low `BalanceCard color :354–361` | US-5.1 | done |
| 5.6 | Stat: Balance Value in $ w/ month trend | ✗ deliberate | "$287.50 • trending_down Since last month" | none | **Correct omission**: v1 ledger is single-numeric-hours (EC-5/R2 SE warning re mixed currencies) — currency-valued balance would encode the known flaw | keep off until Plan 4 multi-currency ledger |
| 5.7 | Low-balance alert | ~ | n/a (spec feature) | Alert warning `:143–147` gated by **ratio** `LOW_BALANCE_RATIO=0.25` `:35,:133` — semantics differ from spec's absolute `accounting_low_hours_threshold` (seeded 2.00 in migration 34, used by backend notifier `backend/services/billing/accounting-notification.service.ts:91`); GraphQL `AccountingPaymentBalance` exposes only remaining/total (`schema.graphql:36–41`) | **Required US-5.1**: "remaining < accounting_low_hours_threshold" → alert | **P1**: expose threshold (or boolean) on balance resolver; frontend consumes; keep as seed-source of truth |
| 5.8 | "Next class consumes X hours" hint | ✗ CRITICAL | teacher-audience promise in specs | Rendered with **hardcoded "1.00"** `:172–176` (`t.nextClassConsumes("1.00")`) — fabricated metric, no schedule lookup exists | beyond-v1 (Epic 6 wires billedUnit deduction) but the STRING claims data that doesn't exist | **P0 remove or gate** behind real next-instance duration |
| 5.9 | Recent purchases: last 10 hour-based transactions table | ✓ | Session Consumption table inside accordions | `RecentHourTransactions :190–289` — studentCreditTransactions(hoursOnly:true, first:10) `:91–110`; cols date/change±(colored)/reason chip localized/note ellipsis; stickyHeader aria-label; loading LinearProgress; empty+error handled | US-5.1 EXACT match ("table of their last 10 hour-based transactions") | done |
| 5.10 | Package History accordions w/ donut chart & session table (Class/Teacher/Dur/Run.Total) | ✗ | expanded/collapsed per-package accordions, SVG donut 57%, sessions w/ teacher names | flat transactions table instead | Beyond-spec candidates: per-package grouping possible (group by sourcePayment) BUT session Class/Teacher/duration depend on Epic 6 booked-hour deductions that don't exist in v1 → cannot populate honestly today | beyond-spec triage post-Epic-6 |
| 5.11 | Audience hints (admin/teacher/parent/student copy) | ✓ better | single-view proto | resolveCreditHoursAudience `:55–60` + perAudience hints `:62–73,:137–141` — 4 localized audiences exceed prototype's single persona | Specs per-audience table | done |
| 5.12 | Parent top-up CTA | ✗ | (implicit parent persona) | none | Per-audience table lists "top-up CTA" for parents | P2 candidate: deep-link Button → `/accounting/payments/new?studentId=` (purchase itself is admin-only in v1) |

### Styling parity notes
- Three balance cards replicate prototype stat-card anatomy (icon tile + uppercase label + big numeral) fully tokenized; highlight border/shadow pattern equals prototype emphasis without hardcodes.
- Reason chips use outlined Chips w/ tone mapping — cleaner than proto, i18n'd (reasons.PURCHASE… in EN/AR).
- Donut upgrade: could later use MUI-x charts gauge; not required.

---

## Screen 6: My credit-hours (mobile student self view) — **~ IA covered through the SHARED tab on mobile profile (per spec sharing mandate); distinctive prototype chrome (donut hero, My Packages accordion, ghost Buy-Hours FAB, student Credits bottom-nav slot) is divergent/beyond-v1**

### Feature matrix

| # | Feature | Status | Prototype evidence | Implementation evidence (file:line) | Spec stance | Suggested scope |
|---|---|---|---|---|---|---|
| 6.1 | Mobile surface reachable by student own-profile | ✓ | standalone mobile screen | `studentProfilePage.mobile.tsx:103,135` mounts same tab; students/me/profile redirects → /profile (own) | Shared-docs mandate + ALL-audiences read row | done |
| 6.2 | Donut overview hero (X.Xh Remaining) | ~ | SVG donut 38% arc | Highlight card + `LinearProgress` bar conveys identical number+trend info; hero-donut is visual upgrade | Same data as 5.x; visuals beyond-spec | P2 candidate for mobile highlight card only |
| 6.3 | Total/Used/Remaining trio | ✓ | 3 compact cards | Same BalanceCard stack wraps responsively (flexWrap) `:150–170` | US-5.1 | done |
| 6.4 | "My Packages" accordion + per-package progress/history sublist | ✗ | expandable packages, "-1.5h" history lines | Flat recent-transactions list serves the same records without per-package grouping | Beyond-spec (as 5.10) | beyond-spec triage |
| 6.5 | Consumed/"Used up" strikethrough package row | ✗ | opacity+strikethrough+check_circle | none | Beyond-spec (per-package model) | beyond-spec triage |
| 6.6 | Disabled "Buy Hours" FAB (lock ghost) | ~ | visible-disabled affordance | Absence-of-FAB (correct rule: students can't purchase in v1 — permissions gate recordAccountingPayment to admins) | Business-correct; prototype's communicative ghost state is a nicety | P2: optionally render locked FAB deep-linking to support/contact — needs product call |
| 6.7 | Student-facing bottom-nav "Credits" item | ✗ | Credits tab active in bottom nav | BOTTOM_NAV_ITEMS gains staff-gated `accounting-payments` entry (`navigationConfig.ts:797–802`) — different audience than prototype's student Credits slot | Spec §Mobile bottom-nav deliberately adds it STAFF-only → prototype conflicts (prototype imagined consumer self-service purchase not in v1) | beyond-spec candidate aligned w/ Plan 7 self-service; do not implement now |
| 6.8 | Session deduction rows (-Xh red) | ✓ equivalent | history lines w/ negative deltas | change cells colored error/success `:247–257` | data ✓ | done |
| 6.9 | Notifications bell / top bar | ✓ | proto topbar | MobilePageHeader title/subtitle (`mobile:37`) — bells live in global mobile header | Neutral | none |

### Styling parity notes
- Mobile containers (`MobilePageContainer/Header/Fab`) match sfscaffold; all spacing symmetric (RTL-safe); no direction-dependent styles introduced.

---

## Repo-wide scans results

### Fake-data scan (rule: zero mock data anywhere — CRITICAL findings)

Scopes swept: `frontend/common/views/dashboard/accounting/**`, `frontend/desktop/views/dashboard/accounting/**`, `frontend/mobile/views/dashboard/accounting/**`, `frontend/common/graphql/sharedDocuments/accounting/**`, plus targeted literal sweeps across `frontend/**` and `app/**`.

| Finding | Location | Severity | Rule hit |
|---|---|---|---|
| Fabricated metric literal `"1.00"` rendered as real data ("next class will consume 1.00 h") with no underlying schedule source | `frontend/common/views/dashboard/students/profile/StudentCreditHoursTab.tsx:172–176` | **CRITICAL (fake data surviving to UI)** | Remove the block, or compute from the student's next scheduled instance duration (only meaningful post-Epic-6) |
| Hardcoded English strings bypassing `shared/locale` (Tooltip titles + aria-labels "Zoom out"/"Zoom in") | `frontend/desktop/views/dashboard/accounting/components/PaymentDocumentPreview.tsx:48,52,60,64` | CRITICAL-class i18n violation | Move to `dashboard.accounting.payments.detail.*` keys EN+AR (aria included) |
| Duplicated non-i18n `CURRENCY_LABELS` literals + narrowed option arrays duplicated in two files (drift risk; omits EUR/GBP though enum/spec include them) | `PaymentFormView.desktop.tsx:41–53`; `PaymentFormView.mobile.tsx:37–49`; `PackagePlanFormView.desktop.tsx:33–45` | High-hygiene | Extract shared currency-option constant (reuse generated enum + any existing `isSharedCurrency` guard), document chosen subset or widen |
| Locale-pinned date formatting (`en-GB`) contradicting its own AR-safety comment; Arabic users get English dates on all accounting dates | `accountingFormatters.ts:52–57`; duplicate inline copy `StudentCreditHoursTab.tsx:239–245` | High-hygiene (i18n/RTL NFR) | Replace with the repo's locale-aware formatter (Intl passes current locale) |
| Copy bug: archive-dialog trigger labelled with noun `t.archived` ("Archived") instead of verb | `PackagePlanFormView.desktop.tsx:104` vs `package-plans.en.ts:42–43` | Minor | Use dedicated `archiveAction` verb key |
| Verbatim-flow scan: NO hardcoded name/amount/mock fixture arrays anywhere in accounting runtime surfaces (the "Layla/STU-" hits are pre-existing Storybook stories for unrelated surfaces; test fixtures in `test/ui/components/accounting/*.test.tsx` are legitimate scaffolding) | — | ✔ clean otherwise | All rendered values flow: documents → Apollo hooks → real resolvers |

Honest-approximation note (not fake): list KPI counts & hour sums aggregate client-side over fetched window (`MAX_FETCH_ROWS=500`, `usePaymentsListViewModel.ts:13`) — real values, bounded; suggest caption or server aggregate before scale-out.

### A11y / RTL scan highlights

- ✔ Grid `ariaLabel={t.pageTitle}`; table `aria-label`; icon buttons carry `aria-label` from labels (edit/clear); filters use `labelId` association; form fields label-bound via MUI (TextField label / InputLabel `htmlFor` chain).
- ✔ RTL: zero physical `left/right` margins in new views (Stack/flex gaps + sx spacing); chips/avatars/text mirror automatically; currency codes kept LTR-safe as code tokens beside amounts.
- ~ Keyboard: AppDataGrid keyboard row navigation satisfies the NFR baseline, but row-open is click/Enter only via `onRowClick` — verify Enter-on-focused-row opens detail in grid a11y mode.
- ~ `Chip onClick` used as a pseudo-button for mark-paid toggle on mobile detail (`PaymentDetailView.mobile.tsx:183–188`) — lacks button role semantics; swap to `ToggleButton`/`Button` variant for a11y parity with desktop.
- ~ `type="date"` inputs render browser-native pickers that ignore locale ordering — acceptable app-wide convention, flag if AR QA complains.
- √ Shared `formatAccountingMoney` groups digits; no fabricated currency symbols (`$`) introduced.

---

## Consolidated gap backlog (prioritized)

Counts: **P0 = 2 · P1 = 4 · P2 = 4** task groups (row-level deltas tallied: 3 ✗-missing-required items land in P0/P1; everything else is polish/beyond-spec).

### P0 — correctness / spec-required / zero-fake-data enforcement
- **G1 — Kill the fabricated "next class consumes 1.00 h" line.**
  Layers: frontend only. Files: `StudentCreditHoursTab.tsx:172–176` (+ its test coverage patch). Effort: <0.5d. Option B (better, small): compute from student's next instance once Epic 6 exists — until then delete.
- **G2 — Ship the spec-required Student & Parent filters in the payments list (desktop FiltersBar + mobile).**
  Layers: frontend glue + tests. Plumbing already exists (store setters, GraphQL `filter.studentId/parentId`, locale `filters.student/parent` EN+AR). Add `UserAutocomplete` controls; wire `setStudentId/setParentId`; extend `hasActiveFilters` clearing; update `payments-list.test.tsx`. Effort: ~1d.

### P1 — spec deviations & high-value cheap wins
- **G3 — Currency-mismatch soft warning at Add Payment** (EC-5 / R2 SE). Consume unused `t.currencyWarning`; source previous currency via tiny GraphQL addition `lastPaymentCurrency` on `AccountingPaymentBalance` (server has the query in repo layer) or cached accountingPayments peek. Layers: graphql(shared doc+codegen) + VM + both form views + snackbar/alert + tests.
- **G4 — Threshold-faithful low-balance alert.** Extend `AccountingPaymentBalance` resolver with `lowHoursThreshold` (read `SystemSettingsService.getSettingByKey("accounting_low_hours_threshold")`, mirroring notification service) or boolean `lowBalance`; frontend compares absolutely; keep ratio visualization. Layers: backend graphql + frontend tab + tests. Fixes US-5.1 EARS exactly.
- **G5 — Accounting i18n/formatting hygiene pack.** (a) localize zoom tooltips/aria (locale keys EN+AR); (b) locale-aware date formatter replacing pinned `en-GB` in `accountingFormatters.ts:56` and tab `:240`; (c) fix archive trigger verb copy. Layers: shared/locale + 3 frontend files. Trivial, unblocks AR QA.
- **G6 — Unify/widen currency options.** Single shared constant fed by generated `CurrencyCode` (+ existing guard helpers), decision recorded for subset (recommend matching spec exemplar set EGP/USD/EUR/GBP/SAR + current locale order); removes 3 duplicated literals. Layers: frontend/common + views.
- *(G6b micro-item folded here)* Set create-default `isPaidStatusOn:false` per US-2.1 wording (one line + test expectations).

### P2 — parity polish & beyond-spec candidate triage (require product sign-off before building)
- **G7 — Mobile payment-detail completeness:** mount `PaymentHistoryTimeline` (+ audit events) and invoice-download link in `PaymentDetailView.mobile.tsx`; consider collapsing sections. Pure mobile frontend.
- **G8 — Dashboard honesty/KPI upgrades:** caption metrics "of loaded rows" now; optional server aggregate endpoint for money-denominated received/pending totals (Plan 3/5 coordination).
- **G9 — Beyond-spec backlog register** (write decisions into plan `outcome/`): export CSV · free-text/gateway/package list filters · bulk row selection · most-popular-plan badge · timeframe chips on student tab · per-package accordions + donut (post-Epic-6 dependency for honest data) · parent top-up CTA · student "Credits" bottom-nav slot · locked Buy-Hours FAB affordance · payer-relation label · bank/reference input (tie to existing `transactionId`) · receipt-upload attachments (StorageService dependency) · Receipt# code column (schema). None blocks v1 acceptance.
- **G10 — Visual polish batch:** archived-row grayscale/overlay styling on lists; avatar chip in detail student field; document-preview rotate/expand controls; preset chips atop validityMonths input; mobile edit-pencil trailing icon on package cards.

### Intentional divergences already compliant (reviewers should NOT flag)
Prototype DataGrid-for-bento on packages (spec table wins) · Gateway enum select instead of Cash/Online/Internal segments (enum wins) · codename added where modal omitted it (US-1.1 wins) · always-editable auto-filled fields replacing "Override defaults" toggle (superset) · no Void/refund (EC-6 v1 deferral) · no `$`-valued balance card (EC-5 mixed-currency limitation) · staff-only mobile bottom-nav accounting entry (spec §Mobile) · always-visible action chips instead of hover menus.
