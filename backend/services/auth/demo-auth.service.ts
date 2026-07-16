import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SessionRepository } from "@/backend/db/repo";
import { resolveLocalized } from "@/backend/db/repo/utils/resolve-localized";
import { permissionGroups, userPermissionGroups, users } from "@/backend/db/schema";
import { generateAccessToken, generateRefreshToken } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import type { SafeUser, UserSelectType } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";
import type { ErrorsLabels } from "@/shared/locale";

export namespace DemoAuthService {
  /**
   * Retrieves all available permission groups from the database for demo login purposes.
   * Resolves localized name/description for the request locale.
   */
  export async function getAvailableDemoGroups(locale?: string) {
    try {
      const groups = await db.query.permissionGroups.findMany({
        columns: {
          slug: true,
          name: true,
          description: true,
        },
      });
      return groups.map(group => {
        const description = resolveLocalized(group.description, locale);
        return {
          slug: group.slug,
          name: resolveLocalized(group.name, locale),
          description: description === "" ? null : description,
        };
      });
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
   * @param tErrors Translated error labels (passed from GraphQL resolver via ctx.t("errors"))
   * @returns The user entity along with newly generated access and refresh tokens.
   */
  export async function loginWithGroupSlug(
    groupSlug: string,
    tErrors: ErrorsLabels
  ): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const t = tErrors;

    const [group] = await db.select().from(permissionGroups).where(eq(permissionGroups.slug, groupSlug)).limit(1);

    if (!group) {
      // Check if it's super admin
      if (groupSlug === "super_admin") {
        const [superAdmin] = await db.select().from(users).where(eq(users.isSuperAdmin, true)).limit(1);
        if (superAdmin) {
          return proceedWithUser(superAdmin);
        }
      }
      throw new Error(t.auth.demoGroupNotFound(groupSlug));
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
      throw new Error(t.auth.demoGroupNoUser(groupSlug));
    }

    return proceedWithUser(assignment.user);
  }

  async function proceedWithUser(user: UserSelectType) {
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
