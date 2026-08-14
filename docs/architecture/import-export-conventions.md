# Import/Export Conventions

## Overview

This document defines the canonical rules for `index.ts` barrel files and import/export patterns across the Siraj codebase. These rules were established during the re-export elimination effort (66 batches + 8 cleanup batches) that reduced code duplicates from 528 to 12 clones (97.7% reduction).

## The 7 Rules for `index.ts` Barrel Files

### Rule 1: Same-directory exports only

`index.ts` files MAY ONLY export from files in the SAME directory using `./` relative paths.

```ts
// ✅ CORRECT — same directory
export * from "./requests";
export * from "./validate";

// ❌ WRONG — cross-directory @/ path
export * from "@/backend/services/communication/channels/requests";

// ❌ WRONG — cross-directory ../ path
export * from "../shared/constants";
```

### Rule 2: `export *` over named exports

`index.ts` files MUST use `export * from "./file"` instead of `export { A, B } from "./file"`.

```ts
// ✅ CORRECT
export * from "./requests";

// ❌ WRONG — use export * instead
export { buildRequest, parseResponse } from "./requests";
```

**Exception**: When `export *` causes a naming collision (TS2308 or ESLint `import-x/export`), keep `export { }` for the colliding symbol. Document the exception in `.ai/plans/reexport-elimination/outcome/collisions-registry.md`.

### Rule 3: `export type { }` stays as-is

`export type { X } from "./file"` is NOT converted to `export *`. Type-only re-exports are intentional and keep type semantics explicit.

```ts
// ✅ CORRECT — keep as-is
export type { MeetingConfigDetails } from "./meeting-config-base.types";

// ❌ WRONG — don't convert type-only re-exports
export * from "./meeting-config-base.types";
```

### Rule 4: `./` paths only — no `@/` or `../`

`index.ts` exports MUST use `./` relative paths. No `@/` path aliases or `../` parent paths.

```ts
// ✅ CORRECT
export * from "./EmailChannelFactory";

// ❌ WRONG
export * from "@/backend/services/communication/channels/email/EmailChannelFactory";
```

### Rule 5: No re-export shims

Files that only re-export from another directory are prohibited. Consumers must import directly from the original source.

```ts
// ❌ WRONG — shim file (should be deleted)
export { Foo } from "@/other/dir/foo";

// ✅ CORRECT — consumers import from original source
import { Foo } from "@/other/dir/foo";
```

### Rule 6: Aggregator barrels are allowed

A parent `index.ts` CAN use `export * from "./subdir"` (pointing to a direct subdirectory's barrel file). This is how aggregator barrels work.

```ts
// ✅ CORRECT — parent barrel aggregating subdirectory barrels
export * from "./email";
export * from "./sms";
export * from "./push";
```

### Rule 7: Max one `/` per path

Each `export * from` path in an `index.ts` MUST NOT contain more than one `/`.

```ts
// ✅ CORRECT — one /
export * from "./requests";

// ❌ WRONG — two /
export * from "./requests/get-phone-number.request";
```

## Import Conventions

### Shortest import path

Always import from the highest available barrel (e.g. `@/backend/services`, not `@/backend/services/communication/channels/whatsapp/cloud-api`).

### `@/` for imports, `./` for barrel exports

- **Imports** in regular `.ts`/`.tsx` files use `@/` path aliases: `import { logger } from "@/backend/lib"`
- **Exports** in `index.ts` files use `./` relative paths: `export * from "./requests"`

### `export type { }` vs `export *` in non-index files

Non-index `.ts` files (like `*.types.ts`) MAY use `export type { X } from "./other-file"` to re-export types that consumers expect to find in that module. This is a cross-file type re-export, not a barrel pattern, and is allowed for type ergonomics.

## Collision Registry

When `export *` causes a naming collision, the exception is documented in:
`.ai/plans/reexport-elimination/outcome/collisions-registry.md`

Common collision patterns:
1. **Type + value from same file**: Source file exports both a type and a value with related names; `export *` + explicit `export type { }` from same file triggers ESLint `import-x/export`
2. **Alias exports**: `export { X as Y } from "./file"` cannot use `export *` (aliases not supported)
3. **Default exports**: `export { default as X } from "./file"` cannot use `export *`
4. **Multiple sources exporting same symbol**: Two files in the same directory both export `Foo` — `export *` from both causes TS2308

## Verification

After modifying any `index.ts` file, verify with:
```bash
bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
```

For global verification:
```bash
bun tsgo                    # Must be 0 errors
bun check:duplicates        # Verify clone count stays low
grep -rl "export.*from.*@/" --include="index.ts" . | grep -v node_modules  # Must be empty
grep -rl "export.*from.*\.\./" --include="index.ts" . | grep -v node_modules  # Must be empty
```
