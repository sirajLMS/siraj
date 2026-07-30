# Translation Cache Strategies — Comparison

Goal: persist lazy-loaded translation namespaces in the browser so they survive page reloads, with automatic invalidation when the build changes.

Both strategies assume:
- Locale leaves live under `shared/locale/en/**` and `shared/locale/ar/**` (~140 namespaces, ~229 KB raw per locale).
- Leaves contain functions (e.g., `showingOf: (n, t) => \`Showing ${n} of ${t}\``), so they are NOT JSON-serializable.
- Both locales (`ar` + `en`) should be cached per the user's preference.
- Cache must invalidate automatically when the codebase changes (no manual version bump).

---

## Strategy A — Dynamic `import()` Swoffload onto Cache API

**Idea**: Let Turbopack/webpack keep doing what it does today. The dynamic `import("@/shared/locale/en/dashboard/students/directory")` resolves to a chunk URL like `/_next/static/chunks/locale_en_dashboard_students_directory-abc123.js`. We add a tiny service-worker-style fetch interceptor that stores the response of every locale chunk URL in `caches.open("siraj-i18n-v1")`. On reload, the same URL is served from Cache API; if the chunk URL changes (because content changed → new hash), the new URL misses cache and re-fetches, while the old entry becomes orphaned.

**Implementation sketch**:

```ts
// shared/locale/client/chunk-cache.ts
const CACHE_NAME = "siraj-i18n-v1";

export async function cacheLocaleChunk(url: string): Promise<Response> {
  if (typeof caches === "undefined") return fetch(url);
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (res.ok) await cache.put(url, res.clone());
  return res;
}
```

Then wrap the dynamic `import()` resolver in each namespace loader. With Turbopack, this can be done by overriding the `import()` mapping at the `defineNamespace` level:

```ts
defineNamespace<StudentDirectoryLabels>({
  load: {
    en: () => cachedImport("@/shared/locale/en/dashboard/students/directory"),
    ar: () => cachedImport("@/shared/locale/ar/dashboard/students/directory"),
  },
});
```

…where `cachedImport(specifier)` resolves the chunk URL via `import.meta.url`/`__webpack_require__.u()` and calls `cacheLocaleChunk(url)` before `import(specifier)`.

Pros:
| Aspect | Detail |
|---|---|
| Zero lossy serialization | Module source is stored and re-evaluated by the bundler runtime — functions intact |
| Automatic per-namespace invalidation | Chunk URL has contenthash; changed names gets new URL, misses cache, re-fetches. Unchanged namespaces stay cached indefinitely |
| No build-time plumbing | No `generateBuildId`, no `NEXT_PUBLIC_BUILD_ID` env var, no codegen step |
| Works with Turbopack HMR | Cache API is keyed by URL; HMR URL is different hot-reload URL → cache miss is fine |
| Free cache cleanup | Old chunk URLs are orphaned; a `caches.delete("siraj-i18n-v1")` on `activate` event (or a TTL sweep) clears them |

Cons:
| Aspect | Detail |
|---|---|
| No metadata layer | Can't list "which namespaces are cached" without parsing URLs |
| Cache API requires secure context | HTTPS or localhost only — fine in prod, breaks on plain-IP dev cages |
| Bundle size unchanged | Still ships the chunk the first time per locale; only the network round trip is saved on reload |
| `caches` CORS | Same-origin only — fine because `/_next/static/*` is same-origin |
| Need to handle private-mode Safari | Cache API may throw in private mode; need try/catch fallback to plain `import()` |
| Orphan entries grow over time | Need periodic `caches.delete` or LRU eviction logic |
| Doesn't accelerate very first visit | Cold cache = same as today |

When invalidation fires:
- Any namespace whose source changes → its chunk gets a new contenthash → URL changes → cache miss.
- Any namespace whose source is unchanged → URL is identical → cache hit, zero network.
- Build upgrade → most/all chunk URLs change → most/all namespaces re-fetch once.

---

## Strategy B — Pre-built JSON snapshots + Build ID in IndexedDB/localStorage

**Idea**: At build time, generate a JSON snapshot for each (namespace × locale) pair, stripping functions into strings + a "reviver" mapping. Then bundle these snapshots with a build ID hash, ship the build ID to the client as `NEXT_PUBLIC_BUILD_ID`, and on the client persist snapshots in IndexedDB (or `localStorage` if small enough) keyed by `${buildId}:${namespaceId}:${locale}`. On reload, read the snapshot from storage; if `buildId` mismatches, throw away the entire DB and re-populate from the network bundle.

**Implementation sketch**:

1. **Build step** (new script `scripts/locale-snapshots.ts`):
   - For each `defineNamespace` call, run the loader, serialize the resulting labels object via a custom replacer that records function bodies as source strings:
     ```ts
     JSON.stringify(labels, (key, val) => {
       if (typeof val === "function") return { __fn: val.toString() };
       return val;
     });
     ```
   - Emit `shared/locale/cache-snapshots/en/<namespace>.json` and `ar/<namespace>.json`.
   - Compute a single content hash of all snapshots → write to `NEXT_PUBLIC_BUILD_ID`.
   - Add `generateBuildId: () => process.env.NEXT_PUBLIC_BUILD_ID ?? crypto.randomUUID()` to `next.config.ts`.

2. **Client cache layer** (`shared/locale/client/translation-cache-store.ts`):
   - On `startNamespaceLoad`, first check IndexedDB for `${buildId}:${namespaceId}:${locale}`.
   - If hit → revive via `JSON.parse(text, (k, v) => v?.__fn ? eval(`(${v.__fn})`) : v)` and resolve.
   - If miss → fetch the snapshot JSON for that namespace+locale, store, then revive.
   - On any read, compare stored `buildId` to the runtime `process.env.NEXT_PUBLIC_BUILD_ID`; mismatch → wipe IndexedDB, re-fetch.

3. **CI hook**: stamp `NEXT_PUBLIC_BUILD_ID` from `git rev-parse --short HEAD` in the deploy pipeline so the build ID changes each deploy.

Pros:
| Aspect | Detail |
|---|---|
| Explicit cache key | `${buildId}:${namespaceId}:${locale}` is queryable — can show "cached locales" UI, debug storage usage |
| Works in private-mode Safari | IndexedDB may be unavailable but `localStorage` fallback (5 MB limit; with all locales ~460 KB raw, fits) works |
| Smaller wire payload | JSON snapshot (~5-15 KB per locale) is smaller than the bundled chunk (which includes module wrapper, runtime helpers) |
| Pre-warm without eval | First visit can fetch all snapshots in one JSON request, no per-chunk round trips |
| Queryable | `indexedDB.databases()` reveals cache size and freshness |
| Powerful invalidation | Mismatched build ID wipes everything cleanly; can also do per-namespace invalidation by content hash |

Cons:
| Aspect | Detail |
|---|---|
| Functions need reviver | `val.toString()` works for arrow funcs and `function` decls but not bound methods or closures over outer state. Most locale closures are pure (over their args) so this is OK, but requires care |
| `eval` works but is risky | Reviver must `eval` function source; CSP rules must allow `unsafe-eval` (the project current CSP doesn't, would need to relax) |
| Build-time codegen step | New `scripts/locale-snapshots.ts` must run in `prebuild` and during dev (HMR invalidation when a leaf changes) |
| Code generation maintenance | If a leaf uses a Symbol, Map, Date, BigInt, or class instance, the JSON snapshot breaks — needs guards |
| Doubles source of truth | Leaf `.ts` + emitted `.json` snapshots; risk of drift if codegen step is skipped |
| Build ID env plumbing | Vercel/CI must stamp `NEXT_PUBLIC_BUILD_ID`; dev fallback random UUID means dev cache never hits (acceptable but confusing) |
| IndexedDB transactions add latency | Per-key reads have async overhead; can be batched, but adds complexity |
| CSP relaxation | Most production CSPs forbid `unsafe-eval`; the project's CSP would need to be relaxed or the reviver rewritten to use `new Function()` (also blocked by strict CSP) |

When invalidation fires:
- `NEXT_PUBLIC_BUILD_ID` changes (typically each git SHA deploy) → entire IndexedDB is wiped on first read.
- Within the same build → never invalidated (no per-namespace hash).

---

## Comparison Matrix

| Dimension | Strategy A (Chunk URL Cache API) | Strategy B (JSON snapshots + Build ID) |
|---|---|---|
| Function support | Fully preserved (bundler re-evaluates module) | Requires reviver + `eval` (CSP issue) |
| Per-namespace invalidation | Automatic (chunk URL has contenthash) | Manual (only build-wide invalidation) |
| Wire-size per namespace | Bundled chunk (~2-5 KB gzip) | JSON snapshot (~1-3 KB gzip) |
| First-visit acceleration | None (cold cache = today) | None (cold cache = today) |
| Repeat-visit acceleration | Yes — chunk served from Cache API | Yes — snapshot served from IndexedDB |
| Dev environment | Works (HMR URLs are unique per reload) | Fails (random UUID per dev start wipes cache) |
| CSP compatibility | Yes (no `eval`) | Needs `unsafe-eval` or `new Function` |
| Build complexity | None | New codegen step + env var + git SHA CI |
| Codegen drift risk | None | Yes if step is skipped |
| Storage quota | Cache API: ~unlimited on HTTPS | IndexedDB: ~unlimited; localStorage: 5 MB ceiling |
| Safari private mode | Try/catch fallback to network | Try/catch fallback to network |
| Cleanup of stale entries | Orphans accumulate; periodic `caches.delete` | Built-in via build-ID wipe |
| Implementation effort | Low (1 module — ~80 LoC) | High (codegen + reviver + CSP change + env plumbing) |
| Works on `localhost:3000` (HTTP) | Yes — Cache API works on localhost | Yes — IndexedDB works on localhost |
| Works on plain-IP staging (HTTP) | No (needs HTTPS or localhost) | Yes |
| Reproducibility | Implicit (depends on bundler output) | Explicit (snapshot is a real artifact) |
| Multi-tab sync | N/A (Cache API is shared across tabs) | N/A (IndexedDB is shared across tabs) |

---

## Recommendation

**Strategy A** is the lower-risk, lower-effort path. It piggybacks on the existing bundler pipeline, requires no build-time codegen, preserves closures automatically, and invalidates per-namespace without any custom version plumbing. The main limitation is that it works only in secure contexts (HTTPS or `localhost`) — acceptable for production and local dev, but breaks on plain-IP staging.

**Strategy B** is more powerful (queryable, smaller wire payload, works on HTTP staging) but pays for it with significant complexity: a custom JSON-with-functions reviver, a new codegen step, a build ID env var, and a CSP relaxation for `eval`. The CSP relaxation alone can block adoption.

A hybrid is possible: **Strategy A as default, Strategy B as opt-in for plain-HTTP staging** — but the maintenance cost of supporting both strategies is high. We'd recommend starting with A and adding B only if a real-world pain point (e.g., persistent staging cache needs) emerges.
