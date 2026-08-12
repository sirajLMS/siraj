import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { UserRepository } from "@/backend/db/repo/users";
import type { AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { validatePasswordStrength } from "@/backend/lib/auth";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { DBTransaction } from "@/backend/types";
import type {
  UserCreateCoreInput,
  UserCreateProfileFieldsInput,
  UserReturnType,
} from "@/backend/types/users/user.types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { ErrorsLabels } from "@/shared/locale";

const CURRENCY_CODES = new Set<string>(Object.values(CurrencyCode));

function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_CODES.has(value);
}

function resolveDisplayCurrency(value: string | null | undefined): CurrencyCode | null {
  if (value == null) return null;
  return isCurrencyCode(value) ? value : null;
}

/**
 * Shared, parameterized user-of-type onboarding helper.
 *
 * Each create-user onboarding flow (teacher / parent / student / manager) was
 * duplicating the same skeleton:
 *   1. permission check (`AppPermission.<TYPE>_CREATE`)
 *   2. optional pre-checks (e.g. student validating parent/teacher references,
 *      manager validating super-admin actor)
 *   3. email uniqueness
 *   4. optional `validatePasswordStrength`
 *   5. `UserRepository.create`
 *   6. optional `updateTimezone` + `updateProfileFields({ phone })`
 *   7. `createExtension` (type-specific row)
 *   8. permission-group lookup + `bulkAssignUsersToGroup`
 *   9. optional `afterExtension` (e.g. teacher payout method, student teacher assignment)
 *
 * `createUserOfType` owns steps 1-3 (pre-tx), 5-6, and 8 (in-tx). The caller
 * supplies the variable parts via the {@link CreateUserOfTypeOptions}.
 *
 * @see {@link UserCreateCoreInput} — the shared user-entity input shape.
 */
export namespace UserOnboardingService {
  export interface CreateUserOfTypeOptions<TExtension> {
    readonly actorUserId: string;
    /** Required permission to create this user type (e.g. `AppPermission.TEACHERS_CREATE`). */
    readonly permission: AppPermission;
    /** User-entity core fields (name/email/password/avatarUrl). */
    readonly coreInput: UserCreateCoreInput;
    /**
     * Optional user-entity profile fields written to the `users` row.
     *
     * - `timezone`: written via `UserRepository.updateTimezone` when provided
     *   (falls back to `IanaTimezone.UTC` via the caller's choice — set
     *   `writeDefaultTimezone` to enforce the existing parent flow's UTC fallback).
     * - `phone`: written via `UserRepository.updateProfileFields({ phone })`.
     *
     * For types where `phone` lives on the extension row (teacher / student),
     * do NOT pass it here — include it in the per-type extension payload instead.
     */
    readonly profileFields?: UserCreateProfileFieldsInput;
    /**
     * Whether to run `validatePasswordStrength(coreInput.password, locale)`.
     * Teacher does this today; parent/student/manager rely on schema validation
     * only. Mirrors existing behavior; flip on if the type's flow already did it.
     */
    readonly validatePassword?: boolean;
    /** Permission group slug, or a function of the extension to support dynamic slugs (manager). */
    readonly groupSlug: SystemPermissionGroupSlug | ((extension: TExtension) => SystemPermissionGroupSlug);
    /**
     * If `true`, run `await UserRepository.updateTimezone(user.id, IanaTimezone.UTC, ...)`
     * when `profileFields.timezone` is not provided. Currently only the parent
     * flow writes a default UTC timezone when none is supplied. Other flows
     * leave the column default (`UTC`) from the DB schema untouched; that default
     * already applies on insert so explicit writes are redundant there.
     */
    readonly writeDefaultTimezone?: boolean;
    /** Optional pre-transaction checks (e.g. student parent/teacher existence, manager super-admin). */
    readonly preChecks?: () => Promise<void>;
    /**
     * Builds the type-specific extension row(s). Runs inside the transaction.
     * @returns the extension record (e.g. teacher / parent / student / staff profile).
     */
    readonly createExtension: (user: UserReturnType, tx: DBTransaction) => Promise<TExtension>;
    /**
     * Optional step after the extension row + group assignment (runs inside the
     * transaction, e.g. teacher initial payout method, student teacher assignment).
     */
    readonly afterExtension?: (user: UserReturnType, extension: TExtension, tx: DBTransaction) => Promise<void>;
    readonly locale?: string;
    readonly tErrors: ErrorsLabels;
    /** Logging tag used in the success log message. */
    readonly logTag: string;
  }

  export interface CreateUserOfTypeResult<TExtension> {
    readonly user: UserReturnType;
    readonly extension: TExtension;
  }

  /**
   * Provision a new user row + assign a permission group, delegating the
   * type-specific extension row creation to the caller. Symmetric with all four
   * existing onboarding services while staying domain-driven: per-type services
   * still own the type-specific input shape and resolver entry points.
   */
  export async function createUserOfType<TExtension>(
    opts: CreateUserOfTypeOptions<TExtension>,
    tx?: DBTransaction
  ): Promise<CreateUserOfTypeResult<TExtension>> {
    const { actorUserId, permission, coreInput, profileFields, tErrors, locale } = opts;

    // Step 1: Permission check.
    const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    // Step 2: Optional pre-transaction checks (caller-defined).
    if (opts.preChecks) {
      await opts.preChecks();
    }

    // Step 3: Email uniqueness.
    const emailExists = await UserRepository.existsByEmail(coreInput.email);
    if (emailExists) {
      throw new Error(tErrors.userEmailExists);
    }

    // Step 4: Optional password strength validation.
    if (opts.validatePassword) {
      await validatePasswordStrength(coreInput.password, locale);
    }

    const run = async (txObj: DBTransaction): Promise<CreateUserOfTypeResult<TExtension>> => {
      // Step 5: Create the user row.
      const user = await UserRepository.create(
        {
          name: coreInput.name,
          email: { value: coreInput.email },
          password: coreInput.password,
          ...(coreInput.avatarUrl === undefined ? {} : { avatarUrl: coreInput.avatarUrl }),
        },
        locale,
        txObj
      );

      // Step 6: Optional user-row profile fields (timezone + phone).
      if (profileFields) {
        if (profileFields.timezone != null) {
          await UserRepository.updateTimezone(user.id, profileFields.timezone, txObj, locale);
        } else if (opts.writeDefaultTimezone) {
          await UserRepository.updateTimezone(user.id, IanaTimezone.UTC, txObj, locale);
        }
        if (profileFields.phone != null) {
          await UserRepository.updateProfileFields(user.id, { phone: profileFields.phone }, locale, txObj);
        }
        const displayCurrency = resolveDisplayCurrency(profileFields.displayCurrency);
        if (displayCurrency != null) {
          await UserRepository.updateProfileFields(user.id, { displayCurrency }, locale, txObj);
        }
      } else if (opts.writeDefaultTimezone) {
        await UserRepository.updateTimezone(user.id, IanaTimezone.UTC, txObj, locale);
      }

      // Step 7: Type-specific extension row.
      const extension = await opts.createExtension(user, txObj);

      // Step 8: Permission group lookup + assignment.
      const slug = typeof opts.groupSlug === "function" ? opts.groupSlug(extension) : opts.groupSlug;
      const slugStr: string = slug;
      const groups = await PermissionManagementRepository.listAllGroups(undefined, txObj);
      const targetGroup = groups.find(g => g.slug === slugStr);
      if (!targetGroup) {
        throw new Error(tErrors.permissionGroup.permissionGroupNotFound);
      }
      await PermissionManagementRepository.bulkAssignUsersToGroup([user.id], targetGroup.id, actorUserId, txObj);

      // Step 9: Optional post-extension step.
      if (opts.afterExtension) {
        await opts.afterExtension(user, extension, txObj);
      }

      logger.info(`${opts.logTag} onboarded successfully`, { userId: user.id });

      return { user, extension };
    };

    if (tx) {
      return await run(tx);
    }
    return await db.transaction(run);
  }
}
