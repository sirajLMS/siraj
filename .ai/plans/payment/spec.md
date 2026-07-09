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
| Migration | Clean-slate — drop role columns + banking history; regenerate migrations (**8C**) |
| Invoice payments | Add `payments.user_payment_method_id` FK; keep denormalized `payment_method_type` snapshot |
| Catalog admin | Admin CRUD for all three catalog tables in v1 |
| Credentials | **Never** store card PAN/CVV, PSP tokens, OAuth secrets, bank passwords |
| Imports | `@/` alias only — no relative `../` or `./` |

## Resolved design choices

| Question | Decision |
|----------|----------|
| Invoice payment snapshot | Keep `payments.payment_method_type` (`PaymentMethodType`) denormalized for historical rows when catalog/method is later deactivated; optional `user_payment_method_id` FK for live reference |
| Bank verification | Port admin verify workflow to `user_payment_methods.verified_at` / `verified_by_user_id` — **BANK_TRANSFER only** in v1 |
| Catalog admin permissions | New `AppPermission` keys: `payment_methods.manage_catalogs`, `payment_methods.verify_bank_transfer` |
| Teacher disbursements | `teacher_payments.banking_details_history_id` → `user_payment_method_id` |

## Data model

```
users
  └── user_payment_methods (many)
        type, direction, isDefault, label, details (JSONB), verifiedAt?

supported_mobile_wallets     ─┐
supported_payment_links       ├── catalog FK in details JSONB
supported_online_accounts    ─┘

payments.user_payment_method_id  → user_payment_methods (nullable FK)
payments.payment_method_type     → PaymentMethodType snapshot (NOT NULL)

teacher_payments.user_payment_method_id → user_payment_methods (NOT NULL)
```

### `user_payment_methods`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `type` | `payment_method_type` enum | |
| `direction` | `payment_direction` enum | `PAYIN` \| `PAYOUT` \| `BOTH` |
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

### Removed (8C)

- `teachers.payment_method`
- `parents.payment_method`
- `teacher_banking_details_history` table
- GraphQL `PaymentMethod` enum (`PAYPAL` \| `BANK_ACCOUNT`) on profile surfaces
- GraphQL `TeacherBankingSummary` object

## GraphQL contract

### Enums

- `PaymentMethodType` — `MOBILE_WALLET`, `PAYMENT_LINK`, `ONLINE_ACCOUNT`, `BANK_TRANSFER`, `CASH`
- `PaymentDirection` — `PAYIN`, `PAYOUT`, `BOTH`
- `IdentifierKind` — `EMAIL`, `HANDLE`, `EMAIL_OR_HANDLE` (catalog metadata)
- `InvoicePaymentMethodType` — alias or reuse `PaymentMethodType` on `payments` snapshot field

### Objects

| Object | Source type | Notes |
|--------|-------------|-------|
| `UserPaymentMethod` | `UserPaymentMethodReturnType` | Canonical; always expose `id` |
| `SupportedMobileWallet` | catalog return type | Resolved name/logo for pickers |
| `SupportedPaymentLink` | catalog return type | |
| `SupportedOnlineAccount` | catalog return type | |
| `PaymentMethodDefaults` | computed | `{ payinDefault, payoutDefault }` per user |

Resolved fields on `UserPaymentMethod`: `displayName`, `catalogLogoUrl`, `maskedDetails` (scope-aware).

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
| `recordPayment` input | `paymentMethod` enum only | + `userPaymentMethodId` optional |

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
6. Invoice `recordPayment` accepts `userPaymentMethodId` and stores type snapshot
7. `teacher_payments` references `user_payment_method_id`
8. All profile/onboarding/banking views use shared `PaymentMethod*` components — no legacy `PaymentMethod.Paypal` selects
9. `bun tsgo`, `test:db`, `test:graphql` pass; Storybook stories for new UI components
10. `bun quality-gate` passes on touched files
