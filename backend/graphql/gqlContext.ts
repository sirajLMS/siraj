import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { PermissionsService } from "@/backend/services/auth/permissions.service";

export type BaseContext = {
  user:
    | {
        id: string;
      }
    | undefined;
  permissions: string[];
  permissionGroups: string[];
  isSuperAdmin: boolean;
  refreshToken: string | undefined;
  sessionId: string | undefined;
  ipAddress?: string;
  cookies?: ResponseCookies;
  role: string;
  locale: string;
};

export type AuthContexts = {
  loggedIn: BaseContext & { user: object };
  permission: BaseContext & { user: object };
};

export async function createContext({
  userId,
  locale = "ar",
}: {
  userId?: string | null;
  locale?: string;
}): Promise<BaseContext> {
  if (!userId) {
    return {
      user: undefined,
      permissions: [],
      permissionGroups: [],
      isSuperAdmin: false,
      role: "Guest",
      refreshToken: undefined,
      sessionId: undefined,
      locale,
    };
  }

  const permissionContext = await PermissionsService.getUserContext(userId);

  return {
    user: { id: userId },
    permissions: permissionContext.permissions,
    permissionGroups: permissionContext.permissionGroups,
    isSuperAdmin: permissionContext.isSuperAdmin,
    role: permissionContext.role,
    refreshToken: undefined,
    sessionId: undefined,
    locale,
  };
}
