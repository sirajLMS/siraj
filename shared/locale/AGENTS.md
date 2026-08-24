# `shared/locale` — Architecture Rules

## Two coexisting translation surfaces (intentional)

Siraj LMS ships **two parallel translation systems** under `shared/locale/`.
Both are kept on purpose; do not collapse them without a deliberate migration.

| Surface | Used by | Assembly strategy | Files |
|---|---|---|---|
| **Eager `messages.ts` tree** | Server components, server actions, route handlers, `getTranslations` / `getServerTranslations` | Static imports of every locale leaf module — the full translation graph is bundled into the server entry as one synchronous object lookup. | `ar/messages.ts`, `en/messages.ts`, `server.ts` |
| **Lazy `namespaces/*.namespace.ts` loaders** | Client components via `useAppTranslation(handle)` / `useTranslation(handle)` | Each namespace registers a loader with `defineNamespace(id, { ar, en })`; the client registry (`shared/locale/client/`) dynamically imports only the locale + namespace a mounted component actually needs. | `shared/locale/namespaces/**/*.namespace.ts`, `shared/locale/client/**` |

### Why both

- **Server code needs the full graph eagerly.** `getTranslations(locale)` is called
  hundreds of times per server render (page metadata, email bodies, error messages,
  audit logs). Doing per-namespace `await import()` per call would tank latency and
  re-introduce waterfall issues that Next.js RSC deliberately avoids.
- **Client code must not ship the entire translation graph.** A logged-in parent
  viewing the dashboard never needs the teacher-onboarding strings. The lazy
  namespace system lets a route bundle only what its components render.

### Consequence: the two systems CAN drift

A leaf module (e.g. `ar/auth/login.ts`) is shared between both systems — it is
imported by `ar/messages.ts` AND by `namespaces/auth/login.namespace.ts`. But
the **aggregation** layers are independent:

- Adding a new locale leaf and wiring it into `messages.ts` only updates the
  server surface; client components using `useAppTranslation` won't see it
  until you also create a `namespaces/<scope>/<key>.namespace.ts` that loads it.
- Adding a `*.namespace.ts` only updates the client surface; server code won't
  see it until you import the same leaf into `messages.ts`/

### Rule: keep both surfaces in sync

When you add or rename a locale leaf module:

1. Add the leaf under both `ar/<scope>/...` and `en/<scope>/...`.
2. Wire it into `ar/messages.ts` and `en/messages.ts` (server surface).
3. Either add a matching `namespaces/<scope>/<key>.namespace.ts` loader
   (client surface) or document why the leaf is server-only.

When in doubt, run `bun run quality-gate` — the `shared/locale` lint rules
detect missing wires.

### When to delete one of the two systems

Don't. The dual-bundling strategy is the documented decision today. If a future
audit shows the lazy namespace system has zero live consumers (ine. no client
component uses `useAppTranslation`), it can be removed — but verify with
`grep -rn "useAppTranslation\|useTranslation" frontend/` first. The eager
`messages.ts` tree is the canonical server surface and should remain.

## Path alias discipline

All imports inside `shared/locale/**` MUST use the `@/shared/locale/...`
absolute alias. Relative `../../types/X` traversals are prohibited — they
make refactors brittle and obscure which `types/` module is being referenced.

```ts
// ✅ Correct
import type { AuthLabels } from "@/shared/locale/types/auth";

// ❌ Prohibited
import type { AuthLabels } from "../../types/auth";
```

## Locale leaf modules

- Each leaf file exports a single `auth<Scope>Ar` / `auth<Scope>En` (or similar)
  const typed against the matching `*Labels` interface from
  `shared/locale/types/...`.
- Leaf modules contain **no logic** — only plain string/object literals.
- Interpolation uses the ICU `{var}` format consumed by the runtime formatter
  in `shared/locale/client/format.ts` and the server formatter in
  `shared/locale/format.ts`.
