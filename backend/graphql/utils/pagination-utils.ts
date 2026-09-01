/**
 * Canonical GraphQL-layer pagination helpers.
 *
 * Consolidates the 6+ duplicate `parsePaginationArgs`, `toPaginationArgs`,
 * and inline `new PaginationArgs({ ... })` blocks scattered across Pothos
 * and query files. All GraphQL resolvers should import from this module
 * instead of re-implementing pagination argument parsing locally.
 *
 * Delegates to the runtime `PaginationArgs` class (`@/backend/types`) to
 * preserve the single source of truth for pagination math.
 */

import { PaginationArgs, type PaginationInput } from "@/backend/types";

/**
 * Parse a GraphQL pagination input into a runtime {@link PaginationArgs}.
 *
 * Returns `null` when the input is null/undefined so resolvers can pass the
 * result straight through to services that accept `PaginationArgs | null`.
 *
 * Replaces the 4+ local `parsePaginationArgs`/`toPaginationArgs` copies and
 * the ~8 inline `new PaginationArgs({ first: input.first ?? null, ... })`
 * blocks duplicated across GraphQL files.
 */
export function parsePaginationArgs(input: PaginationInput | null | undefined): PaginationArgs | null {
  return PaginationArgs.fromArgs(input);
}
