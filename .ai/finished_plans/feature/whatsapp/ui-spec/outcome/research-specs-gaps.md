# Research: WhatsApp Spec Gaps Analysis

> **Plan-Correction Note (2026-08-17):** The plan source this outcome executed has since been corrected in `.ai/plans/whatsapp-plan-fixes/`. Contradictions recorded below are historical; do not re-apply them.

## Source
Subagent: research-specs-gaps
Elapsed: 512s, 28 tool calls

## Key Findings

### Specs.md Coverage
- REQ-1 (AdapterSend): No UI tasks traceable
- REQ-2 (MetaCloudApiAdapter): No UI tasks
- REQ-3 (Wamid): No UI tasks
- REQ-4 (Config Views): Tasks 14-19 cover UI scaffolding, but create/edit form deferred
- REQ-5 (Templates Sync): Task 25 covers sync(create) wiring, no persistence
- REQ-6 (Dispatch): No UI
- REQ-7 (Opt-In): Tasks 26.1-26.2 complete; 26.3-26.6 DEFINED BUT NOT IMPLEMENTED (non-admin table, bulk, filters, audit trail)
- REQ-8 (Webhook): No UI
- REQ-9-12: Backend-only or edge-case items

### Implementation.md Coverage
- Q1 Desktop: WhatsAppSettingsNote variant per-role
- Q2 Zustand: intentionally NO store (deviates from pattern)
- Q3 ssr:false: WhatsApp uses ssr:false in lazy loading
- Q4 Tracking: COMPLETED: wamid→notificationId mapping
- Q5 Templates: COMPLETED: parsers, request builder
- Q6-9: Backend
- Q10 Mobile UX: explicit intent: mobile = read-only dashboard
- Q11 opt-in table/filters: declared but not implemented
- Q12 active tab: current implementation uses useState (Pattern B)
- Q13 GraphQL resolvers
- Q14-19: Backend pattern docs
- C1-C3: Critical findings resolved in review rounds

### Trackable-tasks.md Coverage
- Tasks 14-19: UI scaffolding (all [x])
- Task 20: Desktop/mobile Variants (all [x])
- Task 21: Shared common logic (all [x])
- Task 22: Permission integration (all [x])
- Tasks 23-24: i18n labels ([x])
- Task 25: Templates sync wiring (all [x])
- Tasks 26.1-26.2: Opt-in admin toggle (all [x])
- Tasks 26.3-26.6: Opt-in non-admin table, bulk, filters, audit trail — DEFINED BUT NOT IMPLEMENTED
- Task 27: Error states ([x])
- Task 28: Loading states ([x])
- Task 29: Demo data ([x])
- Task 30: Final validation ([x])

### Gap Summary (by severity)

#### HIGH Gaps
1. **No create/edit account form**: GraphQL docs (createWhatsappAccount, updateWhatsappAccount) exist but never wired. Types (whatsappSettingsTypes.ts) declared but unused. Form should allow adding new WhatsApp Business phone numbers and editing credentials.
2. **Templates not persisted**: Templates live only in syncFromMeta mutation result. Vanish on remount. Need a persisted templates query + Apollo cache.
3. **31 i18n labels defined but never rendered**: quality大盘, tier captions, throughput labels, template status labels (PAUSED, PENDING_DELETION, DISABLED), coexistence/unverified warning labels, delivery failure keys. Raw enum values (GREEN, TIER_1K, STANDARD) shown to users.
4. **Opt-in tab incomplete**: Tasks 26.3-26.6 defined (non-admin table, bulk actions, filters, audit trail) but never implemented. Only admin toggle complete.
5. **No input validation on credential dialogs**: Access token field has no min-length/format check. PIN field may accept non-6-digit values. No client-side validation before mutation call.

#### MEDIUM Gaps
1. **Frontend duplication**: layout pieces duplicated across common/desktop/mobile. Extract shared primitives.
2. **No persisted templates query**: templates vanish after remount.
3. **No per-row delete/sync loading indicator**: Loading only at snackbar level. No feedback on row that was clicked.
4. **No deep-linking of tabs**: Active tab is useState only. Cannot share URL with tab selected.
5. **Delete confirm dialog doesn't name account**: Generic "Are you sure?" instead of "Delete 'AccountName'?"
6. **statusChipColor missing PAUSED/PENDING_DELETION/DISABLED**: Default case returns grey for all unknown statuses.
7. **Mobile delete has no confirmation**: Desktop has DeleteConfirmDialog; mobile silently deletes without confirm.
8. **Recurring offenders across review rounds**: diagnostics_and_quality_drift docs, ad-hoc type creation, authScope mismatches, TierError→generic Error.

#### LOWER Gaps
1. **No animations/transitions**: Tab switch, sync feedback, delete feedback all instant.
2. **Coexistence/unverified warnings never shown**: Labels defined but unreferenced.
3. **Permission fallback={null} silent hide**: No "unauthorized" UI shown.
4. **Dead form types**: WhatsappAccountFormValues, ApiFormValues, CredentialFormValues declared but unused.
5. **Snackbar overlaps mobile bottom nav**: Position bottom-center may overlap.
6. **Minimal test coverage**: Only 1 test file.

### Traceability Matrix Status
- specs.md → trackable-tasks.md: mostly traceable, but UI tasks 14-19 are very abstract compared to detailed non-UI tasks
- implementation.md → trackable-tasks.md: Q10/Q11 explicitly reference unimplemented items
- trackable-tasks.md → code: tasks marked [x] match code reality, but Tasks 26.3-26.6 are genuinely missing

### Spa-Driven-Development Skill Improvement
- specs.md should have explicit "UI Acceptance Criteria" per requirement
- implementation.md should specify every UI component by name and tier
- trackable-tasks.md should have one task per component/view, not one per layer
- Q11 (opt-in table/filters) should not be left as "deferred" without explicit task links
