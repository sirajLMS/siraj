# ONLINE_ACCOUNT — UI principle

**Enum:** `PaymentMethodType.ONLINE_ACCOUNT`  
**Catalog table:** `supported_online_accounts`  
**User details:** `{ onlineAccountId, identifier }`

Platforms (PayPal, Wise, Skrill, …) are catalog rows — not enum values.

---

## A. Admin — create / update catalog row

**View:** `SupportedOnlineAccountEditDialog.tsx`

### Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Add online account                                   [×]       │
├─────────────────────────────────────────────────────────────────┤
│  Slug *              [ paypal                        ]          │
│                                                                 │
│  Name *              <LocalizedStringInput requiredLocales=[ar]> │
│  Description         <LocalizedStringInput>                    │
│  Instructions        <LocalizedStringInput multiline>          │
│                                                                 │
│  Identifier label *  <LocalizedStringInput requiredLocales=[ar]> │
│                      (field label shown on user form)           │
│                                                                 │
│  Identifier kind *   <Select EMAIL | HANDLE | EMAIL_OR_HANDLE> │
│                                                                 │
│  Country             <CountrySelect>  (optional global row)    │
│  Currency *          <Select CurrencyCode>                     │
│  Directions *        <Select> In | Out | Both                         │
│  Sort order / Active / Logo / External URL  (same as wallet)     │
│                                                                 │
│                         [ Cancel ]  [ Save ]                     │
└─────────────────────────────────────────────────────────────────┘
```

### Field → component map

| Column | Component |
|--------|-----------|
| `slug` | `TextField` |
| `name`, `description`, `instructions` | `LocalizedStringInput` |
| `identifierLabel` | `LocalizedStringInput` `requiredLocales: ["ar"]` — **this becomes the user field label** |
| `identifierKind` | MUI `Select` `IdentifierKind` |
| `countryCode` | `CountrySelect` optional |
| `currencyCode`, `supportedDirections`, `sortOrder`, `isActive` | same as wallet |
| `logoUrl` / `imageFilePath` | logo upload pattern |
| `externalInfoUrl` | URL field |

Admin preview under identifier label input:

```tsx
<LocalizedStringDisplay value={watch("identifierLabel")} />
// “Preview (English): PayPal email or me@paypal.com handle”
```

**Snackbar:** `useNotifications` on save.

---

## B. User — save payment method

```
Platform *            [ Autocomplete: PayPal logo + name ]

<label from catalog>  [ ahmed@example.com              ]  dir=ltr
  ↑ resolved identifierLabel for useLocale() — NOT next-intl
```

| Field | Component |
|-------|-----------|
| `details.onlineAccountId` | `Autocomplete` |
| `details.identifier` | `TextField` — `type="email"` if `EMAIL`; `type="text"` if `HANDLE` or `EMAIL_OR_HANDLE` |

**Localization rule:** User field label is **Zone B** — GraphQL returns `identifierLabel: String!` resolved for locale. Component uses that string as MUI `TextField` `label` prop directly.

### Display

```
[logo]  PayPal
        a•••@gmail.com
```

---

## Identifier kind → input mode

| `identifierKind` | Input | Validation hint |
|------------------|-------|-----------------|
| `EMAIL` | `type="email"` | Email format |
| `HANDLE` | `type="text"` | Provider-specific (Zod) |
| `EMAIL_OR_HANDLE` | `type="text"` | Email OR `me/handle` pattern |

---

## Prototype HTML (admin identifier label)

```html
<div data-component="LocalizedStringInput" data-field="identifierLabel" data-required-locales="ar">
  <!-- adornment locale Select + text per row; Add translation button -->
</div>
<p data-component="LocalizedStringDisplay" data-preview="identifierLabel" />
```

---

## Seed examples (prototype copy)

| slug | name (en) | identifierLabel (en) | kind |
|------|-----------|----------------------|------|
| paypal | PayPal | PayPal email or me@paypal.com handle | EMAIL_OR_HANDLE |
| wise | Wise | Wise email or Wise tag | EMAIL_OR_HANDLE |
