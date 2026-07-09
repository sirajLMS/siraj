# Decision 8: Migration strategy

## Status: **DECIDED — 8C (clean-slate)** for this enhancement

**Context:** Early development — OK to drop the DB and clean-create migrations. Confirmed alongside Decision 1A (unified payment methods + JSONB).

---

## Decision: **8C** — Clean-slate schema + regenerate migrations

**Idea:** Land the target schema in Drizzle schema files, drop/recreate local DB as needed, and generate a fresh migration set (or replace the migration history intentionally) instead of multi-phase expand/contract dual-writes.

### What this means in practice

1. Edit schema to the **final** shape (`users` person fields, `user_payment_methods`, `user_meeting_configs`, drop old role columns / teacher banking table, etc.)
2. Use Drizzle MCP `generate` (skills rev 12 aligned) to produce migration SQL from the new schema
3. Reset local DB / re-run migrations + seeds
4. No prolonged dual-read of `teachers.phone` vs `users.phone` in production code paths

### Pros

- Fastest path to the target model  
- No temporary dual-column complexity  
- Payment/banking/meeting redesigns don’t fight old table shapes  
- Matches “we can drop the DB”  

### Cons

- Not safe for a production DB with irreplaceable data (N/A for current stage)  
- All environments must reset together  
- Seed/demo data must be rewritten for new tables  

---

## Rejected for this enhancement

### 8A — Expand → backfill → switch → drop

Safer for production cutovers; unnecessary overhead while DB can be wiped.

### 8B — Fewer larger migrations with in-place backfill

Still assumes keeping existing data through ALTER/UPDATE. Prefer full clean create while early-dev allows it.

---

## When to revisit

If any environment gains durable production data before this ships, revisit **8A** for that environment only; keep schema target the same.
