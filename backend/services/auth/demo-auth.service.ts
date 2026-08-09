import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SessionRepository } from "@/backend/db/repo";
import { permissionGroups, userPermissionGroups, users } from "@/backend/db/schema";
import { generateAccessToken, generateRefreshToken } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import type { SafeUser, UserSelectType } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";
import { INTERNAL_DEMO_USERS } from "@/shared/demo-users";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import type { ErrorsLabels } from "@/shared/locale";

/** Internal machine roles — never exposed as demo quick-login options. */
const EXCLUDED_DEMO_LOGIN_GROUP_SLUGS = new Set<string>(["system_automated"]);

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
      return groups
        .filter(group => !EXCLUDED_DEMO_LOGIN_GROUP_SLUGS.has(group.slug))
        .map(group => {
          const description = resolveLocalizedString(group.description, locale);
          return {
            slug: group.slug,
            name: resolveLocalizedString(group.name, locale),
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

    if (EXCLUDED_DEMO_LOGIN_GROUP_SLUGS.has(groupSlug)) {
      throw new Error(t.auth.demoGroupNotFound(groupSlug));
    }

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

    const demoUser = await selectDemoUserForGroup(group.id, groupSlug);
    if (!demoUser) {
      throw new Error(t.auth.demoGroupNoUser(groupSlug));
    }

    return proceedWithUser(demoUser);
  }

  /**
   * Prefers the canonical demo user for `groupSlug` (from `INTERNAL_DEMO_USERS`),
   * falling back to the earliest-created group member. Keeps demo login
   * deterministic so integration tests do not flip-flop between seeded users
   * with different seeded notification preferences / overrides.
   */
  async function selectDemoUserForGroup(groupId: string, groupSlug: string): Promise<UserSelectType | null> {
    const canonicalEmail = INTERNAL_DEMO_USERS.find(entry => entry.groupSlug === groupSlug)?.email;

    if (canonicalEmail) {
      const [byEmail] = await db
        .select({ user: users })
        .from(userPermissionGroups)
        .innerJoin(users, eq(users.id, userPermissionGroups.userId))
        .where(and(eq(userPermissionGroups.groupId, groupId), eq(users.email, canonicalEmail)))
        .limit(1);
      if (byEmail?.user) {
        return byEmail.user;
      }
    }

    const [fallback] = await db
      .select({
        user: users,
      })
      .from(userPermissionGroups)
      .innerJoin(users, eq(users.id, userPermissionGroups.userId))
      .where(eq(userPermissionGroups.groupId, groupId))
      .orderBy(users.createdAt, users.email)
      .limit(1);
    return fallback?.user ?? null;
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
