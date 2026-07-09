# Decision 2: Payment method types + country catalogs

## Status: **DECIDED — catalog-driven generics + standard globals**

**Locked with Decision 1A:** user rows live in `user_payment_methods` (`type` + JSONB `details`).  
**No credentials** — routing details only; payment completed externally.

**Amendment (2026-07):** PayPal and Wise are **not** separate enum values — they are catalog rows under **`ONLINE_ACCOUNT`**.

---

## Core idea

Do **not** hardcode Vodafone Cash, Etisalat Cash, STC Pay, InstaPay, PayPal, Wise, Skrill, etc. as separate `PaymentMethodType` enum values.

Instead:

| User-facing type (enum) | How provider variety is handled |
|-------------------------|----------------------------------|
| **MOBILE_WALLET** | Catalog table of wallets; each row = one brand in one country |
| **PAYMENT_LINK** | Catalog table of link-based rails; each row = one brand (e.g. InstaPay) |
| **ONLINE_ACCOUNT** | Catalog table of email/handle-based platforms; each row = one brand (e.g. PayPal, Wise) |
| **BANK_TRANSFER** | Standard — IBAN / local bank routing in JSONB (no catalog required for v1) |
| **CASH** | Standard — optional note |

Admin **adds/updates** catalog rows (name, country, currency, image, validation rules). Users attach a method by picking a catalog entry + entering routing details (phone / URL / identifier).

```
supported_mobile_wallets   supported_payment_links   supported_online_accounts
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    ▼
                         user_payment_methods
                         type = MOBILE_WALLET | PAYMENT_LINK | ONLINE_ACCOUNT | …
                         details = { catalogId, phone | url | identifier, … }
```

---

## Type: `MOBILE_WALLET`

**User stores:** catalog reference + **international E.164 phone** (validated).

**Not stored as separate types:** Vodafone Cash, Etisalat Cash, Orange Cash, STC Pay, M-Pesa, MTN MoMo, … — those are **catalog rows**.

### Catalog table: `supported_mobile_wallets` (suggested columns)

| Column | Purpose |
|--------|---------|
| `id` | UUID PK |
| `slug` | Stable key (`vodafone_cash_eg`, `stc_pay_sa`) — unique |
| `name` | Display name (or `jsonb` LocalizedString like permissions) |
| `description` | Optional short help text / LocalizedString |
| `countryCode` | `CountryCode` enum — wallet operates in this country |
| `currencyCode` | `CurrencyCode` enum — **enforced** for money shown/settled with this wallet (usually country’s primary currency; allow explicit override if needed) |
| `logoUrl` / `imageFilePath` | Brand image for UI |
| `phoneRegion` | ISO region hint for libphonenumber (often same as country) — validates number belongs to that country |
| `phoneExample` | Optional placeholder e.g. `010xxxxxxxx` |
| `supportedDirections` | `PAYIN` \| `PAYOUT` \| `BOTH` — what Siraj allows for this wallet |
| `isActive` | Soft-disable without deleting user methods |
| `sortOrder` | Admin UI / picker order within country |
| `instructions` | Localized “how to pay/receive via this wallet” for ops/parents |
| `externalInfoUrl` | Optional link to provider help page |
| `createdAt` / `updatedAt` | Audit |

**Optional later:** `minAmount` / `maxAmount`, `feeNote`, `requiresManualVerification`.

### User `details` shape (JSONB)

```ts
{
  walletId: string;      // FK → supported_mobile_wallets.id
  phone: string;         // E.164, validated against wallet.phoneRegion / country
}
```

**Validation rules:**

1. `walletId` must exist and `isActive`
2. Phone parses as valid E.164 via existing `PhoneNumber` / google-libphonenumber
3. Number’s region must match catalog `phoneRegion` / `countryCode`
4. UI may filter wallets by `users.countryCode` or by explicit country picker

---

## Type: `PAYMENT_LINK`

**User stores:** catalog reference + a **URL** (or provider handle that becomes a URL).

**Example catalog row:** InstaPay (Egypt) — user pastes their InstaPay payment link / IPA link.

### Catalog table: `supported_payment_links` (suggested columns)

| Column | Purpose |
|--------|---------|
| `id` | UUID PK |
| `slug` | e.g. `instapay_eg`, `fawry_pay_link_eg` |
| `name` | Display name / LocalizedString |
| `description` | Optional LocalizedString |
| `countryCode` | `CountryCode` — where this rail applies |
| `currencyCode` | `CurrencyCode` — enforced with this rail |
| `logoUrl` / `imageFilePath` | Brand image |
| `urlAllowlist` | JSONB string[] of allowed host suffixes e.g. `["instapay.com.eg", "ipa.instapay"]` — validate user URL |
| `urlExample` | Placeholder shown in UI |
| `deepLinkScheme` | Optional (`instapay://…`) if apps use schemes |
| `supportedDirections` | `PAYIN` \| `PAYOUT` \| `BOTH` |
| `isActive` | Soft-disable |
| `sortOrder` | Picker order |
| `instructions` | Localized ops/user guidance |
| `externalInfoUrl` | Provider docs |
| `createdAt` / `updatedAt` | Audit |

### User `details` shape (JSONB)

```ts
{
  paymentLinkId: string;  // FK → supported_payment_links.id
  url: string;            // https://… validated against catalog allowlist
}
```

**Validation rules:**

1. Active catalog row
2. URL is https (or allowed scheme), host matches `urlAllowlist`
3. Country/currency come from catalog (not free-typed by user)

---

## Type: `ONLINE_ACCOUNT`

**User stores:** catalog reference + an **identifier** (email, handle, or either — per catalog).

**Not stored as separate types:** PayPal, Wise, Skrill, Payoneer, Venmo (if email-based), … — those are **catalog rows**.

Replaces the earlier standalone `PAYPAL` / optional `WISE` enum values. Add new platforms by seeding catalog rows, not migrations.

### Catalog table: `supported_online_accounts` (suggested columns)

| Column | Purpose |
|--------|---------|
| `id` | UUID PK |
| `slug` | Stable key (`paypal`, `wise`, `skrill`, `payoneer`) — unique |
| `name` | Display name / LocalizedString |
| `description` | Optional LocalizedString |
| `countryCode` | `CountryCode` — `null` or a sentinel for **global** platforms; set when rail is country-scoped |
| `currencyCode` | `CurrencyCode` — primary settlement/display currency; `null` if multi-currency |
| `logoUrl` / `imageFilePath` | Brand image for UI |
| `identifierKind` | `EMAIL` \| `HANDLE` \| `EMAIL_OR_HANDLE` — what the user must provide |
| `identifierLabel` | Localized field label e.g. “PayPal email”, “Wise tag” |
| `identifierPlaceholder` | UI placeholder e.g. `name@email.com`, `@username` |
| `identifierPattern` | Optional regex for handle/email shape beyond standard email validation |
| `handlePrefix` | Optional fixed prefix shown in UI (e.g. `@` for Wise tags) |
| `supportedDirections` | `PAYIN` \| `PAYOUT` \| `BOTH` |
| `isActive` | Soft-disable without deleting user methods |
| `sortOrder` | Admin UI / picker order |
| `instructions` | Localized “how to pay/receive via this platform” |
| `externalInfoUrl` | Provider help / signup link |
| `createdAt` / `updatedAt` | Audit |

### User `details` shape (JSONB)

```ts
{
  onlineAccountId: string;  // FK → supported_online_accounts.id
  identifier: string;       // email or handle — validated per catalog.identifierKind
}
```

**Validation rules:**

1. `onlineAccountId` must exist and `isActive`
2. `EMAIL` → valid email (existing email validator)
3. `HANDLE` → matches `identifierPattern` / `handlePrefix` rules from catalog
4. `EMAIL_OR_HANDLE` → accept email **or** handle per catalog rules (Wise-style)
5. Country/currency constraints come from catalog when set (not free-typed by user)

### Seed examples (catalog rows, not enum values)

| slug | name | identifierKind | supportedDirections |
|------|------|----------------|---------------------|
| `paypal` | PayPal | `EMAIL` | `BOTH` |
| `wise` | Wise | `EMAIL_OR_HANDLE` | `PAYOUT` |
| `skrill` | Skrill | `EMAIL` | `BOTH` |
| `payoneer` | Payoneer | `EMAIL` | `PAYOUT` |

---

## Standard global types (no country catalog)

These stay as first-class `PaymentMethodType` values with JSONB details only:

| Type | `details` (routing only) | Why keep standard |
|------|--------------------------|-------------------|
| **BANK_TRANSFER** | IBAN / account / bank name / beneficiary / SWIFT / routing | Universal teacher PAYOUT; already in product |
| **CASH** | `{ note? }` | Offline ops |

### Other candidates — prefer catalog, not new enums

| Candidate | Pattern | Notes |
|-----------|---------|--------|
| **PayPal / Wise / Skrill / Payoneer** | **ONLINE_ACCOUNT** catalog rows | **Locked** — no per-brand enum |
| **Email transfer (generic)** | **ONLINE_ACCOUNT** row with `identifierKind=EMAIL` | e.g. Interac-style “send to email” without a named PSP |
| **UPI** (India) | **PAYMENT_LINK** catalog or dedicated **ONLINE_ACCOUNT** row with `identifierKind=HANDLE` | Huge market if you expand to IN |
| **Pix** (Brazil) | **PAYMENT_LINK** or **ONLINE_ACCOUNT** catalog row | If LATAM matters later |
| **M-Pesa / Orange Money / MTN MoMo** | **MOBILE_WALLET** catalog rows (KE, CI, GH, …) | No new enum — just seed wallets |
| **STC Pay / urpay** (KSA) | **MOBILE_WALLET** catalog | Same |
| **Fawry** | Often bill reference at pay time → prefer **transaction snapshot**, or a **PAYMENT_LINK** row if users have a reusable link | Don’t force as enum |

**Not recommended as saved user methods** (need PSP tokens): card, Mada, Apple Pay, Google Pay — keep as invoice payment snapshot labels only if needed.

---

## Decided v1 type set

| Type | Catalog? | In v1 |
|------|----------|-------|
| `MOBILE_WALLET` | `supported_mobile_wallets` | **Yes** |
| `PAYMENT_LINK` | `supported_payment_links` | **Yes** |
| `ONLINE_ACCOUNT` | `supported_online_accounts` | **Yes** |
| `BANK_TRANSFER` | — | **Yes** |
| `CASH` | — | **Yes** |

**Removed from enum** (now catalog rows): `PAYPAL`, `WISE`.

Seed examples (not enum values):

- Wallets: Vodafone Cash (EG), Etisalat Cash (EG), Orange Cash (EG), STC Pay (SA), …  
- Links: InstaPay (EG), …  
- Online accounts: PayPal, Wise, Skrill, Payoneer, …

Defaults for multiple methods: [01b](./01b-payment-defaults.md) (**DECIDED 1bA**).

---

## Relation to Decision 1A

Update conceptual `user_payment_methods.type` enum to:

`MOBILE_WALLET | PAYMENT_LINK | ONLINE_ACCOUNT | BANK_TRANSFER | CASH`

`details` discriminated by `type`; wallet / link / online-account details **must** include catalog FK.  
Clean-slate (8C): drop old `PaymentMethod` `PAYPAL | BANK_ACCOUNT` on role tables; migrate teacher banking → `BANK_TRANSFER` rows; migrate legacy PayPal rows → `ONLINE_ACCOUNT` with `onlineAccountId` → PayPal catalog row.
