# Decision 1b: Default + direction rules for multiple payment methods

**Question:** When a user has multiple payment options, how do defaults and pay-in vs pay-out work?

Only relevant because we locked **multiple methods per user** (see Decision 1).

---

## Option A — One default per direction

**Idea:** At most one `isDefault` among methods with `direction` including PAYOUT; at most one for PAYIN.

### Example

| Method | direction | isDefault |
|--------|-----------|-----------|
| Bank IBAN | PAYOUT | ✓ |
| PayPal | PAYOUT | |
| PayPal | PAYIN | ✓ |
| STC Pay phone | PAYIN | |

### Pros

- Parents and teachers can have different defaults for paying vs getting paid  
- Clear for payroll vs invoicing  

### Cons

- Two default flags to manage in UI  
- `BOTH` direction rows need a rule (count for both sides vs forbidden)  

---

## Option B — Single global default method

**Idea:** Exactly one `isDefault=true` per user across all methods.

### Example

Omar’s default is Bank; PayPal exists but isn’t default. Parent invoicing and teacher payroll both use “the” default unless overridden.

### Pros

- Simplest UX  
- One partial unique index  

### Cons

- Awkward if pay-in and pay-out should differ  
- Staff/teachers who only care about PAYOUT still fine; parents who only PAYIN also fine — mixed roles suffer  

---

## Option C — No default in DB; pick at payment time

**Idea:** Store many methods; every payout/invoice UI requires choosing one. Optional `lastUsedMethodId` later.

### Pros

- No default-constraint complexity  
- Explicit ops choice  

### Cons

- Worse UX for recurring payroll  
- Easy to pay the wrong account  

---

## How to choose

| Product | Pick |
|---------|------|
| Parents pay in AND teachers get paid out (possibly same user later) | **A** |
| Simple academy, one “primary” account vibe | **B** |
| Always manual selection | **C** |

**Reply with:** `1bA`, `1bB`, or `1bC`
