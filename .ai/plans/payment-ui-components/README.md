# Payment UI — shared components (master index)

Implement these **before** payment catalog views and `PaymentMethod*` feature components. Each subdirectory is a standalone plan with `spec.md`, `plan.md`, and `tasks.md`.

**Design reference:** [../payment/ui-design/README.md](../payment/ui-design/README.md)  
**Feature spec (later):** [../payment/spec.md](../payment/spec.md)

---

## Implementation order

```
1. localized-string     ← no dependencies; blocks admin catalog forms
2. catalog-image-upload ← no dependencies; used by all 3 catalog types
3. phone-input          ← no GraphQL; used by user wallet methods + profiles
4. currency-select      ← needs currency list constant (no payment backend required)
```

**Already exist — do not re-plan:** `CountrySelect`, `CountryDisplay`, `TagInput`, `useNotifications`, `LanguageSelector`, `LanguageDisplay`.

**Blocked on payment GraphQL (separate feature plan):** `PaymentMethodSelect`, `PaymentMethodDisplay`, `PaymentMethodTypeFields`, `PaymentMethodList`, `PaymentMethodDefaultsEditor`, admin catalog containers.

---

## Plans

| Plan | Path | Delivers |
|------|------|----------|
| Localized string | [localized-string/](./localized-string/) | JSONB map lib + dynamic-row `LocalizedStringInput` (adornment locale Select + Add translation) + `LocalizedStringDisplay` |
| Catalog image upload | [catalog-image-upload/](./catalog-image-upload/) | `CatalogImageUpload` field (preview + pick + validate) |
| Phone input | [phone-input/](./phone-input/) | `PhoneInput`, `PhoneDisplay`, E.164 formatting |
| Currency select | [currency-select/](./currency-select/) | `CurrencySelect`, `CurrencyDisplay`, `frontend/lib/currency.ts` |

---

## Conventions (all plans)

- Mirror **TimezoneSelect / TimezoneDisplay** and **CountrySelect / CountryDisplay** file layout
- `"use client"` on interactive components
- Props: `onChangeAction` / `setXAction` naming (existing input components)
- MUI v9: styles in `sx`, icons `*Outlined`
- Storybook: `tags: ["ai-generated"]`, stories for `en` + `ar` globals
- i18n: `shared/messages` under `ui.<componentName>`
- `@/` imports only
- No `console.*` — `logger` if needed
- Export from `frontend/components/ui/input/index.ts` and `display/index.ts`

---

## Verification (per plan)

```bash
bun tsgo
bun biome:check
# lint queue for touched files
bun run test:ui:components  # when component tests added
# Storybook: Vitest story tests per existing UI pattern
```

Final gate after all four: `bun run scripts/health/sub-loop.ts <file> --lifecycle lint` per new file.
