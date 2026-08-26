# Emotion RTL Cache & Stylis Prefixer

Canonical rules for Emotion caches used with Arabic (`ar` / RTL). Follow these so we never reintroduce the login-page stylis crash.

## Symptom

```
TypeError: Cannot read properties of undefined (reading 'push')
  at append (stylis/Utility.js)
  at Array.prefixer (stylis/Middleware.js)
  … Emotion insertStyles → MUI TextField / styled / sx
```

Stack often points at an innocent component (e.g. `TextField` in `LoginForm`). The real failure is stylis serializing CSS that contains `::placeholder` while stylis’s `prefixer` plugin is registered on the RTL Emotion cache.

## Root cause

1. `@emotion/cache` vendors **stylis `4.2.0`** and uses its **own forked prefixer** on the default (LTR) path.
2. When `createCache({ stylisPlugins: [...] })` is set, those plugins **replace** Emotion’s defaults.
3. Passing stylis’s exported `prefixer` (especially from a different install than Emotion’s nested stylis, e.g. app `stylis@4.4` vs Emotion `4.2`) makes `prefixer` expand `::placeholder` via `append()`. That hits an uninitialized buffer → `.push` on `undefined`.
4. Known upstream: [stylis#355](https://github.com/thysultan/stylis/issues/355), [stylis#337](https://github.com/thysultan/stylis/issues/337).

## Rules (do / don’t)

### Emotion RTL caches

**Do** register only the RTL plugin:

```ts
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

createCache({
  key: "rtl",
  prepend: true,
  stylisPlugins: [rtlPlugin],
});
```

**Don’t** import or pass stylis’s `prefixer`:

```ts
// BAD — crashes on ::placeholder under RTL
import { prefixer } from "stylis";
stylisPlugins: [prefixer, rtlPlugin];
```

Canonical app cache: `frontend/common/lib/emotion-cache.tsx`.  
Same pattern required in:

- `test/ui/components/TestWrapper.tsx`
- `.storybook/StoryWrapper.tsx`

### `stylis` version

- Keep direct dependency / override at **`stylis@4.2.0`** (exact), matching `@emotion/cache`.
- Do **not** bump to `^4.3` / `^4.4` without re-validating RTL + placeholder styles.

### `::placeholder` in `sx` / `styled`

- Prefer labels over placeholders when possible.
- Avoid `&::placeholder` / `.MuiInputBase-input::placeholder` in Emotion-styled CSS if an RTL cache with stylis `prefixer` is ever reintroduced.
- Prefer native / slot props for placeholder color when needed (`slotProps.htmlInput`, theme input defaults), not stylis-expanded pseudo selectors.

## Quick checklist

- [ ] New Emotion RTL cache? Plugins = `[rtlPlugin]` only — no stylis `prefixer`.
- [ ] Touching `stylis` in `package.json` / overrides? Stay on `4.2.0` unless Emotion upgrades.
- [ ] Adding `::placeholder` in `sx`/`styled`? Confirm RTL login (and any TextField-heavy) pages still render.
- [ ] Updating TestWrapper / StoryWrapper caches? Mirror `emotion-cache.tsx`.

## Related files

| File | Role |
|------|------|
| `frontend/common/lib/emotion-cache.tsx` | App LTR/RTL Emotion caches |
| `test/ui/components/TestWrapper.tsx` | Component-test Emotion caches |
| `.storybook/StoryWrapper.tsx` | Storybook Emotion caches |
| `package.json` (`stylis`, `overrides.stylis`) | Pinned to `4.2.0` |
