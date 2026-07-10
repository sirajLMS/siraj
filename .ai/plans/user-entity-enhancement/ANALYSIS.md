# User Entity Enhancement — Analysis & Design Discussion

**Status:** Draft for discussion (not implementation-ready)  
**Date:** 2026-07-09  
**Related prior work:** `.ai/plans/done/profile-pages/`, Skype drop migration `20260708133349_ancient_microchip`

---

## 1. Problem statement

Today person-level data is split across role tables (`teachers`, `parents`, `staff_profiles`) while identity (`name`, `email`, `avatar`) already lives on `users`. Admin/staff profiles feel empty because `staff_profiles` only has `phone` + `status`. Meeting config is Zoom-coupled. Banking is teacher-only and temporal. Payment methods are a 2-value enum. Currency and timezone lack first-class typed config enums aligned with country.

**Goal:** Centralize person fields on `users`, extract meeting configs and banking into dedicated tables, expand payment-method modeling, and make currency/timezone/phone typesafe with proper validation.

---

## 2. Current state (facts)

### 2.1 Field ownership today

| Field | users | staff | teachers | parents | Notes |
|-------|-------|-------|----------|---------|-------|
| name, email, avatar | ✓ | join | join | join | Already centralized |
| phone | — | ✓ | ✓ | ✓ | 3-way duplicate |
| status | `isActive` bool | `AccountStatus` | `AccountStatus` | `ParentStatus` (richer) | Split semantics |
| address | — | — | ✓ | ✓ | |
| nationality | — | — | ✓ | ✓ | `country_code` enum |
| country / countryCode | — | — | ✓ | — | Teachers only |
| timezone | — | — | varchar + `timezoneId` FK | varchar only | Hybrid model |
| dateOfBirth, gender | — | — | ✓ | — | Teacher-only |
| facebook, whatsapp, twitter | — | — | — | ✓ | Parent-only |
| currency | — | — | `rateCurrency` varchar | `currency` varchar | No enum |
| paymentMethod | — | — | ✓ enum | ✓ enum | `PAYPAL` \| `BANK_ACCOUNT` |
| zoom* | — | — | link/user/pass | `defaultZoomLink` | Zoom-coupled |
| banking | — | — | `teacher_banking_details_history` | — | Encrypted, temporal |

Students do **not** link to `users` (child of parent).

### 2.2 Country

- TS + PG enum `CountryCode` (~246 ISO 3166-1 alpha-2) in `backend/enum/country.enum.ts`
- Teachers: both `nationality` and `countryCode`
- Parents: `nationality` only
- GraphQL often exposes nationality as `string` instead of enum (inconsistency)

### 2.3 Currency

- Free `varchar(10)` on teachers, parents, invoices, payments, teacher_payments
- Exchange-rate tables exist (`currency_exchange_rates`, hedges, audit) but **no supported-currencies enum/config**
- UI hardcodes different lists (parent: USD/SAR/AED/EUR; teacher: +EGP)

**Status: ENUM + TYPING + DISPLAY-CURRENCY + FX-READ-PATH LANDED** in [`.ai/plans/done/currency/`](../done/currency/). FX *ingestion* (fetch source, cron cadence) landed in [`.ai/plans/fx-ingestion/`](../fx-ingestion/); everything else in Decision 3A is landed except reports currency-pair columns (see currency plan T21.11 cross-file dependency).

### 2.4 Timezone

- Lookup table `timezones` (`iana_id`, offset, DST flag)
- Teachers: `timezone` varchar + `timezoneId` FK + DB trigger sync
- Parents: `timezone` varchar only (default UTC) + CHECK via `is_valid_timezone()`
- No TS/PG enum of IANA zones; validation is CHECK + `Intl`
- Teacher onboarding UI sometimes uses display labels (`(GMT+02:00) Cairo`) vs IANA (`Africa/Cairo`) — risk of CHECK failures

### 2.5 Phone

- Already have `backend/lib/phoneNumber.ts` wrapping **google-libphonenumber** (E.164)
- Also depend on `libphonenumber-js` in package.json (unused for this wrapper?)
- Schema still stores plain `varchar(50)` with no DB-level E.164 constraint or custom Drizzle type

### 2.6 Payment & banking

- Enum: `PAYPAL`, `BANK_ACCOUNT` only
- Teacher banking: temporal encrypted history table keyed by `teacherId`
- Parents: preference enum only — no PayPal email / bank details stored
- Invoice `payments.payment_method` uses same 2-value enum

### 2.7 Multi-role

- DB allows same `userId` on multiple role tables; profile UI picks teacher → parent → staff
- Moving person fields to `users` is **safer** under multi-role (one phone, one address)

### 2.8 Drizzle tooling

- Skills revision **12** matches installed `drizzle-kit` (no refresh needed)
- Prefer MCP `project-0-siraj-drizzle` (`generate` / `push` / `check` / …) over CLI when generating migrations
- Production path: **generate** migration SQL (not push) for reviewable DDL

---

## 3. Target architecture (proposed)

```
users (person + account)
  ├── phone (E.164 custom type)
  ├── status (TBD — see open questions)
  ├── address, nationality, countryCode
  ├── timezone (IANA varchar; GraphQL IanaTimezone enum — **DECIDED 4A**)
  ├── dateOfBirth, gender
  ├── facebook, whatsapp, twitter
  ├── currency (enum)
  ├── user_meeting_configs (1:N)     ← new
  ├── user_banking_details_* (1:N)   ← generalize from teacher banking
  └── role rows stay thin:
        teachers → qualifications, rates, nationalId, role status?, …
        parents  → invoiceType, feeAmount, role status?, …
        staff_profiles → maybe only role linkage / thin or absorb into permissions
```

### 3.1 Fields to move onto `users`

Per product request:

| Column | Proposed type | Source of truth after move |
|--------|---------------|----------------------------|
| `phone` | custom E.164 / validated varchar | users |
| `status` | **OPEN** — see §6 | users vs keep role statuses |
| `address` | text | users |
| `nationality` | `country_code` enum | users |
| `countryCode` (country of residence) | `country_code` enum | users |
| `timezone` | IANA `varchar` + CHECK; GraphQL `IanaTimezone` enum (auto-generated) | users — **DECIDED 4A** |
| `dateOfBirth` | date | users |
| `gender` | `gender` enum | users |
| `facebook`, `whatsapp`, `twitter` | varchar/text | users |
| `currency` / `displayCurrency` | **new** `currency_code` enum | users (**UI display preference only** — not settlement) |

Drop duplicated **person** columns from `teachers` / `parents` / `staff_profiles` after backfill.

**Keep on role / money entities (locked definition currencies):**

- Teacher: `nationalId`, `qualifications`, `hourlyRate`, **`rateCurrency` (LOCKED with rate)**, Zoom → meeting configs
- Parent: `invoiceType`, `feeAmount`, **fee/invoice currency LOCKED on money entities**, billing-specific overrides
- Role-specific **lifecycle status** if we do not flatten ParentStatus onto users

See [decisions/03-currency-vs-rate-currency.md](./decisions/03-currency-vs-rate-currency.md) for locked-vs-display FX rules. FX rate *ingestion* (provider adapters, cron scheduling, the `fx_sync_runs` observability table) has landed in [`.ai/plans/fx-ingestion/`](../fx-ingestion/spec.md); the `currency_exchange_rates` rows it produces are consumed by this plan's display FX read-path.

---

## 4. Meeting configs table (new)

### 4.1 Intent

Replace Zoom-coupled columns with a provider-agnostic table so Zoom / Google Meet / Microsoft Teams each have their own shape, without N joins per provider.

### 4.2 Recommended shape: single table + typed JSONB + discriminator

```ts
// Conceptual — not final schema
userMeetingConfigs = pgTable("user_meeting_configs", {
  id: uuid PK,
  userId: uuid FK → users,
  provider: meeting_provider enum, // ZOOM | GOOGLE_MEET | MICROSOFT_TEAMS | …
  label: varchar,                  // optional "Personal", "Work"
  isDefault: boolean,
  // Provider-specific payload — validated in app layer / Zod / branded types
  config: jsonb,                   // shape depends on provider
  createdAt, updatedAt,
});
// Unique: (userId, provider, label?) or one default per provider
```

**Provider config shapes (TypeScript discriminated union):**

```ts
type ZoomConfig = {
  meetingUrl: string;
  username?: string;
  password?: string; // encrypted at rest if stored
};
type GoogleMeetConfig = {
  meetingUrl: string; // meet.google.com/...
};
type TeamsConfig = {
  meetingUrl: string; // teams.microsoft.com/...
  tenantId?: string;
};
type MeetingConfigPayload =
  | { provider: "ZOOM"; config: ZoomConfig }
  | { provider: "GOOGLE_MEET"; config: GoogleMeetConfig }
  | { provider: "MICROSOFT_TEAMS"; config: TeamsConfig };
```

### 4.3 Why JSONB over separate tables / wide columns

| Approach | Joins | Typesafety | Schema churn |
|----------|-------|------------|--------------|
| **A. One table + JSONB + discriminator** | 1 join (or embed in user select) | App-level Zod/Pothos unions | Low — new provider = enum + TS type |
| B. Separate tables per provider | 3+ left joins or UNION | Strongest SQL types | High |
| C. Wide nullable columns on users | 0 joins | Weak; Zoom-coupled forever | Bad |

**Recommendation: A** — matches “minimize joins, typesafe, good performance.”

**Fetch pattern (minimize joins):**

1. Profile load: one query `user_meeting_configs WHERE user_id = ?` → map in TS to discriminated union (no per-provider join).
2. Optional: Drizzle relational query `users` with `with: { meetingConfigs: true }` — still one SQL with a single join/lateral, not three.
3. Class instance `zoom_meeting_url` can later become `meeting_url` + `meeting_provider` snapshot, or stay as opaque URL for overlap detection.

**Encryption:** Zoom passwords today use `encryptedText`. Keep secrets in encrypted columns **or** encrypt specific JSON keys at write time — prefer a dedicated `encrypted_secret` column for passwords rather than putting secrets in plain JSONB.

---

## 5. Banking refactor (separate table, user-scoped)

### 5.1 Today

`teacher_banking_details_history` is teacher-scoped, temporal (`valid_from` / `valid_until`), encrypted fields, verification workflow.

### 5.2 Proposed

Generalize to **user-scoped** banking (any role that receives/pays money):

```
user_banking_details_history
  userId → users
  (same encrypted fields + temporal + verification)
```

- Migrate `teacherId` → resolve `teachers.userId` → `userId`
- `teacher_payments.bankingDetailsHistoryId` keeps pointing at history rows (or rename table)
- Parents can later store bank details if needed for refunds/payouts

**Alternative:** keep teacher banking as-is and add a parallel parent table — worse duplication. Prefer user-scoped.

---

## 6. Payment methods — locked rules + open model choices

### 6.1 Locked product rules

1. **No payment credentials** — never store card PAN/CVV, PSP tokens, OAuth secrets, bank passwords, wallet PINs.
2. **Routing details only** — store enough to complete payment **externally** (PayPal email, IBAN, wallet phone, Wise handle, cash note).
3. **Multiple methods per user** — not a single enum on the profile row.

Card/Mada/Apple Pay style methods that only work via PSP tokens are **out of scope** as saved user methods. Invoice rows may still snapshot “paid via Mada at checkout” without a reusable user method.

### 6.2 Landscape that fits routing-details-only

| Type | Store (routing) | Do not store |
|------|-----------------|--------------|
| PayPal | email | password, OAuth tokens |
| Bank transfer | IBAN, bank name, beneficiary, SWIFT | online banking password |
| Wise | email / handle | API keys |
| STC Pay / Vodafone Cash / InstaPay | phone / account id | OTP, PIN |
| Fawry | mobile / account if used as destination | integration secrets |
| Cash | optional note | — |

### 6.3 Decided + still open

- **DECIDED 1A:** unified `user_payment_methods` with `jsonb("details").$type<PaymentMethodDetails>()` + Zod discriminated validation; bank is a type in this table — [decisions/01-payment-methods-model.md](./decisions/01-payment-methods-model.md)
- **DECIDED 8C:** early-dev clean-slate migrations (drop DB / regenerate) — [decisions/08-migration-strategy.md](./decisions/08-migration-strategy.md)
- **DECIDED 2:** types = `MOBILE_WALLET` + `PAYMENT_LINK` + `ONLINE_ACCOUNT` (country/global catalogs) + `BANK_TRANSFER` / `CASH` — [02](./decisions/02-payment-methods-v1-set.md)
- **Still open:** defaults — [01b](./decisions/01b-payment-defaults.md); confirm Wise in v1

Today’s `PAYPAL | BANK_ACCOUNT` on role rows + `teacher_banking_details_history` are replaced under clean-slate (no dual-write required). New catalogs: `supported_mobile_wallets`, `supported_payment_links`, `supported_online_accounts`.

---

## 7. Currency & timezone as enums with config

### 7.1 Currency (three-layer model — locked) — ✅ Landed

See [`.ai/plans/done/currency/spec.md`](../done/currency/spec.md) for the full landed slice (typing, `users.displayCurrency`, FX-convert-on-render read path with stale-FX fallback).

| Layer | What | Mutated by FX? |
|-------|------|----------------|
| **Locked definition** | Teacher rate / parent fee / invoice / payout amount + currency at define/settle time | **No** |
| **Display preference** | `users.displayCurrency` (enum) — UI viewing choice | N/A (preference only) |
| **Live FX** | `currency_exchange_rates` / API — translate locked → display for rendering | Rates change; definitions don’t |

**Rules:**

1. Defining teacher payment units or parent fees **locks** amount + currency.
2. UI may convert locked → `users.displayCurrency` with **current** FX for display only.
3. Payroll and parent settlement always use the **locked** currency/amount (stable, expected results under FX volatility).
4. Invoices/payments already snapshot `currency` + optional `exchangeRateSnapshot` — keep that pattern.

**Proposal:** Add `CurrencyCode` TS enum + PG enum (ISO 4217 subset) + `CURRENCY_CONFIG` map (symbol, decimals, i18n).

- `users.displayCurrency` → display preference enum (name TBD; not settlement)
- `teachers.rateCurrency` / fee & invoice currencies → remain **locked** on money entities (migrate varchar → enum)
- **DECIDED 3A:** locked currencies stay on rate/fee/invoice entities; `users.displayCurrency` is display-only — [decisions/03-currency-vs-rate-currency.md](./decisions/03-currency-vs-rate-currency.md)

### 7.2 Timezone — **DECIDED 4A**

See [decisions/04-timezone-model.md](./decisions/04-timezone-model.md).

| Layer | Approach |
|-------|----------|
| Storage | `users.timezone` = IANA `varchar` + Postgres `is_valid_timezone()` CHECK (optional hardening) |
| Typesafety | Auto-generated **full** `IanaTimezone` GraphQL/TS enum from `Intl.supportedValuesOf("timeZone")` |
| DB column | `varchar` only — **no** native PG/MySQL ENUM (portable) |
| `timezones` table | Optional catalog / FK helper for schedules — **not** source of truth for users |
| Role tables | Remove `teachers.timezone` / `parents.timezone`; keep `students.timezone_override` |

**Student effective TZ:**

`COALESCE(student.timezone_override, parent_user.timezone, academy_default)`

**DST:** unchanged model (IANA string + offset snapshots); retarget triggers to read `users.timezone` instead of `teachers.timezone`.

**Clean-slate (8C):** regenerate migrations; no incremental backfill design for timezone move.

### 7.3 Country alignment

- Keep existing `CountryCode` enum  
- On users: both `nationality` and `countryCode` (residence)  
- Fix GraphQL to use enum everywhere (stop `t.string` for nationality)

---

## 8. Phone — typesafe validated column

### 8.1 Existing asset

`backend/lib/phoneNumber.ts` already parses/formats **E.164** via google-libphonenumber.

### 8.2 Proposed storage

1. Store **E.164** string only (`+9665…`) in `users.phone`
2. Drizzle **custom column type** that:
   - accepts `string | PhoneNumber` on write
   - validates with `PhoneNumberUtil.isValidNumber`
   - persists E.164
3. Optional: generated/stored `phone_country_code` smallint for indexing — usually unnecessary if E.164 is enough
4. Zod / service validation at API boundary (don’t rely on DB alone)
5. Frontend: use `libphonenumber-js` (already in deps) for input UX; backend remains google-libphonenumber source of truth **or** consolidate on one lib (discuss — having both is redundant)

### 8.3 Migration

Backfill: parse existing phones; invalid → null + log / admin fix queue.

---

## 9. Status on users — careful design

Requested: `status` on users. Today:

- `users.isActive` → session AccountStatus  
- Role tables have their own status enums  
- `ParentStatus` is richer than `AccountStatus`

**Options:**

| S1 | `users.status` = AccountStatus; drop `isActive`; role tables keep lifecycle status |
| S2 | Single `users.status` only — loses parent ON_TRIAL / ON_LEAVE unless enum merges |
| S3 | `users.status` = AccountStatus (login gate); `parents.status` stays ParentStatus; teachers/staff keep AccountStatus on role **or** only on users |

**Recommendation:** S3 / S1 hybrid — login activation on `users`; parent business lifecycle stays on `parents`. Do **not** collapse ParentStatus into a 2-value user status.

---

## 10. Open questions for discussion

Each question has a dedicated decision brief (options, examples, pros/cons):

**Folder:** [`.ai/plans/user-entity-enhancement/decisions/`](./decisions/README.md)

| # | Topic | File |
|---|--------|------|
| 1 | Payment methods table model | [01](./decisions/01-payment-methods-model.md) — **DECIDED 1A** |
| 1b | Defaults for multiple methods | [01b](./decisions/01b-payment-defaults.md) |
| 2 | Method types + catalogs | [02](./decisions/02-payment-methods-v1-set.md) — **DECIDED** |
| 3 | Currency locked vs display | [03](./decisions/03-currency-vs-rate-currency.md) — **DECIDED 3A** |
| 4 | Timezone modeling | [04](./decisions/04-timezone-model.md) — **DECIDED 4A** |
| 5 | Meeting configs cardinality | [05](./decisions/05-meeting-configs-cardinality.md) |
| 6 | Fate of staff_profiles | [06](./decisions/06-staff-profiles-fate.md) |
| 7 | Status on users | [07](./decisions/07-status-on-users.md) |
| 8 | Migration strategy | [08](./decisions/08-migration-strategy.md) — **DECIDED 8C clean-slate** |

**Payment locked:** no credentials; routing details only; multiple methods per user; JSONB + `.$type<T>()`.

Still deferred until after the above (smaller follow-ups):

- Zoom password: encrypted column beside JSONB vs encrypted JSON field?
- Phone lib: keep `google-libphonenumber` as source of truth vs consolidate on `libphonenumber-js`?
- Class instance `zoomMeetingUrl`: rename to provider-agnostic now or later?

---

## 11. Migration strategy (high level)

**DECIDED 8C:** early-dev clean-slate — drop DB / regenerate migrations rather than expand–contract dual-write.

Use Drizzle MCP `generate` (skills rev 12; prefer MCP over CLI) for reviewable SQL from the **final** schema.

1. Land target schema in Drizzle files (users person fields, `user_payment_methods`, meeting configs, drop old role payment/banking columns, etc.)
2. Generate fresh migrations; reset local DB; re-seed
3. Update GraphQL, services, frontend, seeds, tests in the same delivery wave

No prolonged dual-read of old role columns in app code.

---

## 12. Suggested implementation phases (after decisions)

| Phase | Scope |
|-------|--------|
| **0** | Lock open questions; write ADR-style decisions in this folder |
| **1** | Schema: users person fields + ~~CurrencyCode enum~~ **✅ landed** + `users.displayCurrency` **✅ landed** + phone custom type |
| **2** | Data migration + drop role duplicates |
| **3** | `user_meeting_configs` + remove zoom columns |
| **4** | User-scoped banking migration |
| **5** | Payment method model (per decision) |
| **6** | GraphQL + profile UI (staff finally shows full person form) |
| **7** | Quality gate, tests, i18n |

### 12.1 Landed slices (do not re-implement)

| Slice | Plan folder | What shipped |
|-------|-------------|--------------|
| Currency typing + display preference + FX read path | [`.ai/plans/done/currency/`](../done/currency/) | `currency_code` PG enum on locked money columns; `users.displayCurrency`; `FxDisplayService` + `DisplayAmount` GraphQL field; frontend `formatCurrencyForDisplay`; profile/billing UI wiring |
| FX rate ingestion | [`.ai/plans/fx-ingestion/`](../fx-ingestion/) | Provider adapters, cron, `currency_exchange_rates` writes, admin exchange-rates UI, permissions |

Future waves should **consume** these slices (e.g. reports `paidEgp`/`paidUsd` → `{ amount, currency }` + `displayAmount`) rather than re-adding enum registration, ingestion, or display-currency plumbing.

---

## 13. Out of scope (unless requested)

- Student → user accounts  
- Live PSP integration (Stripe/Paymob)  
- Changing permission / role resolution  
- Reworking invoice payment recording beyond enum expansion  

---

## 14. References

- `backend/db/schema/users.ts`, `teachers.ts`, `parents.ts`, `staff.ts`, `teacher-banking.ts`, `timezones.ts`, `billing.ts`
- `backend/lib/phoneNumber.ts`
- `backend/enum/country.enum.ts`, `billing.enum.ts`, `auth.enum.ts`, `parent.enum.ts`
- Drizzle skills: `.agents/skills/drizzle*.md`; MCP: `project-0-siraj-drizzle`
- Prior: `.ai/plans/done/profile-pages/`
