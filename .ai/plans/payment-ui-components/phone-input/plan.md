# Phone Input UI — Plan

See [spec.md](./spec.md).

## Architecture

```
frontend/lib/phone.ts
        │
        ├── PhoneInput   (TextField + parse/format)
        └── PhoneDisplay (Typography + format/mask)
```

## Phase pipeline

| Phase | Work | Gate |
|-------|------|------|
| 1 | `frontend/lib/phone.ts` + tests | unit tests |
| 2 | `PhoneDisplay` + stories | Storybook |
| 3 | `PhoneInput` + stories | Storybook |
| 4 | i18n + exports + lint | sub-loop |

## Patterns to copy

| From | Copy |
|------|------|
| `TimezoneSelect.tsx` | controlled value, `onChangeAction`, `onBlurAction`, `fullWidth` |
| `TimezoneDisplay.tsx` | `useLocale()`, fallback, Typography |
| `backend/lib/phoneNumber.ts` | E.164 semantics (reference only) |

## File list

| File | Action |
|------|--------|
| `frontend/lib/phone.ts` | Create |
| `frontend/lib/phone.test.ts` | Create |
| `frontend/components/ui/input/PhoneInput.tsx` | Create |
| `frontend/components/ui/input/PhoneInput.stories.tsx` | Create |
| `frontend/components/ui/display/PhoneDisplay.tsx` | Create |
| `frontend/components/ui/display/PhoneDisplay.stories.tsx` | Create |
| `frontend/components/ui/input/index.ts` | Update |
| `frontend/components/ui/display/index.ts` | Update |
| `shared/messages/types/ui/phone-input.ts` | Create |
| `shared/messages/ar/ui/phone-input.ts` | Create |
| `shared/messages/en.ts` | Update |

## Dependency check (Phase 1 first task)

- If `google-libphonenumber` not in frontend bundle, add dependency or use existing `libphonenumber-js` per bundle size review
