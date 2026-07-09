# Decision 3: Currency model — locked money vs UI display

## Status: **DECIDED — 3A**

---

## Locked product rules

Siraj separates **three** currency concepts. Mixing them causes wrong payroll/billing when FX moves.

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LOCKED DEFINITION CURRENCY                                   │
│    Teacher hourly rate / parent fee units are DEFINED in a      │
│    currency and stay in that currency forever.                  │
│    FX up/down must NOT rewrite the agreed amount.               │
├─────────────────────────────────────────────────────────────────┤
│ 2. USER DISPLAY PREFERENCE (`users.displayCurrency`)            │
│    “Show me money in SAR/EGP/USD on the UI.”                    │
│    Mini use: convert locked amounts for viewing only.           │
├─────────────────────────────────────────────────────────────────┤
│ 3. LIVE FX (API / currency_exchange_rates)                      │
│    Used only to TRANSLATE locked → display for rendering.       │
│    Never mutates the locked definition or settled payment.      │
└─────────────────────────────────────────────────────────────────┘
```

### Concrete example — teacher

| Step | What happens |
|------|----------------|
| Admin sets Omar’s rate | `50` + locked currency **EGP** → store `hourlyRate=50`, `rateCurrency=EGP` |
| EGP weakens vs USD | Stored rate stays **50 EGP**. We do **not** rewrite to “new USD equivalent.” |
| Admin UI preference = USD | Screen shows ≈ `50 EGP → X USD` using **current** FX from API |
| Payroll / class payment unit | Always computed/settled from **50 EGP** (locked), not from the USD display |

### Concrete example — parent

| Step | What happens |
|------|----------------|
| Fee defined | `200` + locked **SAR** on the fee/contract definition |
| Invoice created | Invoice line/total stores amount + **SAR** (and may snapshot FX for reporting) |
| Parent UI preference = USD | Portal shows ≈ converted SAR→USD for display |
| What they owe | Still **200 SAR** (locked), not the fluctuating USD number |

### What already exists that supports this

- Invoices/payments already have `currency` + `exchangeRateSnapshot` / `exchangeRateSource` ([`billing.ts`](../../../backend/db/schema/billing.ts))
- `currency_exchange_rates` table + `getLatestExchangeRate` for up-to-date conversion
- Teacher `hourlyRate` + `rateCurrency` and parent `feeAmount` + `currency` are the natural **locked definition** homes today

---

## Decision: **3A** — Locked currencies on money entities; `users.displayCurrency` = display only

```
users.displayCurrency       → UI preference only (CurrencyCode enum)
teachers.hourlyRate
teachers.rateCurrency       → LOCKED with the rate
parents.feeAmount
parents.currency            → LOCKED with the fee definition
  (or move fee lock onto contract/invoice templates later)
invoices.currency           → LOCKED settlement snapshot
teacher_payments.currency   → LOCKED payout snapshot
```

**`users.displayCurrency` must never be the source of truth for “what we pay the teacher” or “what the parent owes.”**

### Why 3A (not 3B)

- No second “default definition currency” on users — avoids confusing display vs contract currency in UI/API
- Onboarding continues to require explicit locked currency when setting rates/fees
- Matches current money entities; only adds a clear display preference on `users`

### Rejected: 3C

Single `users.currency` as both display and definition — would break FX stability rules.

---

## UI / API rules (to implement)

1. **Write path (define rate/fee):** require amount + locked `CurrencyCode`; persist both; never silent-convert on save.
2. **Read path (UI):** `display = convert(lockedAmount, lockedCurrency → users.displayCurrency, rate=latestFx)`.
3. **Payment / payroll path:** always use locked amount + locked currency; FX snapshot optional for reporting only.
4. **Labeling:** show both when useful — e.g. `50 EGP (≈ 1.62 USD)` so users see lock + translation.
5. **Stale FX:** if exchange rate missing/stale, show locked currency only (don’t invent a conversion).

---

## Naming

| Concept | Name |
|---------|------|
| UI preference | `users.displayCurrency` |
| Teacher rate lock | `teachers.rateCurrency` (keep) |
| Parent fee lock | keep on fee/parent / invoice entities |
| Live FX | existing exchange-rate services |
| Enum + config | `CurrencyCode` + `CURRENCY_CONFIG` (symbol, decimals, i18n) |
