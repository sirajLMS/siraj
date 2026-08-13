import { and, desc, eq } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { meetingProviderTokens } from "@/backend/db/schema";
import type { DBTransaction, MeetingProviderTokenSelectType, MeetingProviderTokenUpsertInput } from "@/backend/types";

export namespace MeetingProviderTokenRepository {
  export async function getByUserAndProvider(
    userId: string,
    providerSlug: string,
    tx?: DBTransaction
  ): Promise<MeetingProviderTokenSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client
      .select()
      .from(meetingProviderTokens)
      .where(and(eq(meetingProviderTokens.userId, userId), eq(meetingProviderTokens.providerSlug, providerSlug)))
      .limit(1);
    return row ?? null;
  }

  export async function listByUser(userId: string, tx?: DBTransaction): Promise<MeetingProviderTokenSelectType[]> {
    const client = queryDb(tx);
    return client
      .select()
      .from(meetingProviderTokens)
      .where(eq(meetingProviderTokens.userId, userId))
      .orderBy(desc(meetingProviderTokens.updatedAt));
  }

  export async function listByProvider(
    providerSlug: string,
    tx?: DBTransaction
  ): Promise<MeetingProviderTokenSelectType[]> {
    const client = queryDb(tx);
    return client
      .select()
      .from(meetingProviderTokens)
      .where(eq(meetingProviderTokens.providerSlug, providerSlug))
      .orderBy(desc(meetingProviderTokens.updatedAt));
  }

  export async function upsert(
    input: MeetingProviderTokenUpsertInput,
    tx?: DBTransaction
  ): Promise<MeetingProviderTokenSelectType> {
    const now = new Date();
    const values = {
      userId: input.userId,
      providerSlug: input.providerSlug,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      expiresAt: input.expiresAt ?? null,
      scopes: input.scopes ?? [],
      updatedAt: now,
    };

    const run = async (t: DBTransaction): Promise<MeetingProviderTokenSelectType> => {
      const [existing] = await t
        .select()
        .from(meetingProviderTokens)
        .where(
          and(
            eq(meetingProviderTokens.userId, input.userId),
            eq(meetingProviderTokens.providerSlug, input.providerSlug)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await t
          .update(meetingProviderTokens)
          .set(values)
          .where(eq(meetingProviderTokens.id, existing.id))
          .returning();
        if (!updated) {
          throw new Error("Failed to update meeting provider token");
        }
        return updated;
      }

      const [row] = await t
        .insert(meetingProviderTokens)
        .values({ ...values, createdAt: now })
        .returning();
      if (!row) {
        throw new Error("Failed to insert meeting provider token");
      }
      return row;
    };

    if (tx) return run(tx);
    return db.transaction(run);
  }

  export async function deleteByUserAndProvider(
    userId: string,
    providerSlug: string,
    tx?: DBTransaction
  ): Promise<void> {
    const client = queryDb(tx);
    await client
      .delete(meetingProviderTokens)
      .where(and(eq(meetingProviderTokens.userId, userId), eq(meetingProviderTokens.providerSlug, providerSlug)));
  }
}
