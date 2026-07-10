import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository, StaffProfileRepository, UserRepository } from "@/backend/db/repo";
import { hashPassword } from "@/backend/lib/auth/password";
import { logger } from "@/backend/lib/logger";
import type { UserSelectType } from "@/backend/types";

const STAFF_GROUP_SLUGS = new Set(["super_admin", "academy_admin", "staff_default"]);

export type DemoUserUpsertInput = {
  name: string;
  email: string;
  plainPassword: string;
  isSuperAdmin?: boolean;
  groupSlug: string;
};

function assertNonProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Bootstrap user operations are not allowed in production.");
  }
}

export namespace UserBootstrapService {
  export async function upsertDemoUser(
    input: DemoUserUpsertInput,
    groupMap: Map<string, string>,
    tx?: DBTransaction
  ): Promise<UserSelectType> {
    assertNonProduction();

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

  export async function upsertManyDemoUsers(
    inputs: DemoUserUpsertInput[],
    groupMap: Map<string, string>
  ): Promise<UserSelectType[]> {
    assertNonProduction();
    const results: UserSelectType[] = [];
    for (const input of inputs) {
      const user = await upsertDemoUser(input, groupMap);
      results.push(user);
      logger.debug("Bootstrap user ensured", { email: input.email });
    }
    return results;
  }

  export async function findStaffProfilesByUserIds(userIds: readonly string[]) {
    const profiles = await Promise.all(userIds.map(userId => StaffProfileRepository.findByUserId(userId)));
    return profiles.filter((profile): profile is NonNullable<typeof profile> => profile != null);
  }

  export async function updateAvatarUrl(userId: string, avatarUrl: string, tx?: DBTransaction): Promise<void> {
    assertNonProduction();
    await UserRepository.updateProfileFields(userId, { avatarUrl }, undefined, tx);
  }
}
