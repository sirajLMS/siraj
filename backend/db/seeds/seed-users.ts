import { db } from "@/backend/db/drizzleDb";
import { userPermissionGroups, users } from "@/backend/db/schema";
import { hashPassword } from "@/backend/lib/auth/password";
import logger from "@/backend/lib/logger";
import type { PermissionGroupEntity } from "@/backend/types/auth.types";
import { INTERNAL_DEMO_USERS } from "@/shared/demo-users";
import { seedOrGet as seedOrGetPermissions } from "./seed-permissions";

async function seedUser(u: (typeof INTERNAL_DEMO_USERS)[0], groupMap: Map<string, string>, now: Date) {
  const hashedPassword = await hashPassword(u.plainPassword || "12345678");

  const [insertedUser] = await db
    .insert(users)
    .values({
      name: u.name,
      email: u.email,
      password: hashedPassword,
      isSuperAdmin: u.isSuperAdmin,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: u.name,
        isSuperAdmin: u.isSuperAdmin,
        updatedAt: now,
      },
    })
    .returning();

  const groupId = groupMap.get(u.groupSlug);
  if (groupId) {
    await db
      .insert(userPermissionGroups)
      .values({
        userId: insertedUser.id,
        groupId: groupId,
        assignedAt: now,
      })
      .onConflictDoNothing();
  }

  return insertedUser;
}

export async function seedOrGet(permissionGroups?: PermissionGroupEntity[]) {
  logger.info("Seeding system users...");
  const now = new Date();

  // Ensure permission groups exist and get them
  const groups = permissionGroups || (await seedOrGetPermissions());
  const groupMap = new Map(groups.map(g => [g.slug, g.id]));

  const results = [];

  for (const u of INTERNAL_DEMO_USERS) {
    const insertedUser = await seedUser(u, groupMap, now);
    results.push(insertedUser);
  }

  logger.info("System users seeded.");
  return results;
}
