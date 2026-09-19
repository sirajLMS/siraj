# Dual Enum Bridges (generated GraphQL vs domain enums)

## Overview

GraphQL codegen enums and domain enums can enumerate the same value strings but with different
member names, making them **structurally incompatible in TypeScript** even though they represent
identical values at runtime. When a layer must pass a value between them, bridge explicitly via
the string value + a type guard — never compare or assign the two enum types directly.

## The problem

- The codegen enum lives in `@/frontend/common/graphql/generated/gql/graphql` with
  camelCase member names (`Aed`, `Usd`, …) and is the frontend GraphQL/stores layer's single
  source of truth.
- The domain enum lives in `@/shared/constants/` (cross-layer canonical) with SCREAMING_CASE
  member names (`AED`, `USD`, …). Backend canonical types (`@/backend/types`) use it.
- Both enumerate the same ISO-4217 value strings, but `gql.CurrencyCode.Aed` is not assignable
  to `CurrencyCode.AED` — tsgo rejects the direct assignment.

## The bridge pattern

```ts
function isDomainCurrencyCode(value: string): value is CurrencyCode {
  return Object.values(CurrencyCode).includes(value as CurrencyCode);
}

function toDomainCurrencyCode(value: CurrencyCode /* generated */): CurrencyCode {
  return isDomainCurrencyCode(value) ? value : DEFAULT_CURRENCY; // explicit fallback
}
```

Bridge at the boundary where a value crosses from a codegen-typed source (Apollo variable,
persisted store field) into a domain-typed consumer (backend canonical type, service input).

## Rules

- Pass generated-enum values straight through only where consumers expect the codegen type.
- Any field typed as a backend/domain enum that receives a codegen value needs this bridge —
  tsgo will catch it, and the fix is the guard, not a cast.
- Fallback to the documented house default (not `null` cast away silently) when the guard fails;
  the fallback mirrors the service layer's default-currency convention.
- Keep the domain enum the canonical source for cross-layer types; the codegen enum is the
  GraphQL wire type. Do not hand-edit generated codegen files.
