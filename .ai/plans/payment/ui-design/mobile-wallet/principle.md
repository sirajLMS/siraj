# MOBILE_WALLET — UI principle

**Enum:** `PaymentMethodType.MOBILE_WALLET`  
**Catalog table:** `supported_mobile_wallets`  
**User details:** `{ walletId, phone }`

Two surfaces: **admin catalog create/update** (all editable fields) and **user save method** (picker + phone).

---

## A. Admin — create / update catalog row

**View:** `SupportedMobileWalletEditDialog.tsx`  
**Container:** `PaymentCatalogAdminContainer` → wallets tab  
**Mutation:** `createSupportedMobileWallet` / `updateSupportedMobileWallet`  
**Permission:** `payment_methods.manage_catalogs`

### Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Add mobile wallet                                    [×]       │
├─────────────────────────────────────────────────────────────────┤
│  Slug *              [ vodafone_cash_eg        ]  (read-only on edit) │
│                                                                 │
│  Name *              <LocalizedStringInput requiredLocales=[ar]> │
│  Description         <LocalizedStringInput>                    │
│  Instructions        <LocalizedStringInput multiline rows=4>     │
│                                                                 │
│  Country *           <CountrySelect>                             │
│  Currency *          <Select CurrencyCode>                     │
│  Phone region        [ EG ]  (auto from country, editable)       │
│  Phone example       [ 010xxxxxxxx ]                             │
│                                                                 │
│  Directions *        <Select> In | Out | Both  (PAYIN | PAYOUT | BOTH) │
│  Sort order          [ 10 ]                                      │
│  Active              [✓] Switch                                  │
│                                                                 │
│  Logo                ┌──────────────┐                            │
│                      │   [preview]  │  [ Upload image ]          │
│                      └──────────────┘  PNG/JPG/WebP max 2MB     │
│                      — or —                                      │
│  Logo URL            [ https://… ]  (optional if file uploaded)  │
│                                                                 │
│  External info URL   [ https://vodafone… ]                       │
│                                                                 │
│                         [ Cancel ]  [ Save ]                     │
└─────────────────────────────────────────────────────────────────┘
```

### Field → component map

| Column | Component | Notes |
|--------|-----------|-------|
| `slug` | `TextField` | Required on create; disabled on update |
| `name` | `LocalizedStringInput` | `requiredLocales: ["ar"]` |
| `description` | `LocalizedStringInput` | Optional |
| `instructions` | `LocalizedStringInput` | `multiline`, shown to users after wallet pick |
| `countryCode` | `CountrySelect` | On change → set `phoneRegion` default to `country.code` |
| `currencyCode` | MUI `Select` | GraphQL `CurrencyCode` enum |
| `phoneRegion` | `TextField` | ISO 3166-1 alpha-2, 2 chars, `dir="ltr"` |
| `phoneExample` | `TextField` | Placeholder for user phone field |
| `supportedDirections` | `Select` | `PaymentDirection` — UI labels **In** / **Out** / **Both** |
| `sortOrder` | `TextField` `type="number"` | |
| `isActive` | `Switch` | |
| `logoUrl` | `TextField` OR upload result URL | |
| `imageFilePath` | Set by upload mutation | Internal storage path after upload |
| `externalInfoUrl` | `TextField` `type="url"` | |

### Logo upload flow

1. Reuse `AvatarUploadDialog` pattern: hidden `<input type="file" accept="image/jpeg,image/png,image/webp" />`, client validate size ≤ 2MB
2. Container calls upload API (same stack as avatar/resources) → receives `logoUrl` + `imageFilePath`
3. Preview in dialog; on save, persist both fields on catalog row
4. Errors → `notifications.show(t("logoUploadFailed"), { severity: "error" })`

### Form submit

```ts
// react-hook-form + Zod
{
  slug: string;
  name: LocalizedString;          // Zod: ar required
  description?: LocalizedString;
  instructions?: LocalizedString;
  countryCode: CountryCode;
  currencyCode: CurrencyCode;
  phoneRegion: string;
  phoneExample?: string;
  supportedDirections: PaymentDirection;
  sortOrder: number;
  isActive: boolean;
  logoUrl?: string;
  imageFilePath?: string;
  externalInfoUrl?: string;
}
```

**Snackbar:** success/error via `useNotifications` (see README).

### Admin grid row display

| Column | Display |
|--------|---------|
| Name | `LocalizedStringDisplay` or resolved string from query |
| Country | `CountryDisplay` |
| Currency | code |
| Directions | chips |
| Active | icon |
| Logo | `<img src={logoUrl} width={32} />` |

---

## B. User — save payment method

**Component:** `PaymentMethodTypeFields` when `type === MOBILE_WALLET`  
**Also in:** parent/teacher onboarding, profile dialog

### Wireframe

```
Wallet *              [ Autocomplete: logo + resolved name + CountryDisplay ]

ℹ️ Instructions       <LocalizedStringDisplay value={selectedWallet.instructions} />
                      (or resolved string from GraphQL query)

Mobile number *       [ +20 10 1234 5678    ]  dir=ltr, type=tel
                      hint: phoneExample from catalog
```

| Field | Component |
|-------|-----------|
| `details.walletId` | MUI `Autocomplete` — options from `supportedMobileWallets(countryCode, direction)`; option label = resolved `name`; render logo + `CountryDisplay` in row |
| Instructions | Resolved `instructions` string in `Alert` |
| `details.phone` | `TextField` `type="tel"` `dir="ltr"` — **no dedicated PhoneInput yet** |

Query returns resolved `name` / `instructions` for `useLocale()`; picker does not edit LocalizedString.

### User method display (`PaymentMethodDisplay`)

```
[logo]  Vodafone Cash          [Default pay in]
        +20 ••• ••• 4567        (maskedDetails from GraphQL)
```

- Title: user `label` ?? resolved catalog name
- Subline: masked phone
- Logo: `catalogLogoUrl`

---

## Prototype HTML skeleton (admin)

```html
<form data-surface="admin-mobile-wallet" data-mode="create|update">
  <input name="slug" required pattern="[a-z0-9_]+" />

  <div data-component="LocalizedStringInput" data-field="name" data-required-locales="ar">
    <!-- row: Select adornment (ar) + text; [+ Add translation] for en -->
  </div>

  <div data-component="CountrySelect" name="countryCode" />
  <select name="currencyCode" />
  <input name="phoneRegion" maxlength="2" dir="ltr" />
  <input name="phoneExample" dir="ltr" />

  <div data-component="logo-upload">
    <img data-preview />
    <button type="button" data-action="upload">Upload image</button>
  </div>

  <button type="submit">Save</button>
</form>
```

---

## i18n keys (chrome only)

`ui.paymentMethod.types.mobileWallet`, `dashboard.paymentCatalog.wallets.*`, `dashboard.paymentCatalog.actions.saveSuccess` — catalog **content** stays in `LocalizedString` JSONB, not message files.
