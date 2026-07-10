import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { UserRepository } from "@/backend/db/repo";
import { type AppPermission, type CurrencyCode, UserRole } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";

export type BaseContext = {
  user:
    | {
        id: string;
        displayCurrency: CurrencyCode | null;
      }
    | undefined;
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
    };
  }

  const effectiveRealUserId = realUserId ?? actorUserId ?? userId;
  const permissionContext =
    isSimulatingGroup && simulatedGroupSlug
      ? await PermissionsService.getPermissionGroupContext(simulatedGroupSlug, locale)
      : await PermissionsService.getUserContext(userId);

  const safeUser = await UserRepository.findSafeById(userId);

  return {
    user: { id: userId, displayCurrency: safeUser?.displayCurrency ?? null },
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
  };
}
