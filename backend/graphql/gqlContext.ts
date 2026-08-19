import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { type AppPermission, UserRole } from "@/backend/enum";
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
   * `rememberTokenHash` stripped (R4-34). Populated in `createContext` so the
   * `Query.me` resolver can avoid a redundant `UserService.findById` call (R3-8).
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

  // R4-34: Strip password and rememberTokenHash before storing on the context.
  const safeUserForContext = safeUser ? { ...safeUser, password: undefined, rememberTokenHash: undefined } : null;

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
