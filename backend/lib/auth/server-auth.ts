import { cookies } from "next/headers";
import { verifyToken } from "@/backend/lib/auth/jwt";
import { PermissionsService, type UserPermissionContext } from "@/backend/services/auth/permissions.service";

export async function getServerUserContext(): Promise<{
  userId: string | null;
  context: UserPermissionContext | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("refresh_token")?.value;

  if (!token) {
    return { userId: null, context: null };
  }

  const payload = await verifyToken(token);
  if (!payload || (payload.type !== "access" && payload.type !== "refresh")) {
    return { userId: null, context: null };
  }

  const context = await PermissionsService.getUserContext(payload.userId);
  return { userId: payload.userId, context };
}
