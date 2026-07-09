# Payment Methods Enhancement — Specification

**Status:** Planning  
**Decisions:** [01](../user-entity-enhancement/decisions/01-payment-methods-model.md) **1A**, [01b](../user-entity-enhancement/decisions/01b-payment-defaults.md) **1bA**, [02](../user-entity-enhancement/decisions/02-payment-methods-v1-set.md) **catalog-driven**, [08](../user-entity-enhancement/decisions/08-migration-strategy.md) **8C clean-slate**

---

## Problem

Payment preferences are fragmented across the codebase:

- `teachers.payment_method` and `parents.payment_method` — single nullable enum (`PAYPAL` | `BANK_ACCOUNT`) per role row
- `teacher_banking_details_history` — separate temporal table for encrypted bank routing with admin verification
- Parent billing uses a free-text `paymentMethod` string in some UI paths (not even enum-constrained)
- No support for multiple methods, direction-specific defaults, or country-specific wallets/links/platforms
- ~15 views each roll their own 2-option `Select` — no shared component

Invoice `payments` records how a parent paid an invoice but is disconnected from saved user methods.

## Locked decisions

| Topic | Choice |
|-------|--------|
| User methods storage | `user_payment_methods` table — `type` + JSONB `details` (Decision **1A**) |
| Method types (enum) | `MOBILE_WALLET`, `PAYMENT_LINK`, `ONLINE_ACCOUNT`, `BANK_TRANSFER`, `CASH` |
| Provider variety | Catalog tables — not per-brand enum values (Decision **2**) |
| Online platforms | PayPal, Wise, Skrill, etc. are `ONLINE_ACCOUNT` catalog rows |
| Defaults | One default per direction — PAYIN slot + PAYOUT slot (Decision **1bA**) |
| Migration | **8C clean-slate** — delete legacy tables/columns/enums; `drizzle-kit generate` fresh migration set (no backfill, no deprecations) |
| Invoice payments | `payments.user_payment_method_id` FK + **frozen `payment_method_snapshot` JSONB** |
| Payout transactions | `teacher_payments.user_payment_method_id` FK + **frozen `payment_method_snapshot` JSONB** |
| Transaction audit | **Option C — snapshots** on every pay-in/pay-out; live `user_payment_methods` rows remain mutable |
| Catalog admin | Admin CRUD for all three catalog tables in v1 |
| Credentials | **Never** store card PAN/CVV, PSP tokens, OAuth secrets, bank passwords |
| Imports | `@/` alias only — no relative `../` or `./` |
| Legacy code | **Delete/remove only** — no `@deprecated`, no GraphQL deprecation directives, no compatibility shims |

## Resolved design choices

| Question | Decision |
|----------|----------|
| Transaction audit (pay-in + pay-out) | **Option C — snapshots:** every money-movement row stores immutable `payment_method_snapshot` JSONB at creation time; optional `user_payment_method_id` FK for traceability only |
| Bank detail change history | **No** temporal `valid_from`/`valid_until` table on `user_payment_methods`; audit comes from transaction snapshots, not method version history |
| Bank verification | Port admin verify workflow to `user_payment_methods.verified_at` / `verified_by_user_id` — **BANK_TRANSFER only** in v1 |
| Catalog admin permissions | New `AppPermission` keys: `payment_methods.manage_catalogs`, `payment_methods.verify_bank_transfer` |
| Teacher disbursements | `teacher_payments.banking_details_history_id` → `user_payment_method_id` + `payment_method_snapshot` |

## Data model

```
users
  └── user_payment_methods (many) — live/mutable saved methods
        type, direction, isDefault, label, details (JSONB), verifiedAt?

supported_mobile_wallets     ─┐
supported_payment_links       ├── catalog FK in details JSONB
supported_online_accounts    ─┘

payments (PAYIN)
  user_payment_method_id       → user_payment_methods (nullable FK — traceability)
  payment_method_type          → PaymentMethodType (denormalized for SQL filters)
  payment_method_snapshot      → frozen JSONB at record time (audit source of truth)

teacher_payments (PAYOUT)
  user_payment_method_id       → user_payment_methods (nullable FK — traceability)
  payment_method_type          → PaymentMethodType (denormalized for SQL filters)
  payment_method_snapshot      → frozen JSONB at record time (audit source of truth)
```

**Snapshot rule:** On any pay-in or pay-out transaction, the service **must** copy the resolved method (type, details, catalog display metadata, label) into `payment_method_snapshot` before insert. Later edits/deletes on `user_payment_methods` must not change historical transaction rows.

### `user_payment_methods`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `type` | `payment_method_type` enum | |
| `direction` | `payment_direction` enum | `PAYIN` (in) \| `PAYOUT` (out) \| `BOTH` |
| `is_default` | boolean | At most one per direction slot (1bA) |
| `label` | varchar(100) nullable | User nickname |
| `details` | jsonb `$type<PaymentMethodDetails>` | Discriminated by `type` |
| `verified_at` | timestamptz nullable | BANK_TRANSFER admin verification |
| `verified_by_user_id` | uuid nullable FK → users | |
| `created_at` / `updated_at` | timestamptz | |

**Partial unique indexes (defaults):**

- At most one `is_default=true` where `direction IN ('PAYIN', 'BOTH')` per `user_id`
- At most one `is_default=true` where `direction IN ('PAYOUT', 'BOTH')` per `user_id`
- Service rule: `BOTH` + `isDefault` occupies both slots; no other default on that user

### Catalog tables

See [02-payment-methods-v1-set.md](../user-entity-enhancement/decisions/02-payment-methods-v1-set.md) for full column contracts:

- `supported_mobile_wallets` — slug, name (LocalizedString), countryCode, currencyCode, phoneRegion, supportedDirections, …
- `supported_payment_links` — slug, urlAllowlist, urlExample, …
- `supported_online_accounts` — slug, identifierKind (`EMAIL` \| `HANDLE` \| `EMAIL_OR_HANDLE`), identifierLabel, …

### Details discriminated union

```ts
type MobileWalletDetails = { walletId: string; phone: string };
type PaymentLinkDetails = { paymentLinkId: string; url: string };
type OnlineAccountDetails = { onlineAccountId: string; identifier: string };
type BankTransferDetails = {
  iban?: string;
  bankName?: string;
  beneficiaryName?: string;
  swiftBic?: string;
  accountNumber?: string;
  routingNumber?: string;
};
type CashDetails = { note?: string };

type PaymentMethodDetails =
  | MobileWalletDetails
  | PaymentLinkDetails
  | OnlineAccountDetails
  | BankTransferDetails
  | CashDetails;
```

Validate `type` + `details` together via discriminated Zod at service boundary. Encrypt sensitive bank fields in `details` at app layer (same spirit as current `encryptedText`).

### `PaymentMethodTransactionSnapshot` (frozen on every transaction)

Written once at pay-in/pay-out creation. **Not** updated if the live method changes later.

```ts
type PaymentMethodCatalogSnapshot = {
  catalogId: string;           // walletId | paymentLinkId | onlineAccountId when applicable
  catalogSlug: string;         // e.g. vodafone_cash_eg, paypal
  catalogName: LocalizedString;        // frozen copy from catalog at transaction time
};

type PaymentMethodTransactionSnapshot = {
  userPaymentMethodId: string | null;  // copy of FK for convenience
  type: PaymentMethodType;
  direction: PaymentDirection;         // PAYIN or PAYOUT for this transaction
  label: string | null;
  details: PaymentMethodDetails;       // full routing used for this transaction (encrypt bank fields)
  catalog: PaymentMethodCatalogSnapshot | null; // null for BANK_TRANSFER / CASH
  snapshottedAt: string;               // ISO timestamp
};
```

| Transaction table | Direction | Snapshot required |
|-------------------|-----------|-------------------|
| `payments` | PAYIN | **Yes** — `payment_method_snapshot` NOT NULL |
| `teacher_payments` | PAYOUT | **Yes** — `payment_method_snapshot` NOT NULL |
| Future pay-in/pay-out tables | either | Same pattern |

Service helper: `buildPaymentMethodTransactionSnapshot(method, direction, locale)` — resolves catalog names, copies details, never reads from live method after insert.

Display on historical transactions uses **snapshot** (masked per scope), not live `user_payment_methods`.

## JSONB columns & typesafety

PostgreSQL JSONB is **schema-less at the DB level** — Drizzle `.$type<T>()` is compile-time only. Runtime shape enforcement is **required** in the service layer before every write.

**Drizzle MCP:** use `project-0-siraj-drizzle` `generate` / `check` for migrations (skills revision **12**, aligned). After schema edits: `check` → drop DB → `generate` (8C). Resolve `missing_hints` via `drizzle-hints` skill.

### JSONB inventory

| Table | Column | TypeScript type (`.$type<>`) | Runtime validator |
|-------|--------|-------------------------------|-------------------|
| `user_payment_methods` | `details` | `PaymentMethodDetails` | `parsePaymentMethodDetails(type, details)` |
| `payments` | `payment_method_snapshot` | `PaymentMethodTransactionSnapshot` | `paymentMethodTransactionSnapshotSchema` |
| `teacher_payments` | `payment_method_snapshot` | `PaymentMethodTransactionSnapshot` | same schema |
| `supported_mobile_wallets` | `name` | `LocalizedString` | `localizedStringSchema` |
| `supported_mobile_wallets` | `description` | `LocalizedString` | optional |
| `supported_mobile_wallets` | `instructions` | `LocalizedString` | optional |
| `supported_payment_links` | `name`, `description`, `instructions` | `LocalizedString` | same |
| `supported_payment_links` | `url_allowlist` | `readonly string[]` | `z.array(z.string().min(1))` |
| `supported_online_accounts` | `name`, `description`, `instructions`, `identifier_label` | `LocalizedString` | same |

Non-JSONB enums (`type`, `direction`, `country_code`, etc.) use native PG enums / varchar — not JSONB.

### Drizzle schema pattern (follow `permissions.ts`)

```ts
import type { PaymentMethodDetails, PaymentMethodTransactionSnapshot } from "@/backend/types/payment-method.types";
import type { LocalizedString } from "@/backend/types/localized-string.types";

// user_payment_methods
details: jsonb("details").$type<PaymentMethodDetails>().notNull(),

// payments / teacher_payments
paymentMethodSnapshot: jsonb("payment_method_snapshot")
  .$type<PaymentMethodTransactionSnapshot>()
  .notNull(),

// catalog tables (permissions precedent)
name: jsonb("name").$type<LocalizedString>().notNull(),
urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>().notNull(),
```

Import types from `@/backend/types/*` in schema files — never inline object shapes in `.$type<>`.

### Type layers (single canonical source)

```
backend/types/payment-method.types.ts     TS unions + Select/Return/Submit types
backend/lib/payment-method.validation.ts  Zod schemas (runtime gate on write/read from external input)
backend/db/schema/*.ts                    jsonb(...).$type<T>() from types file
backend/services/payment-method/*         validate → encrypt → repo insert
```

`PaymentMethodDetails` is a **discriminated union** keyed by the row's `type` column — always validate `{ type, details }` together, never `details` alone.

### Bank field encryption inside JSONB

Old banking used `encryptedText` columns. New model stores bank routing **inside** `details` JSONB.

- Extract shared `encryptField` / `decryptField` from `backend/db/schema/custom-types.ts` → `backend/lib/field-encryption.ts` (reuse AES-256-GCM logic)
- **At rest in JSONB:** `BankTransferDetails` string fields (`iban`, `accountNumber`, …) stored as ciphertext strings
- **Service I/O:** `PaymentMethodService` encrypts before insert/update, decrypts only for authorized read paths (admin verify, own-scope edit)
- **Snapshots:** encrypt bank fields in `payment_method_snapshot.details` the same way — snapshot is immutable after insert
- **Masking:** `payment-method-mask.ts` operates on decrypted values in memory, never logs plaintext

Do **not** use untyped `jsonb("details")` without `.$type<>`. Do **not** skip Zod because TS compiles.

### Validation rules (`backend/lib/payment-method.validation.ts`)

| Payload | Rule |
|---------|------|
| `MOBILE_WALLET` details | `walletId` UUID + active catalog; `phone` E.164 vs catalog `phoneRegion` |
| `PAYMENT_LINK` details | `paymentLinkId` + URL host ∈ `url_allowlist` |
| `ONLINE_ACCOUNT` details | `onlineAccountId` + identifier per catalog `identifierKind` |
| `BANK_TRANSFER` details | at least one routing field; encrypt sensitive fields before persist |
| `CASH` details | optional `note` |
| `PaymentMethodTransactionSnapshot` | full schema incl. `snapshottedAt` ISO string; immutable after write |
| Catalog `LocalizedString` | reuse / share schema with permission catalog patterns |

Repos receive **already-validated** typed objects from services — repos do not run Zod.

### GraphQL / frontend

- Pothos input objects mirror Zod shapes (not separate ad-hoc types)
- Frontend forms use Zod (existing pattern); GraphQL codegen types from schema
- Never import `@/backend/types` JSONB shapes in frontend — use generated GraphQL types only


### Removed (8C — delete, do not deprecate)

- `teachers.payment_method` column
- `parents.payment_method` column
- `teacher_banking_details_history` table + `teacher-banking.ts` schema file
- `teacher_banking_details_history` PG enum usage on role tables
- `PaymentMethod` enum (`PAYPAL` \| `BANK_ACCOUNT`) — TS, PG, and GraphQL
- `paymentMethodEnum` in `backend/db/schema/enums.ts`
- GraphQL `TeacherBankingSummary` object + `PaymentMethodPothosObject`
- `TeacherBankingRepository`, `banking-summary.ts`, teacher banking UI tab
- `BANKING_DETAILS_CHANGED` notification event (replaced by `PAYMENT_METHOD_CHANGED`)

## GraphQL contract

### Enums

- `PaymentMethodType` — `MOBILE_WALLET`, `PAYMENT_LINK`, `ONLINE_ACCOUNT`, `BANK_TRANSFER`, `CASH`
- `PaymentDirection` — `PAYIN`, `PAYOUT`, `BOTH`

**Direction semantics (user methods + catalog `supportedDirections`):**

| Enum | Meaning | UI label (en) | Use |
|------|---------|---------------|-----|
| `PAYIN` | Money **in** to Siraj / academy | **In** | Parent payments, invoice collection |
| `PAYOUT` | Money **out** from Siraj / academy | **Out** | Teacher disbursements, refunds |
| `BOTH` | Allowed for pay-in and pay-out | **Both** | Same saved method or catalog row usable either way |

- **User method** `direction` on `user_payment_methods`: one of `PAYIN` \| `PAYOUT` \| `BOTH`
- **Catalog** `supportedDirections` on wallet/link/online-account rows: same enum — filters pickers and admin forms
- **Transaction** snapshot `direction`: always `PAYIN` or `PAYOUT` for that specific money movement (never `BOTH` on a transaction row)
- **Defaults (1bA):** `BOTH` + `isDefault` occupies both pay-in and pay-out default slots

UI: `next-intl` keys under `ui.paymentMethod.direction` — `in`, `out`, `both` — do not show raw enum strings to users.

- `IdentifierKind` — `EMAIL`, `HANDLE`, `EMAIL_OR_HANDLE` (catalog metadata)

`payments.payment_method_type` uses `PaymentMethodType` (replaces old `payment_method` column).

### Objects

| Object | Source type | Notes |
|--------|-------------|-------|
| `UserPaymentMethod` | `UserPaymentMethodReturnType` | Canonical; always expose `id` |
| `SupportedMobileWallet` | catalog return type | Resolved name/logo for pickers |
| `SupportedPaymentLink` | catalog return type | |
| `SupportedOnlineAccount` | catalog return type | |
| `PaymentMethodDefaults` | computed | `{ payinDefault, payoutDefault }` per user |
| `PaymentMethodTransactionSnapshot` | `PaymentMethodTransactionSnapshot` | Read-only on transaction objects |

Resolved fields on `UserPaymentMethod`: `displayName`, `catalogLogoUrl`, `maskedDetails` (scope-aware).

Transaction objects (`Payment`, `TeacherPayment`) expose `paymentMethodSnapshot` (masked for non-admin) — **never** re-resolve from live method for display.

### Queries

- `userPaymentMethods(userId, direction?)` — list methods for a user
- `userPaymentMethodDefaults(userId)` — payin/payout defaults
- `supportedMobileWallets(countryCode?, direction?)` — active catalog rows
- `supportedPaymentLinks(countryCode?, direction?)`
- `supportedOnlineAccounts(countryCode?, direction?)`

### Mutations — user methods

- `createUserPaymentMethod(input)` — Zod-validated; clears competing defaults when `isDefault`
- `updateUserPaymentMethod(id, input)` — immutable `type` change forbidden; details update per type rules
- `deleteUserPaymentMethod(id)` — soft-block if referenced by unpaid invoice payment
- `setDefaultUserPaymentMethod(id)` — 1bA slot logic in service

### Mutations — catalog admin

- `createSupportedMobileWallet` / `updateSupportedMobileWallet` / `deactivateSupportedMobileWallet`
- Same pattern for `SupportedPaymentLink` and `SupportedOnlineAccount`
- Permission: `payment_methods.manage_catalogs`

### Mutations — verification

- `verifyBankTransferPaymentMethod(id)` — admin only; permission `payment_methods.verify_bank_transfer`

### Profile / onboarding changes

Replace scalar `paymentMethod` and inline banking fields:

| Surface | Before | After |
|---------|--------|-------|
| `TeacherOnboardingInput` | `beneficiaryName`, `iban`, … | `initialPayoutMethod: UserPaymentMethodSubmitInput` |
| `ParentOnboardingInput` | `paymentMethod: PaymentMethod` | `initialPayinMethod: UserPaymentMethodSubmitInput` |
| `TeacherProfileResult` | `paymentMethod` | `paymentMethods`, `defaultPayoutMethod` |
| `ParentProfile` | `paymentMethod: String` | `paymentMethods`, `defaultPayinMethod` |
| `UnifiedProfile` | `bankingSummary` | `paymentMethods` (masked, scope-aware) |
| `recordPayment` input | `paymentMethod: PaymentMethod` | `userPaymentMethodId` (optional) — service builds snapshot |
| `createTeacherPayment` input | banking history id implicit | `userPaymentMethodId` — service builds snapshot |

## UI components

Mirror [timezone spec](../timezone/spec.md) — shared components under `frontend/components/ui/`:

| Component | Path | Role |
|-----------|------|------|
| `PaymentMethodSelect` | `frontend/components/ui/input/PaymentMethodSelect.tsx` | Type + catalog picker |
| `PaymentMethodDisplay` | `frontend/components/ui/display/PaymentMethodDisplay.tsx` | Read-only masked display |
| `PaymentMethodTypeFields` | `frontend/components/ui/input/PaymentMethodTypeFields.tsx` | Dynamic fields by type |
| `PaymentMethodDefaultsEditor` | `frontend/components/ui/input/PaymentMethodDefaultsEditor.tsx` | Payin/payout default toggles |
| `PaymentMethodList` | `frontend/components/ui/display/PaymentMethodList.tsx` | List with default badges |

**Admin catalog UI** (new views under `frontend/views/dashboard/admin/payment-catalogs/`):

- `PaymentCatalogAdminContainer` — tabbed wallets / links / online accounts
- `PaymentCatalogDataGrid` + edit dialog per catalog type
- Follow `AdminBillingContainer` / `PageContainer` patterns from [COMPONENT_PATTERNS.md](../../../frontend/COMPONENT_PATTERNS.md)

Use shared components everywhere — no ad-hoc 2-option `Select` in views.

## Masking rules

Port from `backend/services/profile/banking-summary.ts`:

| Field type | Mask pattern |
|------------|--------------|
| Numeric (account, IBAN) | `****` + last 4 |
| Text (name, bank) | first char + stars + last char |
| SWIFT/BIC | first 2 + stars + last 2 |
| Phone | libphonenumber masked display |
| Email / identifier | `a***@domain.com` or handle mask |
| URL | host visible, path masked |

**Scope:** `own` scope returns full details for user's own methods; `other` scope returns masked. Admin with verify permission sees full bank details.

## Constraints

- Read layer AGENTS.md before editing each layer (see [plan.md](./plan.md) compliance matrix)
- Backend pipeline: types → schema → repo → service → pothos (resolvers never call repos)
- Types: single canonical source `backend/types/payment-method.types.ts`; no local Pothos types
- Frontend: codegen types from `graphql-types.ts`; Apollo hooks from `@apollo/client/react`
- GraphQL documents: `{entity}QueryDocument` / `{entity}MutationDocument`; always include `id`; import `gql` from `@apollo/client` (not `@apollo/client/core`)
- Frontend enums: use GraphQL codegen types from `graphql-types.ts` — never import `@/backend/enum` in frontend
- Services: split `PaymentMethodService` (user CRUD/defaults) and `PaymentCatalogService` (admin catalog) — no monolithic service
- DB tests: `runInRollback`, pass `tx`, no `expect().rejects.toThrow()` inside rollback
- i18n: `next-intl` for UI; `getBackendTranslations` for backend errors
- Logging: `logger` only — never `console.*`
- MUI v9: style props in `sx`; icons `*Outlined`
- Migration: edit schema to final shape → drop local DB → `drizzle-kit generate` clean migration set — no incremental ALTER/backfill scripts

## Out of scope

- Card / Mada / Apple Pay / Google Pay as saved user methods (PSP tokens)
- PSP integration / automated payment capture
- FX conversion on payment methods (see Decision 3 — currency model)
- `staff_profiles` fate (Decision 6)
- Meeting configs (Decision 5)

## Acceptance criteria

1. `user_payment_methods` + 3 catalog tables exist; role `payment_method` columns and `teacher_banking_details_history` removed
2. Users can save multiple methods with direction-specific defaults (1bA enforced in service + DB indexes)
3. Catalog-driven pickers work for wallets, links, and online accounts; seeds include PayPal, Wise, Vodafone Cash, InstaPay
4. Admin can CRUD catalog rows; inactive catalog rows block new user methods but don't break existing
5. `BANK_TRANSFER` verification workflow works for admin; masked display for non-admin scopes
6. Every pay-in (`payments`) and pay-out (`teacher_payments`) row stores immutable `payment_method_snapshot` at creation; audit does not depend on live method rows
7. `teacher_payments` references `user_payment_method_id` + snapshot (replaces banking history FK)
8. All profile/onboarding views use shared `PaymentMethod*` components — old `PaymentMethod` enum references fully removed from codebase
9. `bun tsgo`, `test:db`, `test:graphql` pass; Storybook stories for new UI components
10. `bun quality-gate` passes on touched files
11. Every JSONB column uses `jsonb(...).$type<T>()` with `T` from `@/backend/types`; Zod validates all writes; bank fields encrypted inside JSONB at rest
