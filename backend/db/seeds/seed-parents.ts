import { db } from "@/backend/db/drizzleDb";
import { parents } from "@/backend/db/schema/parents";
import logger from "@/backend/lib/logger";
import type { UserEntity } from "@/backend/types";

export async function seedOrGet(users: UserEntity[]) {
  logger.info("Seeding system parents...");
  const now = new Date();

  // Find the parent user
  const parentUser = users.find(u => u.email === "parent@siraj.local");
  if (!parentUser) {
    throw new Error("Parent user not found in seed data.");
  }

  const [insertedParent] = await db
    .insert(parents)
    .values({
      userId: parentUser.id,
      status: "REGULAR",
      timezone: "Africa/Cairo",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: parents.userId,
      set: {
        status: "REGULAR",
        timezone: "Africa/Cairo",
        updatedAt: now,
      },
    })
    .returning();

  logger.info("System parents seeded.");
  return [insertedParent];
}
