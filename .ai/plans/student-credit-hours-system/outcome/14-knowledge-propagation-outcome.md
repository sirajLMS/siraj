# Phase 14 Outcome — Knowledge Propagation

## Result: COMPLETE — 14.1–14.9 done, all health checks green

Notable discovery: several propagation targets had already been (partially) created during implementation phases — `docs/billing/credit-hours-system.md` already existed (committed `afb9601518`), the quota cross-ref existed, and the root AGENTS.md Important References entry already existed. Work below filled the remaining gaps only; nothing was duplicated.

## Propagation record

| Subtask | Target | Result |
|---|---|---|
| 14.1 | `docs/billing/credit-hours-system.md` | Already existed; added Deferred Items section (D-1…D-5, incl. `deductHoursForBooking` = intentional dormant code rule) |
| 14.2 | `docs/billing/quota-system.md` | Extended existing cross-ref: quota periods (FIFO, rollover) vs hour ledger's no-period purchase/deduct/adjust semantics |
| 14.3 | `backend/db/schema/AGENTS.md` | Dialect-aware CHECK constraints rule (`checkConstraint`, never raw drizzle-orm `check()`; XOR parallel-ledger pattern) |
| 14.3 | `backend/db/repo/AGENTS.md` | Snapshot-on-purchase + guarded-update version self-increment rule (cites inert-lock lesson) |
| 14.3 | `backend/services/AGENTS.md` | Single-orchestrator write pattern (AccountingPaymentService owns invoice+payment+ledger+balance tx) |
| 14.3 | `backend/graphql/AGENTS.md` | Accounting surface registration files (`accounting.pothos.ts`, `accounting.query.ts`, `accounting.mutation.ts`) |
| 14.3 | `backend/types/AGENTS.md` | Parallel-unit type variants (hour vs class); also repaired a mangled heading from an earlier edit |
| 14.3 | `backend/enum/AGENTS.md` | Enum extension pattern (idempotent `ALTER TYPE … ADD VALUE`, cross-layer values in `shared/constants/`) |
| 14.3 | `frontend/common/graphql/AGENTS.md` | Accounting sharedDocuments convention entry |
| 14.3 | `frontend/common/views/AGENTS.md` | Accounting ViewModel patterns (plan auto-fill, paid-toggle guard, filter store) |
| 14.3 | `frontend/AGENTS.md` | Accounting routes bullet under Dashboard UI Patterns |
| 14.4 | `.agents/skills/drizzle/SKILL.md` | "Dialect-Aware Constraints & Soft-Delete Indexes" section (XOR checkConstraint + partial unique index examples) |
| 14.5 | `.agents/skills/review-frontend/SKILL.md` | Checklist line: package-plan selection auto-fills hours/amount/currency. No new skill created (deferred to codebase owner) |
| 14.6 | `.agents/instructions/backend.instructions.md` | Accounting permissions + single-orchestrator pattern bullet |
| 14.7 | `.agents/instructions/frontend.instructions.md` | Accounting routes + `dashboard.accounting.*` namespaces bullet |
| 14.8 | Root `AGENTS.md` | No change needed — Important References entry already existed in house style |

## 14.9 Final global health check
- `bun tsgo` — exit 0
- `bun biome:check` — exit 0 (1 pre-existing baseline warning: `.claude/skills` symlink)
- `bun run lint` — exit 0

## Caveats
- All factual claims in propagated docs were verified against outcome files and source (e.g. `InvoiceType.CREDIT_HOURS_PACKAGE` in `shared/constants/billing.enum.ts`; low-hours threshold seeded 2.00 / code fallback 5; XOR SQL at `credit-transactions.ts:78-81`).
- Changes left uncommitted in the working tree; commit scoping belongs to the user (per repo policy, use the commit-scoped skill).
- Documentation-only phase: zero source code modified.

## Plan status
All 14 phases complete. Deferred ledger: 5 items, all 📋 Future/Planned — none blocking.
