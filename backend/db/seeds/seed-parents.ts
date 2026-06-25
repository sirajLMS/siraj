import { db } from "@/backend/db/drizzleDb";
import { parents } from "@/backend/db/schema/parents";
import logger from "@/backend/lib/logger";
import type { UserEntity } from "@/backend/types";
import { pickTimezoneForIndex, type SeedConfig } from "./lib";

async function upsertParent(userId: string, timezone: string, now: Date) {
  const [insertedParent] = await db
    .insert(parents)
    .values({
      userId,
      status: "REGULAR",
      timezone,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: parents.userId,
      set: {
        status: "REGULAR",
        timezone,
        updatedAt: now,
      },
    })
    .returning();

  return insertedParent;
}

export async function seedOrGet(users: UserEntity[], _config?: SeedConfig) {
  logger.info("Seeding system parents...");
  const now = new Date();

  const parentUsers = users.filter(
    u => u.email === "parent@siraj.local" || /^parent-\d+@seed\.siraj\.local$/.test(u.email)
  );

  if (parentUsers.length === 0) {
    throw new Error("No parent users found in seed data.");
  }

  const results = [];
  for (let i = 0; i < parentUsers.length; i++) {
    const user = parentUsers[i];
    const timezone = i === 0 ? "Africa/Cairo" : pickTimezoneForIndex(i);
    const parent = await upsertParent(user.id, timezone, now);
    results.push(parent);
  }

  logger.info(`System parents seeded (${results.length} total).`);
  return results;
}
