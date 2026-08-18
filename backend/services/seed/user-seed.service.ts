/**
 * Seed-only user provisioning.
 *
 * Idempotent upserts for canonical demo/login users (`INTERNAL_DEMO_USERS`).
 * Used by `bun db seed` and GraphQL test helpers (`ensureDemoUsers`).
 *
 * **Not a production domain service** — no GraphQL resolver or API route should
 * import this module. Writes are blocked on real production via
 * {@link assertSeedWriteAllowed}.
 *
 * @see backend/db/seeds/users/seed-users.ts
 * @see backend/services/system/test-helper.service.ts
 */

import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { StaffProfileRepository } from "@/backend/db/repo/teachers";
import { UserRepository } from "@/backend/db/repo/users";
import { hashPassword } from "@/backend/lib/auth/password";
import { assertSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";
import { logger } from "@/backend/lib/logger";
import type { DBTransaction, SeedDemoUserInput, UserSelectType } from "@/backend/types";

const STAFF_GROUP_SLUGS = new Set(["super_admin", "academy_admin", "staff_default", "supervisor_default"]);

export namespace UserSeedService {
  /** Idempotently upsert one demo user with permission group and optional staff profile. */
  export async function upsertDemoUser(
    input: SeedDemoUserInput,
    groupMap: Map<string, string>,
    tx?: DBTransaction
  ): Promise<UserSelectType> {
    assertSeedWriteAllowed("Demo user seed writes");

    const run = async (txObj: DBTransaction) => {
      const hashedPassword = await hashPassword(input.plainPassword);
      const user = await UserRepository.upsertBootstrapUser(
        {
          name: input.name,
          email: input.email,
          hashedPassword,
          isSuperAdmin: input.isSuperAdmin,
        },
        txObj
      );

      const groupId = groupMap.get(input.groupSlug);
      if (groupId) {
        await PermissionManagementRepository.bulkAssignUsersToGroup([user.id], groupId, user.id, txObj);

        if (STAFF_GROUP_SLUGS.has(input.groupSlug)) {
          await StaffProfileRepository.ensureForUser(user.id, txObj);
        }
      }

      return user;
    };

    if (tx) return run(tx);
    return db.transaction(run);
  }

  /** Idempotently upsert many demo users (seed / test-helper batch). */
  export async function upsertManyDemoUsers(
    inputs: SeedDemoUserInput[],
    groupMap: Map<string, string>
  ): Promise<UserSelectType[]> {
    assertSeedWriteAllowed("Demo user seed writes");
    const users = await Promise.all(inputs.map(input => upsertDemoUser(input, groupMap)));
    for (const input of inputs) {
      logger.debug("Seed demo user ensured", { email: input.email });
    }
    return users;
  }

  /** Read helper for seed scripts — lists staff profiles for avatar seeding. */
  export async function findStaffProfilesByUserIds(userIds: readonly string[]) {
    const profiles = await Promise.all(userIds.map(userId => StaffProfileRepository.findByUserId(userId)));
    return profiles.filter((profile): profile is NonNullable<typeof profile> => profile != null);
  }

  /** Seed-only avatar URL update (demo user avatars in seed assets). */
  export async function seedAvatarUrl(userId: string, avatarUrl: string, tx?: DBTransaction): Promise<void> {
    assertSeedWriteAllowed("Demo user seed writes");
    await UserRepository.updateProfileFields(userId, { avatarUrl }, undefined, tx);
  }
}
