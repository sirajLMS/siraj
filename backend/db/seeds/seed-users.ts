import { db } from "@/backend/db/drizzleDb";
import {
  permissionGroups as permissionGroupsSchema,
  staffProfiles,
  userPermissionGroups,
  users,
} from "@/backend/db/schema";
import { hashPassword } from "@/backend/lib/auth/password";
import logger from "@/backend/lib/logger";
import type { PermissionGroupEntity } from "@/backend/types";
import { DEFAULT_SEED_ADMIN_PASSWORD, INTERNAL_DEMO_USERS } from "@/shared/demo-users";
import {
  buildExtraParentUserSpecs,
  buildExtraTeacherUserSpecs,
  loadSeedConfig,
  type SeedConfig,
  type SeedUserSpec,
} from "./lib";

async function seedUserFromSpec(
  spec: SeedUserSpec | (typeof INTERNAL_DEMO_USERS)[0],
  groupMap: Map<string, string>,
  now: Date
) {
  const plainPassword =
    "plainPassword" in spec ? (spec.plainPassword ?? DEFAULT_SEED_ADMIN_PASSWORD) : DEFAULT_SEED_ADMIN_PASSWORD;
  const hashedPassword = await hashPassword(plainPassword);

  const [insertedUser] = await db
    .insert(users)
    .values({
      name: spec.name,
      email: spec.email,
      password: hashedPassword,
      isSuperAdmin: spec.isSuperAdmin,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: spec.name,
        isSuperAdmin: spec.isSuperAdmin,
        updatedAt: now,
      },
    })
    .returning();

  const groupId = groupMap.get(spec.groupSlug);
  if (groupId) {
    await db
      .insert(userPermissionGroups)
      .values({
        userId: insertedUser.id,
        groupId: groupId,
        assignedAt: now,
      })
      .onConflictDoNothing();

    if (["super_admin", "academy_admin", "staff_default"].includes(spec.groupSlug)) {
      await db
        .insert(staffProfiles)
        .values({
          userId: insertedUser.id,
          status: "ACTIVATED",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }

  return insertedUser;
}

export async function seedOrGet(permissionGroups?: PermissionGroupEntity[], config?: SeedConfig) {
  logger.info("Seeding system users...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  const groups = permissionGroups || (await db.select().from(permissionGroupsSchema));
  const groupMap = new Map(groups.map(g => [g.slug, g.id]));

  const results = [];

  for (const u of INTERNAL_DEMO_USERS) {
    const insertedUser = await seedUserFromSpec(u, groupMap, now);
    results.push(insertedUser);
  }

  const extraSpecs = [...buildExtraTeacherUserSpecs(seedConfig), ...buildExtraParentUserSpecs(seedConfig)];
  for (const spec of extraSpecs) {
    const insertedUser = await seedUserFromSpec(spec, groupMap, now);
    results.push(insertedUser);
  }

  logger.info(`System users seeded (${results.length} total).`);
  return results;
}
