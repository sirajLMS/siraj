import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teacherImportantNotes } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type {
  TeacherImportantNoteSelectType,
  TeacherImportantNoteSubmitInput,
  TeacherImportantNoteUpdateInput,
} from "@/backend/types";
import type { DBTransaction } from "../db.types";

export namespace TeacherNotesRepository {
  export async function getActiveNotes(
    teacherId?: string,
    tx?: DBTransaction
  ): Promise<TeacherImportantNoteSelectType[]> {
    try {
      const client = tx ?? db;
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
    locale?: string,
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
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("noteCreateFailed"));
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
      const [existing] = await t
        .select()
        .from(teacherImportantNotes)
        .where(and(eq(teacherImportantNotes.id, id), isNull(teacherImportantNotes.deletedAt)))
        .limit(1);

      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

      if (!existing) {
        throw new Error(tFunc("noteNotFound", { id }));
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

  export async function deleteNote(id: string, locale?: string, tx?: DBTransaction): Promise<{ id: string }> {
    const run = async (t: DBTransaction): Promise<{ id: string }> => {
      const [existing] = await t
        .select()
        .from(teacherImportantNotes)
        .where(and(eq(teacherImportantNotes.id, id), isNull(teacherImportantNotes.deletedAt)))
        .limit(1);

      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

      if (!existing) {
        throw new Error(tFunc("noteNotFound", { id }));
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
      const client = tx ?? db;
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
}
