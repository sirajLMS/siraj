import { and, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/types";
import { db } from "@/backend/db/drizzleDb";
import { teacherImportantNotes } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  TeacherImportantNoteSelectType,
  TeacherImportantNoteSubmitInput,
  TeacherImportantNoteUpdateInput,
} from "@/backend/types";

export namespace TeacherNotesRepository {
  export async function getActiveNotes(
    teacherId?: string,
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType[]> {
    try {
      const client = queryDb(tx);
      const now = sql`NOW()`;
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
        throw new Error("Failed to create teacher note");
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
    _locale?: string,
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType> {
    const run = async (t: DBTransaction): Promise<TeacherImportantNoteSelectType> => {
      const [existing] = await t
        .select()
        .from(teacherImportantNotes)
        .where(and(eq(teacherImportantNotes.id, id), isNull(teacherImportantNotes.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new Error(`Note ${id} not found`);
      }

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

  export async function deleteNote(id: string, _locale?: string, tx?: DBTransaction): Promise<{ id: string }> {
    const run = async (t: DBTransaction): Promise<{ id: string }> => {
      const [existing] = await t
        .select()
        .from(teacherImportantNotes)
        .where(and(eq(teacherImportantNotes.id, id), isNull(teacherImportantNotes.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new Error(`Note ${id} not found`);
      }

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

  export async function listAllNotes(
    teacherId?: string,
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType[]> {
    try {
      const client = queryDb(tx);
      const conditions = [isNull(teacherImportantNotes.deletedAt)];
      if (teacherId) {
        conditions.push(eq(teacherImportantNotes.teacherId, teacherId));
      }
      return await client
        .select()
        .from(teacherImportantNotes)
        .where(and(...conditions))
        .orderBy(desc(teacherImportantNotes.priority));
    } catch (error) {
      logger.error("Error listing all teacher notes:", error);
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

    return Promise.all(
      inputs.map(async input => {
        const existing = await findByTitles([input.title], tx);
        if (existing[0]) {
          return existing[0];
        }
        return createNote(input, undefined, tx);
      })
    );
  }
}
