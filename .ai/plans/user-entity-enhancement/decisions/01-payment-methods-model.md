# Decision 1: Payment methods model

## Status: **DECIDED — 1A**

**Also locked for this enhancement:** early-dev **clean-slate migrations** (OK to drop local DB and regenerate migration history) — see implications under Migration below and Decision 8.

---

## Locked product rules

1. **No payment credentials** — never store card PAN/CVV, PSP tokens, OAuth secrets, bank passwords, wallet PINs.
2. **Routing details only** — enough to complete payment **externally** (PayPal email, IBAN, wallet phone, Wise handle, cash note).
3. **Multiple methods per user** — not a single enum on the profile row.

---

## Decision: **1A** — Unified `user_payment_methods` table (type + JSONB details)

Bank transfer is a **type** in this table (not a separate product table). Teacher banking history is replaced/superseded by this model (clean-slate allowed).

### Schema (conceptual)

```ts
import { jsonb, pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import type { PaymentMethodDetails } from "@/backend/types/payment-method.types";

export const userPaymentMethods = pgTable("user_payment_methods", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, …),
  type: paymentMethodTypeEnum("type").notNull(), // MOBILE_WALLET | PAYMENT_LINK | BANK_TRANSFER | PAYPAL | CASH | …
  label: varchar("label", { length: 100 }),
  direction: paymentDirectionEnum("direction").notNull(), // PAYIN | PAYOUT | BOTH
  isDefault: boolean("is_default").notNull().default(false),
  // Typesafe JSONB — same pattern as permissions.description
  details: jsonb("details").$type<PaymentMethodDetails>().notNull(),
  createdAt: timestamp(…).notNull(),
  updatedAt: timestamp(…).notNull(),
});
```

### Typesafety (Drizzle + app layer)

**Repo precedent:** [`permissions.ts`](../../../backend/db/schema/permissions.ts) uses:

```ts
jsonb("description").$type<LocalizedString>().notNull()
```

**For payment methods:**

| Layer | Approach |
|-------|----------|
| **Drizzle column** | `jsonb("details").$type<PaymentMethodDetails>()` — compile-time typing on select/insert |
| **Discriminated union** | `PaymentMethodDetails` keyed by `type` (Zod + TS) so PayPal ≠ Bank shapes |
| **Write validation** | Zod (or equivalent) at service boundary before insert/update — JSONB is not self-validating in PG |
| **GraphQL** | Pothos union / typed inputs mirroring the TS union |
| **Secrets** | None in `details` — routing fields only; encrypt sensitive routing (IBAN) at app layer if required (same spirit as today’s `encryptedText`) |

Example union (illustrative) — full type set in [02](./02-payment-methods-v1-set.md):

```ts
type MobileWalletDetails = { walletId: string; phone: string }; // E.164 + catalog FK
type PaymentLinkDetails = { paymentLinkId: string; url: string }; // catalog FK + allowlisted URL
type PaypalDetails = { email: string };
type BankTransferDetails = {
  iban?: string;
  bankName?: string;
  beneficiaryName?: string;
  swiftBic?: string;
  accountNumber?: string;
  routingNumber?: string;
};
type WiseDetails = { email?: string; handle?: string };
type CashDetails = { note?: string };

type PaymentMethodDetails =
  | MobileWalletDetails
  | PaymentLinkDetails
  | PaypalDetails
  | BankTransferDetails
  | WiseDetails
  | CashDetails;
```

Prefer validating **`type` + `details` together** (discriminated Zod). Wallet/link rows must reference **active** catalog entries; phone/URL rules come from the catalog (country, currency, allowlist).

### Example rows

| User | type | direction | details (routing only) |
|------|------|-----------|------------------------|
| Teacher Omar | BANK_TRANSFER | PAYOUT | `{ iban, bankName, beneficiaryName, swiftBic }` |
| Teacher Omar | PAYPAL | PAYOUT | `{ email: "omar@paypal.com" }` |
| Parent Sara | PAYPAL | PAYIN | `{ email: "sara@mail.com" }` |

### Why 1A (not B/C)

- One list in GraphQL/UI for “payment options”
- Brand variety (Vodafone, STC, InstaPay, …) lives in **catalog tables**, not new enum values
- Early-dev: fold teacher banking into `BANK_TRANSFER` rows; clean-slate OK
- JSONB + `.$type<T>()` matches existing Siraj Drizzle practice

### Rejected

- **1B** — separate banking table + methods (extra join/UI merge; unnecessary if we can clean-slate)
- **1C** — wide nullable columns (schema churn per provider)

---

## Drizzle tooling notes (checked)

- Skills revision **12** matches installed `drizzle-kit` — no refresh needed
- Prefer MCP `project-0-siraj-drizzle` (`generate` / `push` / …) when applying schema; for this enhancement **clean regenerate** of migrations is acceptable
- JSONB typing: use `jsonb(…).$type<T>()` (see permissions); do **not** invent a parallel untyped `jsonb` column

---

## Migration implication (early-dev)

Because local/prod-like data can be dropped:

1. Design final `user_payment_methods` (+ drop role `payment_method` columns and `teacher_banking_details_history` as part of the new schema story)
2. Regenerate / clean-create Drizzle migrations rather than long expand–contract dual-write for banking
3. Re-seed demo users with payment method rows as needed

**Types + catalogs:** [02](./02-payment-methods-v1-set.md) (**DECIDED** — `MOBILE_WALLET` / `PAYMENT_LINK` catalogs + standard globals).  
**Defaults:** still [01b](./01b-payment-defaults.md).
