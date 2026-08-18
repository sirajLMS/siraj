import type { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";

/**
 * Assert that `userId` holds `permission`. Throws the supplied
 * `errorMessage` (already resolved from i18n) when the check fails.
 *
 * Callers that already have an `ErrorsLabels` object should pass the
 * relevant message string, e.g. `await assertHasPermission(userId, perm,
 * tErrors.unauthorizedAction)`.
 */
export async function assertHasPermission(
  userId: string,
  permission: AppPermission,
  errorMessage: string
): Promise<void> {
  const isAuthorized = await PermissionsService.hasPermission(userId, permission);
  if (!isAuthorized) {
    throw new Error(errorMessage);
  }
}
