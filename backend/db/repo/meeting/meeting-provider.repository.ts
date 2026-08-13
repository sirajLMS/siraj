import { asc, eq, inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { meetingProviders, userMeetingConfigs } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  DBTransaction,
  MeetingProviderSelectType,
  MeetingProviderSubmitInput,
  UpdateMeetingProviderInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

function buildMeetingProviderInsertValues(input: MeetingProviderSubmitInput, now: Date) {
  return {
    slug: input.slug,
    providerKind: input.providerKind,
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
  };
}

function buildMeetingProviderConflictSet(values: ReturnType<typeof buildMeetingProviderInsertValues>) {
  return {
    providerKind: values.providerKind,
    name: values.name,
    description: values.description,
    instructions: values.instructions,
    urlAllowlist: values.urlAllowlist,
    urlExample: values.urlExample,
    logoUrl: values.logoUrl,
    fieldSchema: values.fieldSchema,
    isActive: values.isActive,
    updatedAt: values.updatedAt,
  };
}

export namespace MeetingProviderRepository {
  export async function listActive(tx?: DBTransaction): Promise<MeetingProviderSelectType[]> {
    const client = queryDb(tx);
    return client
      .select()
      .from(meetingProviders)
      .where(eq(meetingProviders.isActive, true))
      .orderBy(asc(meetingProviders.slug))
      .limit(100);
  }

  export async function listAll(tx?: DBTransaction): Promise<MeetingProviderSelectType[]> {
    const client = queryDb(tx);
    return client.select().from(meetingProviders).orderBy(asc(meetingProviders.slug)).limit(100);
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<MeetingProviderSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client.select().from(meetingProviders).where(eq(meetingProviders.id, id)).limit(1);
    return row ?? null;
  }

  export async function getByIds(ids: string[], tx?: DBTransaction): Promise<MeetingProviderSelectType[]> {
    if (ids.length === 0) return [];
    const client = queryDb(tx);
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
    const client = queryDb(tx);
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
        .values(buildMeetingProviderInsertValues(input, now))
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
          ...(Object.hasOwn(input, "providerKind") ? { providerKind: input.providerKind } : {}),
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
      const insertOne = async (input: MeetingProviderSubmitInput): Promise<MeetingProviderSelectType | null> => {
        const insertValues = buildMeetingProviderInsertValues(input, now);
        const [row] = await t
          .insert(meetingProviders)
          .values(insertValues)
          .onConflictDoUpdate({
            target: meetingProviders.slug,
            set: buildMeetingProviderConflictSet(insertValues),
          })
          .returning();

        return row ?? null;
      };

      const rows = await inputs.reduce(
        async (prev, input) => {
          const acc = await prev;
          const row = await insertOne(input);
          if (row) acc.push(row);
          return acc;
        },
        Promise.resolve([] as MeetingProviderSelectType[])
      );

      return rows;
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
