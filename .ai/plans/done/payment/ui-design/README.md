# Payment method UI — design principles

One `principle.md` per `PaymentMethodType`. Use these to generate prototype HTML/images.

**Spec:** [../spec.md](../spec.md)  
**Implementation plans:** [../../payment-ui-components/README.md](../../payment-ui-components/README.md) — build shared components first

---

## Shared components (create before catalog views)

No localized-text components exist today. Mirror patterns from `CountrySelect` / `CountryDisplay` and `backend/db/repo/utils/resolve-localized.ts`.

### `frontend/lib/localized-string.ts` (new)

```ts
// Same fallback as backend: request locale → ar (default) → first value → ""
resolveLocalizedString(map, locale): string
setLocalizedString(map, locale, value): LocalizedString
hasRequiredLocalizedValue(map, requiredLocales): boolean
```

Import `AppLocale` / `DEFAULT_CONTENT_LOCALE` from `@/shared/i18n/routing` (same as `backend/types/localized-string.types.ts`).

### `LocalizedStringInput` — `frontend/components/ui/input/LocalizedStringInput.tsx`

**JSONB on the entity row** — no translations table, no locale catalog. Edits a `LocalizedString` map that is saved directly on the parent column (e.g. `supported_mobile_wallets.name`).

**Dynamic rows** — not a fixed ar/en stack:

```
Name *
┌─────────────────────────────────────────────────────────┐
│ [ العربية ▼ ] │ فودافون كاش                         [×] │
└─────────────────────────────────────────────────────────┘
        [ + Add translation ]    ← adds English (or next unused locale)
```

| Part | Implementation |
|------|----------------|
| Locale | MUI `Select` in `InputAdornment` at start of `TextField` |
| Text | Main input; `dir` follows selected locale |
| Remove | `IconButton` end adornment when more than one row |
| Add | `Button` below rows; disabled when all `routing.locales` are used |

| Prop | Purpose |
|------|---------|
| `value` | `LocalizedString` map from JSONB |
| `onChangeAction` | Updated map on each edit |
| `required` / `requiredLocales` | At least one translation; default require `ar` for names |

Full spec: [localized-string/spec.md](../../payment-ui-components/localized-string/spec.md)

### `LocalizedStringDisplay` — `frontend/components/ui/display/LocalizedStringDisplay.tsx`

```ts
type LocalizedStringDisplayProps = {
  value?: LocalizedString | null;
  locale?: string;        // default useLocale()
  fallback?: string;
  typographyVariant?: TypographyProps["variant"];
  sx?: SxProps<Theme>;
};
```

Uses `resolveLocalizedString(value, locale)` — same behavior as list/grid resolved GraphQL strings, but for raw maps (admin preview, snapshot debug).

Export from `frontend/components/ui/display/index.ts`.

### Other existing UI to reuse

| Need | Component | Path |
|------|-----------|------|
| Country | `CountrySelect` / `CountryDisplay` | `frontend/components/ui/input/CountrySelect.tsx` |
| Country names | `getCountryDisplayName(code, locale)` | `@/frontend/lib/locale` |
| Tags (URL allowlist) | `TagInput` | `frontend/components/ui/input/TagInput.tsx` |
| Image upload | Pattern from `AvatarUploadDialog` | preview + `FileReader` + size/type guard |
| Dropzone | `ResourceUploadDropzone` | optional for catalog logo |
| Snackbars | `useNotifications()` | `@toolpad/core/useNotifications` via `DashboardClientBridge` |
| Timezone picker | `TimezoneSelect` | same input/display split pattern |

**Phone:** No `PhoneInput` in `frontend/components/ui` yet. User method forms use `TextField` `type="tel"` `dir="ltr"` + Zod E.164; placeholder from catalog `phoneExample`. Admin `phoneRegion` defaults from `CountrySelect` (same ISO code).

**Currency:** No `CurrencySelect` yet — admin catalog uses MUI `Select` with GraphQL `CurrencyCode` enum options (add alongside payment work).

### Notifications pattern (all admin catalog containers)

```ts
const notifications = useNotifications();
const t = useTranslations("dashboard.paymentCatalog.actions");

// success
notifications.show(t("saveSuccess"), { severity: "success", autoHideDuration: 4000 });
// error
notifications.show(t("saveError"), { severity: "error", autoHideDuration: 5000 });
// upload error
notifications.show(t("logoUploadFailed"), { severity: "error", autoHideDuration: 5000 });
```

Precedent: `TeacherProfileContainer.tsx`, `AdminSuggestionsContainer.tsx`.

---

## Principle index

| Type | Directory | Surfaces |
|------|-----------|----------|
| `MOBILE_WALLET` | [mobile-wallet](./mobile-wallet/principle.md) | Admin catalog CRUD + user save method |
| `PAYMENT_LINK` | [payment-link](./payment-link/principle.md) | Admin catalog CRUD + user save method |
| `ONLINE_ACCOUNT` | [online-account](./online-account/principle.md) | Admin catalog CRUD + user save method |
| `BANK_TRANSFER` | [bank-transfer](./bank-transfer/principle.md) | User save method only (no catalog) |
| `CASH` | [cash](./cash/principle.md) | User save method only |

Admin views live under `frontend/views/dashboard/admin/payment-catalogs/`. User method forms use shared `PaymentMethodTypeFields` dispatcher calling the same field groups documented per type.

---

## Payment direction (in / out / both)

Applies to **user methods** (`user_payment_methods.direction`) and **catalog** (`supportedDirections` on wallet/link/platform rows).

| Stored enum | UI label | Meaning |
|-------------|----------|---------|
| `PAYIN` | **In** | Pay-in only — e.g. parent paying fees |
| `PAYOUT` | **Out** | Pay-out only — e.g. teacher salary disbursement |
| `BOTH` | **Both** | Same method/catalog row valid for in and out |

- Admin catalog dialogs: `Select` or `RadioGroup` with localized In / Out / Both (not `PAYIN` literals)
- User method form: same control on create; filters catalog pickers (`supported*Wallets(…, direction)`)
- Catalog picker chips: show In / Out / Both per row
- Default badges remain separate: “Default for pay in” / “Default for pay out” (1bA); a `BOTH` method can hold both defaults

i18n: `ui.paymentMethod.direction.in` | `.out` | `.both`
