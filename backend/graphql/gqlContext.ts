import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { resolveUserPermissions } from "@/backend/lib/auth/permissions";

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
};

export type AuthContexts = {
  loggedIn: BaseContext & { user: object };
  permission: BaseContext & { user: object };
};

export async function createContext({ userId }: { userId?: string | null }): Promise<BaseContext> {
  if (!userId) {
    return {
      user: undefined,
      permissions: [],
      permissionGroups: [],
      isSuperAdmin: false,
      refreshToken: undefined,
      sessionId: undefined,
    };
  }

  const permissionContext = await resolveUserPermissions(userId);

  return {
    user: { id: userId },
    permissions: permissionContext.permissions,
    permissionGroups: permissionContext.permissionGroups,
    isSuperAdmin: permissionContext.isSuperAdmin,
    refreshToken: undefined,
    sessionId: undefined,
  };
}
