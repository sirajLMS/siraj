# UI Component Test Rules (`test/ui/components/`)

Happy DOM component tests: no server, no browser, mocked Apollo. The full test-writing rules (translation rules, `TestWrapper`, preloads, Apollo mocks, MUI v9 gotchas) live in `test/ui/AGENTS.md` — read those first. This file covers **directory organization only**.

## Running

```bash
bun run test:ui:components        # full suite (preloads live at this dir's root)
bun run test/scripts/run-test.ts test/ui/components/<domain>/<file>.test.tsx  # single file
```

The suite globs this whole directory; preloads are referenced by root path (`test/ui/components/happydom-preload.ts`, etc.), so moving tests between domain dirs never breaks the runner.

## Directory Layout (CRITICAL)

Test files are organized **one subdirectory per domain**, mirroring the component's frontend domain:

- Mirror `frontend/common/views/dashboard/<domain>` / `frontend/common/components/<domain>` (plus the `frontend/desktop/` and `frontend/mobile/` surfaces of the same domain).
- Domain dirs may nest where the frontend domains nest (e.g. `<domain>/<subdomain>/`).

### Rules

1. **New test files MUST go into the matching domain subdirectory** — never add a test file as a direct child of `test/ui/components/`.
2. **New domain → create the subdirectory**, using the same name as the frontend domain dir. A domain with a single test file still gets its own dir.
3. **Direct children of this dir are shared test infrastructure only** — never test files:
   - `TestWrapper.tsx` — Apollo + locale wrapper (import as `@/test/ui/components/TestWrapper`)
   - `happydom-preload.ts`, `translation-preload.ts`, `next-dynamic-mock.ts` — runner preloads
   - `jest-dom.d.ts` — matcher type declarations
4. **Cross-domain shared assets**:
   - `helpers/` — shared mocks and reusable test logic
   - `fixtures/` — shared test data shapes
   - Keep these domain-agnostic. Domain-specific fixtures/helpers belong inside the matching domain dir.
5. Moving a file between domain dirs requires **no import changes** — everything uses `@/` aliases.

## Naming Conventions

- `*.test.ts` / `*.test.tsx` — standard tests
- `{name}.desktop.test.tsx` / `{name}.mobile.test.tsx` — platform variants of the same component
- `{name}.tier.test.tsx` / `{name}.tiers.test.tsx` — permission-tier variants
- Test file name matches the component/module under test (`{ComponentName}.test.tsx` ↔ `{ComponentName}.tsx`).
