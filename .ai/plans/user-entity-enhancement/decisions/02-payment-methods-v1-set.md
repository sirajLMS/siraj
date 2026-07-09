# Decision 2: Payment method types + country catalogs

## Status: **DECIDED — catalog-driven generics + standard globals**

**Locked with Decision 1A:** user rows live in `user_payment_methods` (`type` + JSONB `details`).  
**No credentials** — routing details only; payment completed externally.

---

## Core idea

Do **not** hardcode Vodafone Cash, Etisalat Cash, STC Pay, InstaPay, etc. as separate `PaymentMethodType` enum values.

Instead:

| User-facing type (enum) | How provider variety is handled |
|-------------------------|----------------------------------|
| **MOBILE_WALLET** | Catalog table of wallets; each row = one brand in one country |
| **PAYMENT_LINK** | Catalog table of link-based rails; each row = one brand (e.g. InstaPay) |
| **BANK_TRANSFER** | Standard — IBAN / local bank routing in JSONB (no catalog required for v1) |
| **PAYPAL** | Standard — email |
| **CASH** | Standard — optional note |
| *(optional globals)* | See § Suggested international additions |

Admin **adds/updates** catalog rows (name, country, currency, image, validation rules). Users attach a method by picking a catalog entry + entering routing details (phone / URL).

```
supported_mobile_wallets     supported_payment_links
         │                            │
         └──────────┬─────────────────┘
                    ▼
           user_payment_methods
           type = MOBILE_WALLET | PAYMENT_LINK | …
           details = { catalogId, phone | url, … }
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

## Standard global types (no country catalog)

These stay as first-class `PaymentMethodType` values with JSONB details only:

| Type | `details` (routing only) | Why keep standard |
|------|--------------------------|-------------------|
| **BANK_TRANSFER** | IBAN / account / bank name / beneficiary / SWIFT / routing | Universal teacher PAYOUT; already in product |
| **PAYPAL** | `{ email }` | Global email rail |
| **CASH** | `{ note? }` | Offline ops |

### Optional standards to consider (multi-country site)

You asked for suggestions beyond Egypt. These fit **routing-details-only** and travel well:

| Candidate | Pattern | Notes |
|-----------|---------|--------|
| **Wise** | `{ email }` or `{ handle }` | Strong for international **teacher PAYOUT**; same family as PayPal |
| **Email transfer (generic)** | `{ email }` | Covers Interac-like / “send to email” ops without a PSP — or fold under PayPal/Wise only |
| **UPI** (India) | Could be **PAYMENT_LINK** catalog or `{ upiId }` standard | Huge market if you expand to IN |
| **Pix** (Brazil) | Catalog key type or payment-link style | If LATAM matters later |
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
| `BANK_TRANSFER` | — | **Yes** |
| `PAYPAL` | — | **Yes** |
| `CASH` | — | **Yes** |
| `WISE` | — | **Suggested yes** for international teachers (confirm) |

Seed examples (not enum values):

- Wallets: Vodafone Cash (EG), Etisalat Cash (EG), Orange Cash (EG), STC Pay (SA), …  
- Links: InstaPay (EG), …

---

## Still confirm (narrow)

Reply with whether to include **Wise** in v1:

- `2: +wise` — add `WISE` type  
- `2: -wise` — skip Wise for now (PayPal + bank cover email/bank payouts)

Defaults for multiple methods remain [01b](./01b-payment-defaults.md).

---

## Relation to Decision 1A

Update conceptual `user_payment_methods.type` enum to:

`MOBILE_WALLET | PAYMENT_LINK | BANK_TRANSFER | PAYPAL | CASH | WISE?`

`details` discriminated by `type`; wallet/link details **must** include catalog FK.  
Clean-slate (8C): drop old `PaymentMethod` `PAYPAL | BANK_ACCOUNT` on role tables; migrate teacher banking → `BANK_TRANSFER` rows.
