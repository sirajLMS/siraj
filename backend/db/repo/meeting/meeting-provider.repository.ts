import { asc, eq, inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { meetingProviders, userMeetingConfigs } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  MeetingProviderSelectType,
  MeetingProviderSubmitInput,
  UpdateMeetingProviderInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

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

  export async function getById(id: string, tx?: DBTransaction): Promise<MeetingProviderSelectType | null> {
    const client = tx ?? db;
    const [row] = await client.select().from(meetingProviders).where(eq(meetingProviders.id, id)).limit(1);
    return row ?? null;
  }

  export async function getByIds(ids: string[], tx?: DBTransaction): Promise<MeetingProviderSelectType[]> {
    if (ids.length === 0) return [];
    const client = tx ?? db;
    return client.select().from(meetingProviders).where(inArray(meetingProviders.id, ids));
  }

  export async function getByIdOrThrow(
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingProviderSelectType> {
    const row = await getById(id, tx);
    if (!row) {
      throw new Error(tErrors.meetingProviderNotFound(id));
    }
    return row;
  }

  export async function getBySlug(slug: string, tx?: DBTransaction): Promise<MeetingProviderSelectType | null> {
    const client = tx ?? db;
    const [row] = await client.select().from(meetingProviders).where(eq(meetingProviders.slug, slug)).limit(1);
    return row ?? null;
  }

  export async function create(
    input: MeetingProviderSubmitInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
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
        throw new Error(tErrors.meetingProviderCreateFailed);
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
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingProviderSelectType> {
    const run = async (t: DBTransaction): Promise<MeetingProviderSelectType> => {
      await getByIdOrThrow(id, tErrors, t);
      const [result] = await t
        .update(meetingProviders)
        .set({
          ...(Object.hasOwn(input, "slug") ? { slug: input.slug } : {}),
          ...(Object.hasOwn(input, "name") ? { name: input.name } : {}),
          ...(Object.hasOwn(input, "description") ? { description: input.description } : {}),
          ...(Object.hasOwn(input, "instructions") ? { instructions: input.instructions } : {}),
          ...(Object.hasOwn(input, "urlAllowlist") ? { urlAllowlist: input.urlAllowlist } : {}),
          ...(Object.hasOwn(input, "urlExample") ? { urlExample: input.urlExample } : {}),
          ...(Object.hasOwn(input, "logoUrl") ? { logoUrl: input.logoUrl } : {}),
          ...(Object.hasOwn(input, "fieldSchema") ? { fieldSchema: input.fieldSchema } : {}),
          ...(Object.hasOwn(input, "isActive") ? { isActive: input.isActive } : {}),
          updatedAt: new Date(),
        })
        .where(eq(meetingProviders.id, id))
        .returning();

      if (!result) {
        throw new Error(tErrors.meetingProviderUpdateFailed);
      }

      return result;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function upsertMany(
    inputs: readonly MeetingProviderSubmitInput[],
    _tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingProviderSelectType[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<MeetingProviderSelectType[]> => {
      const now = new Date();
      const results: MeetingProviderSelectType[] = [];

      for (const input of inputs) {
        const [row] = await t
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
          .onConflictDoUpdate({
            target: meetingProviders.slug,
            set: {
              name: input.name,
              description: input.description ?? null,
              instructions: input.instructions ?? null,
              urlAllowlist: input.urlAllowlist,
              urlExample: input.urlExample ?? null,
              logoUrl: input.logoUrl ?? null,
              fieldSchema: input.fieldSchema,
              isActive: input.isActive ?? true,
              updatedAt: now,
            },
          })
          .returning();

        if (row) {
          results.push(row);
        }
      }

      return results;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function deleteProvider(id: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<void> {
    const run = async (t: DBTransaction): Promise<void> => {
      await getByIdOrThrow(id, tErrors, t);
      const [inUse] = await t
        .select({ id: userMeetingConfigs.id })
        .from(userMeetingConfigs)
        .where(eq(userMeetingConfigs.providerId, id))
        .limit(1);

      if (inUse) {
        throw new Error(tErrors.meetingProviderInUse);
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
