# Test Mock Navigation Helpers

## Overview

15 UI component test files repeat a ~40-line `mock.module("next/navigation")` block with near-identical structure. This pattern extracts the shared mock setup into a reusable `mockNextNavigation()` helper using Bun's async `mock.module()` API.

## Files

| File | Purpose |
|------|---------|
| `test/ui/components/helpers/mockNavigation.tsx` | `mockNextNavigation()` helper |
| `test/ui/components/fixtures/studentHistoryFixtures.ts` | Typed test fixtures |
| `test/ui/components/helpers/sessionActivateButtonTests.ts` | `makeSessionActivateButtonTests()` factory |
| 15 consumer test files | Import and call the helper |

## Pattern Details

### mockNextNavigation

```typescript
async function mockNextNavigation(pathname?: string, opts?: MockNavigationOptions): Promise<void>;
```

Mocks three modules:
1. `next/navigation` — `usePathname`, `useRouter`, `useParams`, `redirect`, `useSearchParams`
2. `@/shared/i18n/routing` — routing config
3. `@/shared/i18n/navigation` — locale-aware `Link` component

### Options

| Option | Default | Purpose |
|--------|---------|---------|
| `includeRouter` | `true` | Mock `useRouter` with 4 or 6 methods |
| `includeI18nMocks` | `true` | Mock `@/shared/i18n/routing` + `navigation` |
| `includeRedirect` | `true` | Mock `redirect` function |
| `includeSearchParams` | `false` | Mock `useSearchParams` |
| `routingIncludeReplaceAndPrefetch` | `false` | Include `replace`/`prefetch` in router mock |
| `includeReplaceAndPrefetch` | `false` | Include in `useRouter` mock |
| `mockPush` | — | Custom `push` implementation |

### Usage Example

```typescript
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

beforeEach(async () => {
  await mockNextNavigation("/dashboard");
});
```

## Key Design Decisions

1. **`.tsx` extension** — helper contains JSX (`LinkComponent` mock), requiring `.tsx` despite being a test utility.

2. **Bun's async `mock.module()`** (not Vitest's `vi.mock()`) — the actual codebase uses `bun:test`; the helper is `async` and callers must `await` it.

3. **Three modules mocked** (not just `next/navigation`) — `@/shared/i18n/routing` and `@/shared/i18n/navigation` are also mocked in 14/15 files. The `includeI18nMocks` option controls this.

4. **`DEFAULT_OPTS` module-level constant** — satisfies oxlint `no-object-type-as-default-prop` rule (no object literal defaults).

5. **`mock` import from `bun:test` retained in consumers** — consumer files still import `mock` for other `mock.module()` calls (e.g., `useLanguageSwitch`, `next/link`, `RequirePermission`).

6. **UI tests intentionally NOT run** — purely mechanical extraction; mock behavior is identical to the original inline blocks.

## Stats

- **Lines eliminated:** ~565 lines of duplicated mock setup
- **Files reduced:** 15 test files
- **Net reduction:** 562 lines
