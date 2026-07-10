# PAYMENT_LINK — UI principle

**Enum:** `PaymentMethodType.PAYMENT_LINK`  
**Catalog table:** `supported_payment_links`  
**User details:** `{ paymentLinkId, url }`

Admin catalog CRUD (all fields) + user method (picker + URL).

---

## A. Admin — create / update catalog row

**View:** `SupportedPaymentLinkEditDialog.tsx`

### Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Add payment link                                     [×]       │
├─────────────────────────────────────────────────────────────────┤
│  Slug *              [ instapay_eg               ]                │
│                                                                 │
│  Name *              <LocalizedStringInput requiredLocales=[ar]> │
│  Description         <LocalizedStringInput>                    │
│  Instructions        <LocalizedStringInput multiline rows=4>     │
│                                                                 │
│  Country *           <CountrySelect>                           │
│  Currency *          <Select CurrencyCode>                     │
│  Directions *        <Select> In | Out | Both                         │
│  Sort order          [ 10 ]    Active [✓]                        │
│                                                                 │
│  Allowed URL hosts * <TagInput>  [ instapay.com.eg × ] …        │
│  URL example         [ https://instapay.com.eg/… ]  dir=ltr     │
│  Deep link scheme    [ instapay:// ]  (optional)                 │
│                                                                 │
│  Logo                [ Upload image ] + preview (same as wallet) │
│  Logo URL            [ https://… ]                               │
│  External info URL   [ https://… ]                               │
│                                                                 │
│                         [ Cancel ]  [ Save ]                     │
└─────────────────────────────────────────────────────────────────┘
```

### Field → component map

| Column | Component |
|--------|-----------|
| `slug` | `TextField` (immutable on edit) |
| `name`, `description`, `instructions` | `LocalizedStringInput` — `name` requires `ar` |
| `countryCode` | `CountrySelect` |
| `currencyCode` | MUI `Select` `CurrencyCode` |
| `supportedDirections` | `Select` | **In** / **Out** / **Both** (`PAYIN` / `PAYOUT` / `BOTH`) |
| `sortOrder` | number input |
| `isActive` | `Switch` |
| `urlAllowlist` | `TagInput` — `readonly string[]`, at least one host |
| `urlExample` | `TextField` `dir="ltr"` |
| `deepLinkScheme` | `TextField` `dir="ltr"` optional |
| `logoUrl` / `imageFilePath` | Upload flow + URL (wallet pattern) |
| `externalInfoUrl` | `TextField` `type="url"` |

**Snackbar:** `useNotifications` on save / upload fail.

---

## B. User — save payment method

```
Payment link *        [ Autocomplete: logo + name + country ]

ℹ️ Instructions       Alert with resolved instructions

Your link *           [ https://instapay.com.eg/… ]  dir=ltr
                      Allowed: instapay.com.eg, ipa.instapay (chips from catalog)
```

| Field | Component |
|-------|-----------|
| `details.paymentLinkId` | `Autocomplete` from `supportedPaymentLinks` |
| `details.url` | `TextField` `type="url"` `dir="ltr"` |
| Allowlist hint | Read-only `Chip` list from selected catalog row |

Blur validation: parse URL host, match `urlAllowlist` suffix.

### Display

```
[logo]  InstaPay
        instapay.com.eg/••••••
```

---

## Prototype HTML (user)

```html
<section data-type="PAYMENT_LINK">
  <div data-component="catalog-autocomplete" data-query="supportedPaymentLinks" />
  <aside data-field="instructions" data-component="LocalizedStringDisplay" />
  <input name="details.url" type="url" dir="ltr" required />
  <ul data-field="urlAllowlist" data-readonly><!-- chips --></ul>
</section>
```

---

## i18n

Chrome: `ui.paymentMethod.fields.paymentLinkUrl`, `validation.urlHostNotAllowed`.  
Catalog names/instructions: `LocalizedString` only.
