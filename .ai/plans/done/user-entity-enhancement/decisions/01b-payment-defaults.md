# Decision 1b: Default + direction rules for multiple payment methods

## Status: **DECIDED — 1bA**

**Locked with Decision 1A:** multiple methods per user in `user_payment_methods`; each row has `direction` + `isDefault`.

Only relevant because we locked **multiple methods per user** (see Decision 1).

---

## Decision: **1bA** — One default per direction

At most one default for **pay-in** flows and at most one for **pay-out** flows. Parents and teachers can therefore use different primary accounts for invoicing vs payroll.

### Example

| Method | direction | isDefault |
|--------|-----------|-----------|
| Bank IBAN | PAYOUT | ✓ |
| PayPal | PAYOUT | |
| PayPal | PAYIN | ✓ |
| STC Pay phone | PAYIN | |

### Locked rules

1. **PAYIN default** — at most one row per user with `isDefault=true` and `direction IN (PAYIN, BOTH)`.
2. **PAYOUT default** — at most one row per user with `isDefault=true` and `direction IN (PAYOUT, BOTH)`.
3. **`direction=BOTH`** — a single row may satisfy **both** slots when `isDefault=true` (one account used for pay-in and pay-out). While that row is default, no other row on the user may be default.
4. **Setting a new default** — service clears the previous default in the same direction slot(s) before setting the new one (same transaction).
5. **UI** — show separate “default for receiving payments” vs “default for payouts” when the user has methods on both sides; hide or collapse when only one direction applies.

### Enforcement

| Layer | Approach |
|-------|----------|
| **Service** | On create/update, unset competing defaults in the affected slot(s) |
| **DB** | Partial unique indexes scoped by direction eligibility (see Decision 1 schema notes) |

---

## Rejected options (for context)

### Option B — Single global default method

Exactly one `isDefault=true` per user across all methods. Rejected: awkward when pay-in and pay-out should differ; mixed-role users (parent + teacher) suffer.

### Option C — No default in DB; pick at payment time

Store many methods; every payout/invoice UI requires choosing one. Rejected: worse UX for recurring payroll; easy to pay the wrong account.
