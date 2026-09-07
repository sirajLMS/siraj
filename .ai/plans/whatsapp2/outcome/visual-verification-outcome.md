# Visual Verification Outcome — whatsapp2 prototype parity

**Mode:** implementation-vs-prototype verification for `.ai/plans/whatsapp2/` (all 15 phases implemented). Locales: EN (no AR captures run this pass). Viewports: 1440×900 desktop + 390×844 mobile.

## Reachability (browser, authenticated, dev server)

All screens reachable via `/settings/whatsapp` + tab navigation + dialog actions:
- Numbers tab (incl. Connect Business App once `WHATSAPP_APP_ID`/`WHATSAPP_ES_CONFIG_ID` env-config is set — set in dev DB for review), Add-Number dialog, ES dialog, Inbox tab (list → thread), Templates, Opt-in. Mobile variants all reachable.
- Zero whatsapp-scoped console errors throughout.

## Score history

Pass 1 (13 comparisons): PARITY-OR-BETTER — numbers cards, numbers mobile, opt-in (7), add-number (7), inbox list (8), templates (blocked by foreign build error), plus gaps: ES stepper missing (4/10), inbox empty richness (7/10), thread markers unverified (7/10), declined sync states MISSING, numbers sync panels thin.

Fix waves: F1 inbox states (empty card, declined banner, read-only banner, day separators, pagination clamp), F2 number-card sync panels (syncing phase/progress/deadline, failed declined panel + retry, complete panel), F3 ES stepper (real session-state-driven 3-step, version note, 24h info, error/cancel surfaces, X close), F5 cross-file wiring (pothos `syncDeadlineAt`/`syncFailureReason` + fragment + codegen + 8 i18n keys), F4 add-number/opt-in banners.

Pass 2 (9 comparisons on fixed captures): sync-states 7 (below-fold panels DOM-verified), sync-states-mobile 8, add-number 8, opt-in 9, inbox-declined 6 → fixed (declined empty-state block), inbox-empty 9, thread 6 (markers DOM-verified — capture truncation artifact), es-dialog 9, templates 9.

## Real bugs found & fixed during verification

1. Inbox VM used 1-indexed page with a 0-indexed grid → permanent negative-OFFSET error (broken inbox on empty list).
2. CSP blocked `connect.facebook.net` + missing nonce propagation — Embedded Signup could never launch.
3. `ConversationThread` rendered message content only when string; ingest stores `{body}` records — text never rendered for real messages.
4. `WhatsappPurposeSelect` wrapped MenuItems in a custom component → MUI saw valueless children; purpose selection fully broken in Add/Edit dialogs (root-caused, fixed, browser-verified).
5. Foreign in-flight build error (SessionAuditDataGrid.tsx) briefly blocked the Templates route — resolved by its owner; templates re-verified.

## Accepted deviations (prototype ≠ spec wins)

- OTP boxes in the onboarding prototype: not built — pairing completes inside the WhatsApp Business app (real ES v4 flow).
- Human phone-number + country-prefix field: replaced by Phone Number ID + WABA ID (Cloud API reality).
- Prototype's 2/3-col card grids vs single-column detail cards — detail-richer in implementation.
- Inbox "Status" column (synced/reply-via-phone per conversation): no data model — out of scope.
- Page-level Export/Add-New header buttons on inbox: not part of the spec.

## Demo data left in dev DB

3+ whatsapp accounts (GENERAL complete, STUDENTS syncing 45%, ADVERTISING not-started, declined-history account), 3 conversations, 11 messages, env:: overrides for `WHATSAPP_APP_ID`/`WHATSAPP_ES_CONFIG_ID` — kept for human review. Seeds: `scratch/seed-whatsapp-demo.ts`, `scratch/seed-whatsapp-declined.ts`. Captures: `scratch/screenshots/whatsapp2/` + `fixed/`.

## Lessons (evolution)

- MUI `Select` requires direct `MenuItem` children — any wrapper component breaks value matching silently ("out-of-range" warning, dead clicks). Check this FIRST when a Select looks wired but won't select.
- Inbox pagination: DataGrid is 0-indexed; VM page state must be 0-indexed and clamped (`Page 2 of 1`/`OFFSET -n` outcomes otherwise).
- Verifying "dumb" states (empty/declined/failed) requires SEEDED state, not just route reachability — declined banner was code-complete but unverifiable until a declined account existed.
- agent-browser dev sessions can stall on long multi-capture scripts; a second agent-browser daemon (`connect <port>`) + Playwright MCP fallback unblocked it.

## Final pass (post-commit)

Re-captured the last unverified states in `scratch/screenshots/whatsapp2/final/`:
- `numbers-sync-full-a/b/b2.png` — full scroll of Numbers: syncing panel (phase label, 45% progressbar, deadline) ✓, declined error panel + guidance + retry ✓ (DOM-verified).
- `inbox-declined-final.png` — declined banner + "Number not available — sync declined" empty block ✓.
- `thread-full.png` — edited / revoked / media-expired markers + TODAY pill + read-only footer all viewport-confirmed (earlier pass 2 low score was a fold-truncation artifact).
- `add-number-final.png` — purpose select end-to-end works post-fix; purpose description line renders.
- `numbers-ar.png` / `inbox-ar.png` — AR/RTL spot check: dir="rtl", Arabic tabs/chips/columns, zero horizontal overflow.

All prototype views: implemented, reachable, parity-or-better. The loop is closed.

## Polish pass (style-hunt wave)

Hunted: 30 captures (EN+AR, desk+mob across all 9 surfaces) + 12 rubric inspectors + 8 fix agents.

**Fixed:** tab accent unified to primary (shared `GenericTabNav`), mobile numbers header collapse to icon actions, bare numbers empty state → proper CTA card, chip flow wrap, read-only banner outlined, declined-copy dedupe, dashed→solid empty borders, phone-number bidi isolation (`dir="ltr"` + unicode-bidi isolate), preview/timestamp RTL cramping, row hover + chevron affordance, thread timestamps into bubble footers + bottom padding + pinned read-only strip, ES dialog CTA nowrap + stepper balance + actions gap, add-number banner wrap/notch/helper grouping, opt-in chip padding + consent axis + compact empty grid, templates dual-CTA harmonization + framed empty state + sync icon.

**Global fixes:** EN mobile header avatar bleed (root cause: CustomizeButton full label at xs → icon-only below md), gapcursor SSR error resolved (stale Turbopack cache post tiptap dedupe; verified clean).

**Stories created (6):** NumberCardSyncPanels, NumberCardPurposeSync, InboxTabContent, ConversationThread, EmbeddedSignupDialog (session hook mocked via sb.mock), CreateAccountDialog.

**Re-capture verification (`fixed2/`):** 10/10 surfaces PASS with DOM metrics (token colors, rects, wrapping, bidi). Zero console errors.

**Deferred as out-of-scope/hand-off:** global app-shell accents, yellow Customize button prominence (app chrome), backend mid-word 140-char preview slice (`whatsapp-webhook-inbox.helpers.ts:94`), `mediaPending` key unused (no backend signal yet).
