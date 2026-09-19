# Repo-Boundary Input Guards (malformed filters must not throw)

## Overview

Malformed filter input reaching a Drizzle SQL expression (e.g. `to_char(timestamp_col, 'YYYY-MM')`
compared against `%`, `.*`, `""`, or a partial date like `2099-1`) throws a `RangeError` from the
driver. The repository contract is: **no data-access throw, no widened scan** — validate the
filter shape at the repo boundary and return an empty result set for malformed values instead.

## The pattern

```ts
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

// in the repo query:
const monthFilter = MONTH_PATTERN.test(month) ? month : null;
// null filter → return the stable empty page (0 rows, totalCount 0) — do NOT drop the
// filter, which would widen the scan to the whole table.
```

## Why this matters

- A `RangeError` from the driver surfaces as an unhandled 500 in GraphQL routes and fails
  repository tests written as `test.each` tables over malformed inputs.
- Dropping the malformed filter instead of short-circuiting silently changes the query's
  semantics (unbounded scan) — a correctness bug, not just a robustness one.
- JS-side month bounds (a `startOfUtcMonth`/`endOfUtcMonth` Date range) are an alternative to
  `to_char` string comparison; either way, validate the input format before it reaches SQL.

## Rules

- Repositories return empty pages for malformed filter values; they do not throw.
- Never drop the filter to "recover" from malformed input — short-circuit with an empty set.
- Validate month/date-shape inputs at the repo boundary even when a service layer also
  validates them (defense in depth; the service's `DomainError` mapping covers API surfaces,
  the repo guard covers direct server-component and test call paths).
