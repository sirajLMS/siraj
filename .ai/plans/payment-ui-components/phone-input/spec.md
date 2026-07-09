# Phone Input UI — Specification

**Status:** Planning  
**Blocks:** User `MOBILE_WALLET` method forms, profile phone fields (optional adoption)  
**Design:** [mobile-wallet principle](../payment/ui-design/mobile-wallet/principle.md)

---

## Problem

Phone appears as plain `TextField` across profiles and onboarding. Payment wallets require **E.164** with optional **region hint** (`phoneRegion` from catalog). No shared `PhoneInput` / `PhoneDisplay` in `frontend/components/ui`.

Backend has `backend/lib/phoneNumber.ts` (google-libphonenumber) — frontend needs client-side formatting/validation for UX, server remains authoritative.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Components | `PhoneInput`, `PhoneDisplay` |
| Library | `google-libphonenumber` (add to frontend bundle if not already reachable) or `libphonenumber-js` if already in package.json — **check package.json at implementation** |
| Value | E.164 string (`+201012345678`) in `onChangeAction` |
| Default region | Prop `defaultRegion?: string` (ISO 3166-1 alpha-2, e.g. `EG`) for parsing partial input |
| Display | `PhoneDisplay` — formatted national/international per `useLocale()`; optional `masked` prop |
| Direction | Input always `dir="ltr"` |
| MUI | `TextField` `type="tel"` `inputMode="tel"` |

## `PhoneInput` API

```ts
export type PhoneInputProps = {
  readonly value: string | null;
  readonly onChangeAction: (e164: string | null) => void;
  readonly onBlurAction?: () => void;
  readonly defaultRegion?: string;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
};
```

## `PhoneDisplay` API

```ts
export type PhoneDisplayProps = {
  readonly phone?: string | null;
  readonly masked?: boolean;
  readonly defaultRegion?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};
```

Masking pattern (when `masked`): align with payment spec — libphonenumber national format with middle digits hidden, or `+20 ••• ••• 4567`.

## Lib

`frontend/lib/phone.ts`:

- `formatPhoneDisplay(e164, locale?, options?)`
- `maskPhone(e164)`
- `parsePhoneToE164(input, defaultRegion?)` → `{ e164, valid, error? }`
- `isPhoneValidForRegion(e164, region)`

## Storybook

- Egypt default region, valid number
- Saudi region
- Invalid number → error helper
- `PhoneDisplay` masked vs full
- Arabic globals (label RTL, input LTR)
- Empty value

## Acceptance criteria

1. `PhoneInput` emits E.164 on valid blur/change
2. `defaultRegion` used when user omits country code
3. `PhoneDisplay` masked mode never shows full number
4. Stories for en + ar
5. Exported from input/display index
6. Unit tests for `frontend/lib/phone.ts`

## Out of scope

- SMS OTP / verification
- Country flag inside phone input (v2 — could combine with `CountrySelect`)
