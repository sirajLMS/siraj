/**
 * Discriminates the two staff-side user-of-type buckets when creating a new
 * manager/staff account.
 *
 * - manager    → academy administrator (assigned the `ACADEMY_ADMIN` group)
 * - supervisor → supervisor (assigned the `SUPERVISOR_DEFAULT` group)
 *
 * The enum maps to permission group assignment via `resolveTargetGroupSlug`
 * in the manager onboarding service.
 *
 * The enum keys are intentionally lowercase because Pothos derives the public
 * GraphQL enum value names from these keys, and the existing client/server
 * contract exposes them as `manager`/`supervisor`. Callers in the
 * backend MUST access enum members via dot access (`ManagerAccountType.manager`)
 * — never via the raw string literals — so that renaming a value only needs a
 * single edit here.
 */
export enum ManagerAccountType {
  manager = "manager",
  supervisor = "supervisor",
}

/**
 * Constants derived from {@link ManagerAccountType} for ergonomic membership
 * checks without paying for enum reverse-lookups. Mirrors the literal-string
 * union the type system already enforces on `accountType` usages.
 */
export const MANAGER_ACCOUNT_TYPES: readonly ManagerAccountType[] = [
  ManagerAccountType.manager,
  ManagerAccountType.supervisor,
] as const;
