import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SessionRepository } from "@/backend/db/repo";
import { permissionGroups, userPermissionGroups, users } from "@/backend/db/schema";
import { generateAccessToken, generateRefreshToken } from "@/backend/lib";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type { SafeUser, UserEntity } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";

export namespace DemoAuthService {
  /**
   * Retrieves all available permission groups from the database for demo login purposes.
   *
   * @drizzle `db.query.permissionGroups.findMany`
   * @returns An array of permission groups containing their slug, name, and description.
   */
  export async function getAvailableDemoGroups() {
    try {
      const groups = await db.query.permissionGroups.findMany({
        columns: {
          slug: true,
          name: true,
          description: true,
        },
      });
      // also if we want to add super_admin as a group artificially, we can check.
      // But typically super_admin is also in permission_groups in some systems, wait: "we wanna get the available groups from the database itself not hardcoded at all".
      return groups;
    } catch (error) {
      logger.error("Failed to fetch demo groups", { error });
      return [];
    }
  }

  /**
   * Logs in a user by bypassing password checks, based purely on a requested permission group slug.
   * It looks up the group in the database and finds an associated user.
   *
   * @drizzle `db.select().from(permissionGroups)`
   * @drizzle `db.select().from(userPermissionGroups).innerJoin(users)`
   * @drizzle `db.select().from(users)`
   * @param groupSlug The unique slug of the permission group to authenticate as.
   * @returns The user entity along with newly generated access and refresh tokens.
   */
  export async function loginWithGroupSlug(
    groupSlug: string,
    locale?: string
  ): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const [group] = await db.select().from(permissionGroups).where(eq(permissionGroups.slug, groupSlug)).limit(1);

    if (!group) {
      // Check if it's super admin
      if (groupSlug === "super_admin") {
        const [superAdmin] = await db.select().from(users).where(eq(users.isSuperAdmin, true)).limit(1);
        if (superAdmin) {
          return proceedWithUser(superAdmin);
        }
      }
      throw new Error(t("auth.demoGroupNotFound", { groupSlug }));
    }

    const [assignment] = await db
      .select({
        user: users,
      })
      .from(userPermissionGroups)
      .innerJoin(users, eq(users.id, userPermissionGroups.userId))
      .where(eq(userPermissionGroups.groupId, group.id))
      .limit(1);

    if (!assignment?.user) {
      throw new Error(t("auth.demoGroupNoUser", { groupSlug }));
    }

    return proceedWithUser(assignment.user);
  }

  async function proceedWithUser(user: UserEntity) {
    const accessToken = await generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id, user.email);

    const sessionId = randomUUID();
    await SessionRepository.create({
      hashedId: sessionId,
      userId: user.id,
      payload: JSON.stringify({
        createdAt: new Date().toISOString(),
      }),
    });

    return { user: AuthUtils.toSafeUser(user), accessToken, refreshToken, sessionId };
  }
}
