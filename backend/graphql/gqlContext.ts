import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { type AppPermission, UserRole } from "@/backend/enum";
import { UnauthorizedError } from "@/backend/lib/errors";
import { PermissionsService, UserService } from "@/backend/services";
import type { SanitizedUserSelectType } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { getServerTranslations, type Translations } from "@/shared/locale";

export type BaseContext = {
  user:
    | {
        id: string;
        displayCurrency: CurrencyCode | null;
      }
    | undefined;
  /**
   * The full user record from `findSafeById`, with `password` and
   * `rememberTokenHash` stripped. Populated in `createContext` so the
   * `Query.me` resolver can avoid a redundant `UserService.findById` call.
   * `null` when the user was not found; `undefined` when no `userId` was provided.
   */
  safeUser: SanitizedUserSelectType | null | undefined;
  permissions: AppPermission[];
  permissionGroups: string[];
  isSuperAdmin: boolean;
  actorUserId?: string;
  isImpersonating: boolean;
  realUserId?: string;
  isSimulatingGroup: boolean;
  simulatedGroupSlug?: string;
  refreshToken: string | undefined;
  sessionId: string | undefined;
  ipAddress?: string;
  cookies?: ResponseCookies;
  role: UserRole;
  locale: string;
  billingFxDisplayCurrency?: CurrencyCode | null;
  billingFxDisplayCurrencyByUserId?: Map<string, CurrencyCode | null>;
  t: () => Translations;
};

export type AuthContexts = {
  loggedIn: BaseContext & { user: object };
  permission: BaseContext & { user: object };
};

/**
 * Returns the authenticated user's id, throwing a localized UNAUTHENTICATED
 * error when the context carries no user. Every caller is already behind a
 * `loggedIn`/`permission` authScope — this is a defense-in-depth assertion
 * replacing silent `ctx.user?.id ?? ""` fallbacks that would otherwise
 * execute with an empty userId if scopes are ever weakened.
 */
export function requireUserId(ctx: BaseContext): string {
  if (!ctx.user) {
    throw new UnauthorizedError(ctx.t().errorsTranslations.unauthorized);
  }
  return ctx.user.id;
}

export async function createContext({
  userId,
  actorUserId,
  isImpersonating = false,
  realUserId,
  isSimulatingGroup = false,
  simulatedGroupSlug,
  locale = "ar",
}: {
  userId?: string | null;
  actorUserId?: string;
  isImpersonating?: boolean;
  realUserId?: string;
  isSimulatingGroup?: boolean;
  simulatedGroupSlug?: string;
  locale?: string;
}): Promise<BaseContext> {
  if (!userId) {
    return {
      user: undefined,
      safeUser: undefined,
      permissions: [],
      permissionGroups: [],
      isSuperAdmin: false,
      actorUserId: undefined,
      isImpersonating: false,
      realUserId: undefined,
      isSimulatingGroup: false,
      simulatedGroupSlug: undefined,
      role: UserRole.GUEST,
      refreshToken: undefined,
      sessionId: undefined,
      locale,
      t: () => getServerTranslations(locale),
    };
  }

  const effectiveRealUserId = realUserId ?? actorUserId ?? userId;
  const permissionContext =
    isSimulatingGroup && simulatedGroupSlug
      ? await PermissionsService.getPermissionGroupContext(simulatedGroupSlug)
      : await PermissionsService.getUserContext(userId);

  const safeUser = await UserService.findSafeById(userId);

  // Strip password and rememberTokenHash before storing on the context; the
  // sanitized type rejects any real value for these credential fields.
  const safeUserForContext = safeUser
    ? ({ ...safeUser, password: undefined, rememberTokenHash: undefined } satisfies SanitizedUserSelectType)
    : null;

  return {
    user: { id: userId, displayCurrency: safeUser?.displayCurrency ?? null },
    safeUser: safeUserForContext,
    permissions: permissionContext.permissions,
    permissionGroups: permissionContext.permissionGroups,
    isSuperAdmin: permissionContext.isSuperAdmin,
    actorUserId,
    isImpersonating,
    realUserId: effectiveRealUserId,
    isSimulatingGroup,
    simulatedGroupSlug,
    role: permissionContext.role,
    refreshToken: undefined,
    sessionId: undefined,
    locale,
    t: () => getServerTranslations(locale),
  };
}
