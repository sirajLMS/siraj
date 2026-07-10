import { asc, eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { meetingProviders, userMeetingConfigs } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type {
  MeetingProviderSelectType,
  MeetingProviderSubmitInput,
  UpdateMeetingProviderInput,
} from "@/backend/types/meeting/meeting-provider.types";

export namespace MeetingProviderRepository {
  export async function listActive(tx?: DBTransaction): Promise<MeetingProviderSelectType[]> {
    const client = tx ?? db;
    return client
      .select()
      .from(meetingProviders)
      .where(eq(meetingProviders.isActive, true))
      .orderBy(asc(meetingProviders.slug));
  }

  export async function listAll(tx?: DBTransaction): Promise<MeetingProviderSelectType[]> {
    const client = tx ?? db;
    return client.select().from(meetingProviders).orderBy(asc(meetingProviders.slug));
  }

  export async function getById(
    id: string,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<MeetingProviderSelectType | null> {
    const client = tx ?? db;
    const [row] = await client.select().from(meetingProviders).where(eq(meetingProviders.id, id)).limit(1);
    return row ?? null;
  }

  export async function getByIdOrThrow(
    id: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<MeetingProviderSelectType> {
    const row = await getById(id, tx, locale);
    if (!row) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("meetingProviderNotFound", { id }));
    }
    return row;
  }

  export async function getBySlug(
    slug: string,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<MeetingProviderSelectType | null> {
    const client = tx ?? db;
    const [row] = await client.select().from(meetingProviders).where(eq(meetingProviders.slug, slug)).limit(1);
    return row ?? null;
  }

  export async function create(
    input: MeetingProviderSubmitInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<MeetingProviderSelectType> {
    const run = async (t: DBTransaction): Promise<MeetingProviderSelectType> => {
      const now = new Date();
      const [result] = await t
        .insert(meetingProviders)
        .values({
          slug: input.slug,
          name: input.name,
          description: input.description ?? null,
          instructions: input.instructions ?? null,
          urlAllowlist: input.urlAllowlist,
          urlExample: input.urlExample ?? null,
          logoUrl: input.logoUrl ?? null,
          fieldSchema: input.fieldSchema,
          isActive: input.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!result) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("meetingProviderCreateFailed"));
      }

      logger.info("Meeting provider created", { providerId: result.id, slug: result.slug });
      return result;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function update(
    id: string,
    input: UpdateMeetingProviderInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<MeetingProviderSelectType> {
    const run = async (t: DBTransaction): Promise<MeetingProviderSelectType> => {
      await getByIdOrThrow(id, t, locale);
      const [result] = await t
        .update(meetingProviders)
        .set({
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
          ...(input.urlAllowlist !== undefined ? { urlAllowlist: input.urlAllowlist } : {}),
          ...(input.urlExample !== undefined ? { urlExample: input.urlExample } : {}),
          ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
          ...(input.fieldSchema !== undefined ? { fieldSchema: input.fieldSchema } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          updatedAt: new Date(),
        })
        .where(eq(meetingProviders.id, id))
        .returning();

      if (!result) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("meetingProviderUpdateFailed"));
      }

      return result;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function deleteProvider(id: string, tx?: DBTransaction, locale?: string): Promise<void> {
    const run = async (t: DBTransaction): Promise<void> => {
      await getByIdOrThrow(id, t, locale);
      const [inUse] = await t
        .select({ id: userMeetingConfigs.id })
        .from(userMeetingConfigs)
        .where(eq(userMeetingConfigs.providerId, id))
        .limit(1);

      if (inUse) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("meetingProviderInUse"));
      }

      await t.delete(meetingProviders).where(eq(meetingProviders.id, id));
    };

    if (tx) {
      await run(tx);
      return;
    }
    await db.transaction(run);
  }
}
