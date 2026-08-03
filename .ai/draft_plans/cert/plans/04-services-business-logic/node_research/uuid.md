# uuid v14.0.1 — Node Module Research

## Package Overview

- **Package**: `uuid` v14.0.1
- **License**: MIT
- **Description**: RFC9562 UUIDs (formerly RFC4122)
- **Module Type**: ESM only (`"type": "module"`)
- **Zero dependencies**: No runtime dependencies
- **Tree-shakable**: `"sideEffects": false`
- **TypeScript**: Full type definitions included (`./dist/index.d.ts`)
- **Bin**: CLI utility `uuid` (default generates v4)
- **Supported environments**: Node.js (LTS + one prior), modern browsers, React Native/Expo (with polyfill)
- **Repository**: https://github.com/uuidjs/uuid

### Exports Map (package.json)

```json
{
  "exports": {
    ".": {
      "node": {
        "types": "./dist/index.d.ts",
        "default": "./dist-node/index.js"
      },
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  }
}
```

- **Node.js**: Uses `dist-node/` build (leverages `node:crypto` for SHA-1/MD5 hashing in v3/v5)
- **Browsers/other**: Uses `dist/` build (pure JS, uses Web Crypto API `crypto.getRandomValues`)
- Both builds export identical named exports

## TypeScript Types & Interfaces

All types are exported from `uuid/dist/types.d.ts` and re-exported via `export type * from './types.js'` in the main index.

### `UUIDTypes<TBuf extends Uint8Array = Uint8Array>`

```typescript
export type UUIDTypes<TBuf extends Uint8Array = Uint8Array> = string | TBuf;
```

The generic union type representing a UUID as either a string or a byte buffer. Used as return type for functions that can return either format depending on whether a `buffer` argument is provided.

### `Version1Options` (v1, v6)

```typescript
export type Version1Options = {
  node?: Uint8Array;       // RFC "node" field — Array[6] of byte values (0-255)
  clockseq?: number;       // RFC "clock sequence" — Number 0 to 0x3fff
  random?: Uint8Array;     // Array of 16 random bytes (0-255) used to generate other fields
  rng?: () => Uint8Array;  // Alternative to `random` — function returning 16 random bytes
  msecs?: number;         // RFC "timestamp" — Number of milliseconds (unix epoch)
  nsecs?: number;         // RFC "timestamp" — nanoseconds to add to msecs (0-10000)
  _v6?: boolean;          // Internal flag for v6 generation (not for public use)
};
```

### `Version4Options` (v4)

```typescript
export type Version4Options = {
  random?: Uint8Array;     // Array of 16 random bytes (0-255)
  rng?: () => Uint8Array;  // Alternative to `random` — function returning 16 random bytes
};
```

### `Version6Options` (v6)

```typescript
export type Version6Options = Version1Options;
```

Identical to `Version1Options`. v6 is a reordered version of v1 and accepts the same options.

### `Version7Options` (v7)

```typescript
export type Version7Options = {
  random?: Uint8Array;     // Array of 16 random bytes (0-255)
  msecs?: number;          // RFC "timestamp" — Number of milliseconds (unix epoch)
  seq?: number;            // 32-bit sequence Number (0 to 0xffffffff) for same-ms uniqueness
  rng?: () => Uint8Array;  // Alternative to `random` — function returning 16 random bytes
};
```

### `NonSharedArrayBuffer`

```typescript
export type NonSharedArrayBuffer = ReturnType<typeof Uint8Array.of>;
```

Return type of `parse()` — a `Uint8Array` that is not backed by a `SharedArrayBuffer`.

### V1State (internal, exported for testing)

```typescript
type V1State = {
  node?: Uint8Array;
  clockseq?: number;
  msecs?: number;
  nsecs?: number;
};
```

### V7State (internal, exported for testing)

```typescript
type V7State = {
  msecs?: number;
  seq?: number;
};
```

### Note: No `v3Options` or `v5Options` types

v3 and v5 do **not** take an options object. They take `(value, namespace, buffer?, offset?)` directly. There are no `v3Options` or `v5Options` types in the package.

## Available Functions (v1-v7, validate, version, parse, stringify)

All functions are **named exports** from the main entry point. There is **no default export** at the package level — each function is its own default export re-exported as a named export.

### `v1(options?, buffer?, offset?)` — Version 1 (Timestamp) UUID

```typescript
declare function v1(options?: Version1Options, buf?: undefined, offset?: number): string;
declare function v1<TBuf extends Uint8Array = Uint8Array>(
  options: Version1Options | undefined, buf: TBuf, offset?: number
): TBuf;
```

- **Algorithm**: Timestamp-based (60-bit Gregorian timestamp + 14-bit clock sequence + 48-bit node ID)
- **Without options**: Uses internal state to ensure uniqueness across calls (monotonic within same millisecond via nsecs counter)
- **With options**: Internal state is **NOT** used; appropriate defaults applied from provided values
- **Throws**: `Error` if more than 10M UUIDs/sec are requested (nsecs overflow)
- **Returns**: UUID string, or `TBuf` if buffer provided
- Also exports `updateV1State(state, now, rnds)` for manual state management

### `v3(value, namespace, buffer?, offset?)` — Version 3 (MD5 Namespace) UUID

```typescript
declare function v3(value: string | Uint8Array, namespace: UUIDTypes, buf?: undefined, offset?: number): string;
declare function v3<TBuf extends Uint8Array = Uint8Array>(
  value: string | Uint8Array, namespace: UUIDTypes, buf: TBuf, offset?: number
): TBuf;
```

- **Algorithm**: MD5 hash of namespace UUID concatenated with name
- **Deterministic**: Same `(name, namespace)` always produces the same UUID
- **Predefined namespaces**: `v3.DNS` = `'6ba7b810-9dad-11d1-80b4-00c04fd430c8'`, `v3.URL` = `'6ba7b811-9dad-11d1-80b4-00c04fd430c8'`
- **RFC preference**: SHA-1 (v5) is preferred over MD5 (v3) when backward compatibility is not an issue
- **Node build**: Uses `node:crypto` `createHash('md5')`
- **Returns**: UUID string, or `TBuf` if buffer provided

### `v4(options?, buffer?, offset?)` — Version 4 (Random) UUID

```typescript
declare function v4(options?: Version4Options, buf?: undefined, offset?: number): string;
declare function v4<TBuf extends Uint8Array = Uint8Array>(
  options: Version4Options | undefined, buf: TBuf, offset?: number
): TBuf;
```

- **Algorithm**: Fully random (version/variant bits set per RFC)
- **Fast path**: When called with no arguments and `crypto.randomUUID` is available, delegates to the native implementation (fastest)
- **Custom random**: Provide `options.random` (Uint8Array of 16 bytes) or `options.rng` (function returning 16 bytes) for deterministic/test UUIDs
- **Throws**: `Error('Random bytes length must be >= 16')` if random bytes too short; `RangeError` if buffer offset out of bounds
- **Returns**: UUID string, or `TBuf` if buffer provided

### `v5(value, namespace, buffer?, offset?)` — Version 5 (SHA-1 Namespace) UUID

```typescript
declare function v5(value: string | Uint8Array, namespace: UUIDTypes, buf?: undefined, offset?: number): string;
declare function v5<TBuf extends Uint8Array = Uint8Array>(
  value: string | Uint8Array, namespace: UUIDTypes, buf: TBuf, offset?: number
): TBuf;
```

- **Algorithm**: SHA-1 hash of namespace UUID concatenated with name
- **Deterministic**: Same `(name, namespace)` always produces the same UUID
- **Predefined namespaces**: `v5.DNS` = `'6ba7b810-9dad-11d1-80b4-00c04fd430c8'`, `v5.URL` = `'6ba7b811-9dad-11d1-80b4-00c04fd430c8'`
- **Preferred** over v3 per RFC
- **Node build**: Uses `node:crypto` `createHash('sha1')`
- **Returns**: UUID string, or `TBuf` if buffer provided

### `v6(options?, buffer?, offset?)` — Version 6 (Reordered Timestamp) UUID

```typescript
declare function v6(options?: Version6Options, buf?: undefined, offset?: number): string;
declare function v6<TBuf extends Uint8Array = Uint8Array>(
  options: Version6Options | undefined, buf: TBuf, offset?: number
): TBuf;
```

- **Algorithm**: Same as v1 but with timestamp bits reordered for natural lexical sorting (newer UUIDs sort after older ones as strings)
- **Internally**: Calls `v1({ ...options, _v6: true })` then applies `v1ToV6()` transformation
- **Same options** as `v1()`
- **Returns**: UUID string, or `TBuf` if buffer provided

### `v7(options?, buffer?, offset?)` — Version 7 (Unix Timestamp + Random) UUID

```typescript
declare function v7(options?: Version7Options, buf?: undefined, offset?: number): string;
declare function v7<TBuf extends Uint8Array = Uint8Array>(
  options: Version7Options | undefined, buf: TBuf, offset?: number
): TBuf;
```

- **Algorithm**: First 48 bits = Unix timestamp (ms), remaining bits = random + sequence counter
- **Time-sortable**: UUIDs generated in sequence will sort chronologically (lexicographic sort matches chronological sort)
- **Without options**: Uses internal state with auto-incrementing `seq` counter for same-millisecond uniqueness
- **With options**: Internal state is NOT used; `options.seq` can be provided for custom sequence control
- **Sequence handling**: Auto-increments `seq` when within same millisecond; wraps at 32-bit boundary (increments `msecs` on wrap)
- **Also exports**: `updateV7State(state, now, rnds)` for manual state management
- **Returns**: UUID string, or `TBuf` if buffer provided

### `validate(uuid)` — Check if Valid UUID

```typescript
declare function validate(uuid: unknown): boolean;
```

- **Accepts**: Any value (type is `unknown`)
- **Returns**: `true` if the value is a string matching the UUID regex, `false` otherwise
- **Regex** (case-insensitive): `/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i`
- **Validates**: versions 1-8, NIL UUID (all zeros), MAX UUID (all ones)
- **Non-string input**: Returns `false` (not throw)

### `version(uuid)` — Get UUID Version Number

```typescript
declare function version(uuid: string): number;
```

- **Accepts**: A UUID string (must be valid)
- **Returns**: The RFC version number (1-8) extracted from position 14 (the version nibble)
- **Throws**: `TypeError('Invalid UUID')` if input is not valid
- **Special cases**: Returns `0` for NIL UUID, `15` for MAX UUID

### `parse(uuid)` — Parse UUID String to Bytes

```typescript
declare function parse(uuid: string): NonSharedArrayBuffer;
```

- **Accepts**: A UUID string (must be valid)
- **Returns**: `Uint8Array(16)` of byte values (left-to-right order matching hex pairs in the UUID string)
- **Throws**: `TypeError('Invalid UUID')` if input is not valid

### `stringify(arr, offset?)` — Convert Bytes to UUID String

```typescript
declare function stringify(arr: Uint8Array, offset?: number): string;
```

- **Accepts**: `Uint8Array` (or array-like) of 16 bytes, with optional offset
- **Returns**: UUID string (lowercase, with hyphens)
- **Throws**: `TypeError('Stringified UUID is invalid')` if resulting string fails validation
- **Also exports**: `unsafeStringify(arr, offset?)` — same but without validation check (used internally for performance)

### `NIL` — Nil UUID Constant

```typescript
declare const _default: "00000000-0000-0000-0000-000000000000";
```

The special "nil" UUID (all zeros), as defined in RFC9562.

### `MAX` — Max UUID Constant

```typescript
declare const _default: "ffffffff-ffff-ffff-ffff-ffffffffffff";
```

The special "max" UUID (all ones), as defined in RFC9562. New in uuid@9.1.

### `v1ToV6(uuid)` — Convert v1 UUID to v6

```typescript
export default function v1ToV6(uuid: string): string;
export default function v1ToV6(uuid: Uint8Array): NonSharedArrayBuffer;
```

Converts a version 1 UUID to a version 6 UUID (reordered timestamp). Preserves input type (string in → string out, bytes in → bytes out). New in uuid@10.

### `v6ToV1(uuid)` — Convert v6 UUID to v1

```typescript
export default function v6ToV1(uuid: string): string;
export default function v6ToV1(uuid: Uint8Array): Uint8Array;
```

Converts a version 6 UUID back to a version 1 UUID. Preserves input type. New in uuid@10.

### `REGEX` — UUID Validation Regular Expression

```typescript
declare const _default: RegExp;
```

The regex used internally by `validate()`. Exported but not commonly used directly. Pattern:
```
/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i
```

## v14 Breaking Changes

### 1. ESM Only — No CommonJS Support (since uuid@12)

```
> [!NOTE]
> Starting with `uuid@12` CommonJS is no longer supported.
```

- **Breaking**: `require('uuid')` no longer works. Must use `import { v4 } from 'uuid'`.
- This is the most significant breaking change for projects using CommonJS.
- The package.json has `"type": "module"` and only provides `.js` files (no `.cjs`).

### 2. No Default Export at Package Level

The main entry point (`index.js`) only provides **named exports** — there is no `export default`. Each function (`v1`, `v3`, `v4`, `v5`, `v6`, `v7`, `validate`, `version`, `parse`, `stringify`, `NIL`, `MAX`, `v1ToV6`, `v6ToV1`) is imported as a named export:

```javascript
// Correct
import { v4 as uuidv4 } from 'uuid';

// Also correct
import * as uuid from 'uuid';
uuid.v4();

// INCORRECT — no default export exists
// import uuid from 'uuid'; // ❌ SyntaxError in strict ESM
```

### 3. `options` Handling Change for Timestamp UUIDs (since uuid@11)

Prior to `uuid@11`, passing `options` to timestamp-based functions (`v1()`, `v6()`, `v7()`) could interfere with internal state used for uniqueness. Starting with `uuid@11`:

- **Without `options`**: Internal state is used to ensure uniqueness (monotonic counter, auto-managed node/clockseq).
- **With `options`**: Internal state is **NOT** used; all values come from provided options (with defaults applied for unspecified fields).

This means if you pass `{}` or any options object, you bypass the internal uniqueness mechanism — even if all fields are undefined. Only call without arguments entirely to get the internal state behavior.

### 4. RFC9562 (formerly RFC4122)

The package description changed from "RFC4122" to "RFC9562" reflecting the updated RFC standard. Key additions in RFC9562:
- **v6** (reordered timestamp) — added in uuid@10
- **v7** (Unix timestamp + random) — added in uuid@10
- **MAX UUID** — added in uuid@9.1

### 5. Version History Summary

| Version | Key Changes |
|---------|------------|
| uuid@8.3 | Added `NIL`, `parse()`, `stringify()`, `validate()`, `version()` |
| uuid@9.0 | Switched from `node` built-in util to `crypto` API |
| uuid@9.1 | Added `MAX` UUID constant |
| uuid@10 | Added `v6()`, `v7()`, `v1ToV6()`, `v6ToV1()` — full RFC9562 support |
| uuid@11 | Fixed `options` argument interference with internal state for timestamp UUIDs |
| uuid@12 | **Dropped CommonJS support** — ESM only |
| uuid@14 | Current version (14.0.1) — no additional breaking changes from 12/13 |

### 6. v4 Fast Path (crypto.randomUUID)

When `v4()` is called with **no arguments** and `crypto.randomUUID` is available (Node 19+, modern browsers), it delegates to the native `crypto.randomUUID()` which is significantly faster than the polyfill implementation. This is an optimization, not a breaking change, but means the exact same code path may vary between environments.

## Certificate Use Cases

### v4 — Random Certificate Codes (Recommended Default)

```typescript
import { v4 as uuidv4 } from 'uuid';

// Generate a random certificate code
const certificateCode = uuidv4();
// Example: 'b18794e8-5d0d-417c-b361-ba38e78411b4'
```

**Why v4 for certificate codes:**
- **Uniqueness**: 122 bits of randomness → collision probability is negligible
- **No metadata leaked**: Unlike v1/v7, v4 UUIDs don't contain timestamps — certificate codes don't reveal when they were issued
- **Standard**: Most widely recognized UUID format; all ecosystems support it
- **Fastest**: Uses native `crypto.randomUUID()` when available (zero overhead)
- **Opaque**: No pattern for attackers to predict or enumerate certificates

**For user-facing certificate codes** (if you want shorter/pretty codes), consider using `v4()` + custom formatting, or a different approach entirely (short random hex strings). But for internal certificate IDs stored in the database, v4 is ideal.

### v7 — Time-Sortable Batch Job IDs

```typescript
import { v7 as uuidv7 } from 'uuid';

// Generate a time-sortable batch job ID
const batchJobId = uuidv7();
// Example: '01941f29-7c00-75f4-a310-744d2167fc5b'
// First 12 hex digits encode the Unix timestamp in ms
```

**Why v7 for batch job IDs:**
- **Time-sortable**: Lexicographic sorting == chronological sorting. Database indexes and B-tree scans are efficient when keys are monotonically increasing.
- **No index fragmentation**: Unlike v4, v7 UUIDs insert in timestamp order → minimal page splits in PostgreSQL indexes.
- **Extractable timestamp**: First 48 bits = Unix ms timestamp. You can recover the creation time without a separate `created_at` column (though you should still have one for querying).
- **Same-ms uniqueness**: Internal `seq` counter auto-increments for UUIDs generated within the same millisecond — safe for burst generation.
- **Ideal for**: `batch_jobs` table primary key, job queue IDs, sequential processing pipeline IDs.

**Timestamp extraction from v7:**
```typescript
import { v7 as uuidv7 } from 'uuid';

const id = uuidv7();
// First 12 hex chars = 48-bit Unix ms timestamp
const timestamp = parseInt(id.slice(0, 12), 16);
const date = new Date(timestamp);
```

### v5 — Deterministic IDs from Namespace

```typescript
import { v5 as uuidv5 } from 'uuid';

// Define a custom namespace for your certificate system
const CERT_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

// Generate a deterministic certificate ID from a name
// Same (name, namespace) → always produces the same UUID
const certId = uuidv5('cert-2024-001', CERT_NAMESPACE);
// Always: '630eb68f-e0fa-5ecc-887a-7c7a62614681' (example)

// Using RFC URL namespace
const urlCert = uuidv5('https://siraj-cert.example/cert/123', uuidv5.URL);
```

**Why v5 for deterministic IDs:**
- **Idempotent**: Same input always generates the same UUID — safe for retry logic without duplicates.
- **Content-addressable**: If you know the namespace and name, you can compute the UUID without a lookup.
- **Useful for**: Certificate template IDs (derive from template name), consistent IDs across environments for seed data, deduplication keys.
- **v5 preferred over v3**: SHA-1 (v5) is cryptographically stronger than MD5 (v3). RFC explicitly recommends v5 when backward compatibility is not an issue.

**Certificate-specific use cases for v5:**
- **Template IDs**: `uuidv5(templateName, CERT_TEMPLATE_NAMESPACE)` → same template always gets the same ID across deployments
- **Seed data**: Deterministic UUIDs for seed certificates that are stable across database resets
- **Idempotency keys**: Generate from a natural key (e.g., `studentId + courseId + batchId`) to prevent duplicate certificates

## Usage Examples

### Basic v4 (random certificate code)

```typescript
import { v4 as uuidv4 } from 'uuid';

// Simple random UUID
const certCode = uuidv4();
// 'b18794e8-5d0d-417c-b361-ba38e78411b4'
```

### v4 with Custom Random (for testing/deterministic seeds)

```typescript
import { v4 as uuidv4 } from 'uuid';

const certCode = uuidv4({
  random: Uint8Array.of(
    0x10, 0x91, 0x56, 0xbe,
    0xc4, 0xfb, 0xc1, 0xea,
    0x71, 0xb4, 0xef, 0xe1,
    0x67, 0x1c, 0x58, 0x36,
  ),
});
// '109156be-c4fb-41ea-b1b4-efe1671c5836' — always the same
```

### v7 (time-sortable batch job ID)

```typescript
import { v7 as uuidv7 } from 'uuid';

// Auto-managed timestamp + sequence
const jobId1 = uuidv7();
const jobId2 = uuidv7(); // sorts after jobId1 even if same millisecond

// With explicit timestamp (for backdating or testing)
const historicalJob = uuidv7({
  msecs: new Date('2024-01-01').getTime(),
});
```

### v5 (deterministic certificate template IDs)

```typescript
import { v5 as uuidv5 } from 'uuid';

const CERT_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

const certId = uuidv5('cert-2024-001', CERT_NAMESPACE);
// Deterministic — same input always → same output

// Using RFC URL namespace
const urlId = uuidv5('https://siraj.example/cert/123', uuidv5.URL);
// 'c106a26a-21bb-5538-8bf2-57095d1976c1'
```

### Validate and Version Check

```typescript
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

// Validate any UUID
uuidValidate('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'); // true
uuidValidate('not a UUID'); // false
uuidValidate(null); // false (accepts unknown, returns boolean)
uuidValidate(42); // false

// Get version
uuidVersion('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'); // 4
uuidVersion('45637ec4-c85f-11ea-87d0-0242ac130003'); // 1

// Combined: validate that a certificate code is a v4 UUID
function isValidCertCode(uuid: string): boolean {
  return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}
```

### Parse and Stringify

```typescript
import { parse as uuidParse, stringify as uuidStringify } from 'uuid';

// String → Bytes
const bytes = uuidParse('6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b');
// Uint8Array(16) [110, 192, 189, 127, 17, 192, 67, 218, 151, 94, 42, 138, 217, 235, 174, 11]

// Bytes → String
const uuid = uuidStringify(bytes);
// '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'
```

### Buffer Output (avoid string allocation)

```typescript
import { v4 as uuidv4 } from 'uuid';

// Write UUID bytes directly into an existing buffer
const buf = new Uint8Array(16);
uuidv4(undefined, buf);
// buf now contains the 16 raw bytes of the UUID
```

### CLI Usage

```bash
npx uuid           # generate v4 UUID (default)
npx uuid v1        # generate v1 UUID
npx uuid v5 <name> <namespace>  # generate v5 UUID
npx uuid v7        # generate v7 UUID
```

## Gotchas & Warnings

### 1. ESM Only — No `require()`

`uuid@14` is ESM-only. `const { v4 } = require('uuid')` will **throw** `ERR_REQUIRE_ESM`. The package has `"type": "module"` and no CJS fallback. If the project uses CommonJS, you must either:
- Use dynamic `import()` 
- Upgrade the project to ESM
- Use an older version (uuid@11 was the last to support CJS, but that's not recommended)

**In this project**: Siraj uses Bun, which supports ESM natively. Import via: `import { v4 } from 'uuid'`. Bun also transpiles CJS that imports ESM, so this is a non-issue.

### 2. No Default Export — Named Exports Only

```typescript
// CORRECT
import { v4 as uuidv4 } from 'uuid';

// WRONG — will fail
import uuid from 'uuid'; // No default export exists!
```

There is no `export default` at the package level. Each function has its own default export internally but the package re-exports them all as named exports.

### 3. `options` Argument Behavior Change (since uuid@11)

Passing an `options` object to `v1()`, `v6()`, or `v7()` — even an empty object `{}` — **disables** the internal uniqueness state management:

```typescript
import { v7 as uuidv7 } from 'uuid';

uuidv7();        // Uses internal state (seq counter for same-ms uniqueness)
uuidv7({});      // Does NOT use internal state! Reseeded random seq each call
```

If you want the internal state behavior (recommended for production), call with **no arguments at all**. Passing `{}` or `{ msecs: Date.now() }` changes the behavior.

### 4. v4 Native Fast Path — `crypto.randomUUID()`

When `v4()` is called with no arguments and `crypto.randomUUID` is available, it delegates directly to the native implementation. This is a different code path than when options are provided:

```typescript
// Fast path (native crypto.randomUUID)
const id1 = uuidv4();

// Polyfill path (manual byte manipulation)
const id2 = uuidv4({}); // Empty object also triggers polyfill path!
```

Both produce valid v4 UUIDs, but for maximum performance, prefer `uuidv4()` with no arguments.

### 5. `version()` Throws on Invalid Input

`version()` does not return a fallback — it **throws `TypeError`** if the input is not a valid UUID:

```typescript
import { version as uuidVersion } from 'uuid';

uuidVersion('invalid'); // throws TypeError('Invalid UUID')
```

Always use `validate()` first, or wrap in try/catch, when processing user-provided UUID strings.

### 6. `stringify()` Validates — `unsafeStringify()` Does Not

`stringify()` validates the output and throws `TypeError` if the bytes don't produce a valid UUID. `unsafeStringify()` (also exported) skips validation for performance but can produce invalid UUID strings if given bad bytes. Use `stringify()` for safety, `unsafeStringify()` only when you control the input.

### 7. v5/v3 Namespace Must Be Valid UUID

The `namespace` argument to `v5()` and `v3()` must itself be a valid UUID (string or 16-byte array). If a string is passed, it's parsed via `parse()` which throws `TypeError` on invalid UUIDs. If a byte array is passed, it must have exactly 16 elements.

### 8. v3 (MD5) Is Deprecated in Favor of v5 (SHA-1)

Per RFC9562: _"If backward compatibility is not an issue, SHA-1 [Version 5] is preferred."_ Use v5 for all new deterministic UUID use cases. Only use v3 if you need to maintain compatibility with existing v3 UUIDs.

### 9. v1 and v6 Maintain Internal Mutable State

`v1()` and `v6()` maintain module-level internal state (`_state` object) for `msecs`, `nsecs`, `node`, and `clockseq`. This state persists across calls and is **not thread-safe** in environments with shared memory. In typical Node.js/Bun single-threaded usage this is fine, but be aware:
- The state is not resettable from outside (no exported reset function)
- The `updateV1State()` function is exported but operates on a state object you provide, not the internal one
- If you need guaranteed fresh state, pass explicit `options` (which bypasses internal state entirely)

### 10. v7 Sequence Counter Wraps at 32 bits

The internal `seq` counter for v7 auto-increments within the same millisecond. If it wraps (reaches 0 after 0xffffffff), the timestamp is incremented by 1ms. This means extremely high throughput (>4 billion UUIDs/ms) could cause timestamp drift, but this is not a practical concern.

### 11. RNG Uses Shared Internal Buffer

The `rng()` function uses a single pre-allocated `Uint8Array(16)` buffer (`rnds8`) that is reused across calls. This means:
- The returned array is **not safe to retain** — it will be overwritten on the next call
- If you need to keep the random bytes, copy them: `const copy = rng().slice()`
- This is a performance optimization to avoid allocations

### 12. v6 Internally Calls v1 Then Transforms

`v6(options)` internally calls `v1({ ...options, _v6: true }, new Uint8Array(16))` and then applies `v1ToV6()` byte reordering. This means:
- v6 has slightly more overhead than v1 (extra copy + transform)
- If you only need v1 format, use `v1()` directly
- The `_v6` flag in `Version1Options` is internal and should not be set manually

### 13. Buffer Bounds Checking

All functions that accept a `buffer` parameter perform bounds checking and throw `RangeError` if the offset + 16 exceeds the buffer length. The error message includes the exact range that was out of bounds:
```
RangeError: UUID byte range 10:25 is out of buffer bounds
```

### 14. Case Sensitivity

- UUIDs are generated in **lowercase** (see `unsafeStringify` implementation — all bytes converted via `.toLowerCase()`)
- The `validate()` regex is case-insensitive (`/i` flag), so uppercase UUIDs also validate as true
- The `version()` function works on both cases (parses a hex nibble)
- Best practice: store and compare in lowercase for consistency
