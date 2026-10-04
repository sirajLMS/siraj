import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { teacherImportantNotes } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  DBTransaction,
  TeacherImportantNoteSelectType,
  TeacherImportantNoteSubmitInput,
  TeacherImportantNoteUpdateInput,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Loads a live (non-deleted) teacher note by id or throws the localized
 * not-found error shared by the mutating repository methods.
 */
async function requireActiveNoteOrThrow(
  t: DBTransaction,
  id: string,
  locale?: string
): Promise<TeacherImportantNoteSelectType> {
  const [existing] = await t
    .select()
    .from(teacherImportantNotes)
    .where(and(eq(teacherImportantNotes.id, id), isNull(teacherImportantNotes.deletedAt)))
    .limit(1);

  if (!existing) {
    const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(i18n.teacher.noteNotFound(id));
  }

  return existing;
}

export namespace TeacherNotesRepository {
  export async function getActiveNotes(
    teacherId?: string,
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType[]> {
    try {
      const client = queryDb(tx);
      const now = new Date();
      const conditions = [
        eq(teacherImportantNotes.isPublished, true),
        isNull(teacherImportantNotes.deletedAt),
        or(isNull(teacherImportantNotes.expiresAt), gt(teacherImportantNotes.expiresAt, now)),
      ];
      if (teacherId) {
        conditions.push(eq(teacherImportantNotes.teacherId, teacherId));
      }
      return await client
        .select()
        .from(teacherImportantNotes)
        .where(and(...conditions))
        .orderBy(desc(teacherImportantNotes.priority));
    } catch (error) {
      logger.error("Error fetching active teacher notes:", error);
      throw error;
    }
  }

  export async function createNote(
    input: TeacherImportantNoteSubmitInput & { createdByUserId: string; teacherId: string | null },
    _locale?: string,
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType> {
    const run = async (t: DBTransaction): Promise<TeacherImportantNoteSelectType> => {
      const [result] = await t
        .insert(teacherImportantNotes)
        .values({
          title: input.title,
          body: input.body ?? null,
          isPublished: input.isPublished ?? false,
          priority: input.priority ?? 0,
          startsAt: input.startsAt ?? null,
          expiresAt: input.expiresAt ?? null,
          teacherId: input.teacherId ?? null,
          createdByUserId: input.createdByUserId,
        })
        .returning();

      if (!result) {
        const { teacher } = getServerTranslations(_locale ?? "en").errorsTranslations;
        throw new Error(teacher.noteCreateFailed);
      }

      logger.info("Teacher note created", { noteId: result.id, title: result.title });

      return result;
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error("Error creating teacher note:", error);
      throw error;
    }
  }

  export async function updateNote(
    id: string,
    input: TeacherImportantNoteUpdateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType> {
    const run = async (t: DBTransaction): Promise<TeacherImportantNoteSelectType> => {
      const existing = await requireActiveNoteOrThrow(t, id, locale);

      const now = new Date();
      const [updated] = await t
        .update(teacherImportantNotes)
        .set({
          title: input.title ?? existing.title,
          body: input.body === undefined ? existing.body : input.body,
          isPublished: input.isPublished ?? existing.isPublished,
          priority: input.priority ?? existing.priority,
          startsAt: input.startsAt === undefined ? existing.startsAt : input.startsAt,
          expiresAt: input.expiresAt === undefined ? existing.expiresAt : input.expiresAt,
          updatedAt: now,
        })
        .where(eq(teacherImportantNotes.id, id))
        .returning();

      return updated;
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error updating teacher note with ID ${id}:`, error);
      throw error;
    }
  }

  export async function deleteNote(id: string, locale?: string, tx?: DBTransaction): Promise<{ id: string }> {
    const run = async (t: DBTransaction): Promise<{ id: string }> => {
      await requireActiveNoteOrThrow(t, id, locale);

      const now = new Date();
      await t
        .update(teacherImportantNotes)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(teacherImportantNotes.id, id));

      return { id };
    };

    try {
      if (tx) {
        return await run(tx);
      }
      return await db.transaction(run);
    } catch (error) {
      logger.error(`Error deleting teacher note with ID ${id}:`, error);
      throw error;
    }
  }

  export async function findByTitles(
    titles: readonly string[],
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType[]> {
    if (titles.length === 0) return [];
    try {
      const client = queryDb(tx);
      return await client
        .select()
        .from(teacherImportantNotes)
        .where(and(inArray(teacherImportantNotes.title, [...titles]), isNull(teacherImportantNotes.deletedAt)));
    } catch (error) {
      logger.error("Error finding teacher notes by titles:", error);
      throw error;
    }
  }

  export async function createMany(
    inputs: readonly (TeacherImportantNoteSubmitInput & { createdByUserId: string; teacherId: string | null })[],
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType[]> {
    if (inputs.length === 0) return [];

    return inputs.reduce<Promise<TeacherImportantNoteSelectType[]>>(async (prev, input) => {
      const acc = await prev;
      const existing = await findByTitles([input.title], tx);
      if (existing[0]) {
        return [...acc, existing[0]];
      }
      const created = await createNote(input, undefined, tx);
      return [...acc, created];
    }, Promise.resolve([]));
  }
}
