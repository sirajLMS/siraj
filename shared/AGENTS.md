# Shared Layer Rules

## Purpose

The `shared/` layer contains code used by **both** frontend and backend: utilities, i18n messages, domain constants, enums, and cross-layer types. It sits below `app/`, `frontend/`, and `backend/` in the dependency graph — nothing in shared may depend on those layers.

## Layer Isolation (CRITICAL)

- **NEVER** import from `@/frontend/**`, `@/backend/**`, or `@/app/**`.
- Enforced by ESLint `no-restricted-imports` in `eslint.config.mjs` for all `shared/**/*.{ts,tsx}` files.
- If shared code needs a value that currently lives in another layer (enum, type, utility), **move or duplicate the canonical definition into `shared/`** and have the other layer import from shared — not the reverse.

## Import Convention

- Always use the `@/` path alias — relative `./` or `../` imports are banned (same rule as `app/`, `backend/`, `frontend/`, `test/`, and `scripts/`).
- Prefer deep imports over barrel files, e.g. `import { X } from "@/shared/constants/<domain>.enum"`.
- `**/index.ts` barrel files may use relative `./` sibling re-exports by design (ESLint exception).

## File Organization

| Directory | Purpose |
|-----------|---------|
| `shared/lib/` | Pure utilities and domain logic with no layer deps |
| `shared/constants/` | Enums and stable domain constants |
| `shared/types/` | Cross-layer TypeScript types |
| `shared/utils/` | General helpers |
| `shared/locale/` | Compile-time i18n system (see below) |

## Shared Enums

When frontend and backend both need the same enum values:

1. Define the enum in `shared/constants/{domain}.enum.ts` using the same string values as the backend enum.
2. Use dot access in shared code and tests: `MyEnum.VALUE`.
3. Keep `@/backend/enum` for backend-only code; backend services/repos import from there.
4. Frontend should use GraphQL codegen enums for API-facing types, or import from `@/shared/constants/` when shared logic requires the same values.
5. **Never** import `@/backend/enum` from `shared/` — see `backend/enum/AGENTS.md`.

## Extracting Code Into Shared

When moving logic from `frontend/` or `backend/` into `shared/`:

1. Place the implementation in the appropriate `shared/` subdirectory (`lib/`, `constants/`, `types/`).
2. Update all consumers to import directly from the `shared/` source. Do not re-export from `frontend/` or `backend/` locations — consumers must import from `shared/` directly.
3. Move or define any required enums/types in `shared/` before updating imports in shared files.
4. Run tests for affected shared modules and verify ESLint passes on changed `shared/**` files.

## i18n Message Types

- Message label types must not reference frontend view types or GraphQL codegen types.
- Define canonical status/key unions in `shared/types/` or `shared/constants/` and use those in message type definitions.

## Translation System (Compile-Time i18n)

### Overview
Siraj uses a custom **compile-time TypeScript i18n system** in `shared/locale/` (the legacy `next-intl` package is removed — never reintroduce it) that provides:
- **Compile-time safety**: `t.x.y` instead of `t("x.y")` — IDE autocomplete + TypeScript errors on missing keys
- **Native TypeScript pluralization**: `(count: number) => string` functions instead of ICU strings
- **Lazy loading**: standard dynamic `import()` per namespace — only loads needed translations
- **SSR & API support**: `getTranslations(locale, namespace)` for server components / API routes
- **GraphQL context integration**: `ctx.t("namespace")` bound to `ctx.locale`

### Rules for All Layers

#### Server Components (`app/**/*.tsx`)
```typescript
// ✅ Correct
import { getTranslations } from "@/shared/locale/server";
const t = await getTranslations(locale, "auth");
return <h1>{t.login.pageTitle}</h1>;

// ❌ Forbidden — next-intl in any form
```

#### Client Components (`frontend/**/*.tsx`)
```typescript
// ✅ Correct
import { useAppTranslation } from "@/shared/locale/client";
const t = useAppTranslation("auth").login;
return <input placeholder={t.email} />;
```

#### GraphQL Resolvers (`backend/graphql/**/*.mutation.ts`, `*.query.ts`)
```typescript
// ✅ Correct
resolve: async (_parent, args, ctx) => {
  const tErrors = await ctx.t("errors");
  throw new GraphQLError(tErrors.auth.invalidCredentials, ...);
};
```

#### API Routes / Scripts / Tests (`app/api/**`, `scripts/**`, `backend/db/test/**`)
```typescript
// ✅ Correct
import { getServerTranslations } from "@/shared/locale/server-graphql";
const t = await getServerTranslations(locale, "errors");
return NextResponse.json({ error: t.auth.notFound }, { status: 404 });
```

### Pluralization Pattern
Replace ICU strings with TypeScript functions in the type schema and implementations:

```typescript
// shared/locale/types/<namespace>/index.ts
export interface SomeLabels {
  itemCount: (count: number) => string; // Typed function — compile-time safe!
}

// shared/locale/en/<namespace>/index.ts
export const some: SomeLabels = {
  itemCount: (count) =>
    count === 0 ? "No items" : count === 1 ? "1 item" : `${count} items`,
};
```

### Interpolation Pattern
Replace `{placeholder}` ICU strings with typed template functions:

```typescript
// types schema
export interface SomeLabels {
  greeting: (name: string) => string;  // was: string with {name}
}

// implementation
greeting: (name) => `Hello, ${name}!`,
```

### Namespace Registration (Required for each new namespace)
1. Add interface to `shared/locale/types/<namespace>/index.ts`
2. Add implementations to `shared/locale/ar/<namespace>/index.ts` and `shared/locale/en/<namespace>/index.ts`
3. Export in `shared/locale/types/message.ts` (add to `MessageSchema`)
4. Add path mapping in the server loader's `namespacePaths` map
5. If used in layout SSR, add to `LocaleProvider` translations in the root layout
6. Each `defineNamespace` call MUST pass a stable string ID as the first parameter (used for browser translation caching)

### Public import contract

- **Product code** (`app/`, `frontend/`, `backend/` outside `shared/locale/`) imports **`@/shared/locale`** and **`@/shared/locale/types`** only — never deep paths into internal subdirectories.
- **`shared/locale/index.ts`** and **`shared/locale/types/index.ts`** are the public barrel — add new canonical exports there when modules land; run `bun tsgo` after barrel changes.
- **Inside `shared/locale/`** implementation files may use relative or deep paths.

### View-layer label types

Canonical `*Labels` interfaces live in `shared/locale/types/**`. View-layer label types may `Pick`, `Omit`, or compose those canonical types — do not duplicate string keys.

## Cross-Layer Shared Types Pattern

When a type definition is used by both backend and frontend, it MUST live in `shared/types/<domain>.types.ts` to avoid duplication. Both backend and frontend import from the same canonical file.

## Linting Rules

- NEVER use `oxlint-disable` comments — fix the root cause.
