import { eq, inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import {
  classInstanceFiles,
  complaintFiles,
  invoiceFiles,
  learningResourceFiles,
  parentFiles,
  recurringScheduleFiles,
  staffProfileFiles,
  storageFiles,
  studentFiles,
  teacherFiles,
  userFiles,
} from "@/backend/db/schema";
import { logger } from "@/backend/lib";
import type { DBTransaction } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export interface JunctionInsertParams {
  table: string;
  fileId: string;
  refId: string;
  type: string;
  createdAt: Date;
}

function isPublicStoragePath(path: string): boolean {
  return path === "public" || path.startsWith("public/");
}

/**
 * Domain junction writers (invoice files, complaint attachments) must never
 * reference a file stored under the anonymous public namespace. Resolves the
 * stored path from the junction insert's fileId and rejects public paths.
 */
export async function assertFilePathNotPublic(fileId: string, tx?: DBTransaction, locale?: string): Promise<void> {
  const q = queryDb(tx);
  const [row] = await q
    .select({ path: storageFiles.path })
    .from(storageFiles)
    .where(eq(storageFiles.id, fileId))
    .limit(1);
  if (row && isPublicStoragePath(row.path)) {
    logger.warn("Blocked domain file link into public namespace", { fileId, path: row.path });
    const { file } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(file.forbidden);
  }
}

/**
 * Performs the actual junction table insertion in a type-safe way.
 */
export async function insertJunctionRow(
  params: JunctionInsertParams,
  locale?: string,
  tx?: DBTransaction
): Promise<void> {
  const { table, fileId, refId, type, createdAt } = params;
  const dbToQuery = tx ?? db;
  switch (table) {
    case "users":
      await dbToQuery.insert(userFiles).values({ fileId, userId: refId, usageType: type, createdAt });
      break;
    case "teachers":
      await dbToQuery.insert(teacherFiles).values({ fileId, teacherId: refId, usageType: type, createdAt });
      break;
    case "students":
      await dbToQuery.insert(studentFiles).values({ fileId, studentId: refId, usageType: type, createdAt });
      break;
    case "parents":
      await dbToQuery.insert(parentFiles).values({ fileId, parentId: refId, usageType: type, createdAt });
      break;
    case "invoices":
      await assertFilePathNotPublic(fileId, tx, locale);
      await dbToQuery.insert(invoiceFiles).values({ fileId, invoiceId: refId, usageType: type, createdAt });
      break;
    case "complaints":
      await assertFilePathNotPublic(fileId, tx, locale);
      await dbToQuery.insert(complaintFiles).values({ fileId, complaintId: refId, usageType: type, createdAt });
      break;
    case "learning_resources":
      await dbToQuery
        .insert(learningResourceFiles)
        .values({ fileId, learningResourceId: refId, usageType: type, createdAt });
      break;
    case "staff_profiles":
      await dbToQuery.insert(staffProfileFiles).values({ fileId, staffProfileId: refId, usageType: type, createdAt });
      break;
    case "recurring_schedules":
      await dbToQuery
        .insert(recurringScheduleFiles)
        .values({ fileId, recurringScheduleId: refId, usageType: type, createdAt });
      break;
    case "class_instances":
      await dbToQuery.insert(classInstanceFiles).values({ fileId, classInstanceId: refId, usageType: type, createdAt });
      break;
    default: {
      const { invalidInput } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(`${invalidInput} Unsupported table: ${table}`);
    }
  }
}

/**
 * Right-to-be-forgotten scrub: delete the file-junction rows linking
 * storage files to the anonymized subject (user, parent, teacher, and
 * student identities).
 */
export async function deleteOwnerFileJunctionRows(
  owner: {
    readonly userId: string;
    readonly parentId?: string | null;
    readonly teacherId?: string | null;
    readonly studentIds: readonly string[];
  },
  tx: DBTransaction
): Promise<void> {
  await tx.delete(userFiles).where(eq(userFiles.userId, owner.userId));
  if (owner.parentId) {
    await tx.delete(parentFiles).where(eq(parentFiles.parentId, owner.parentId));
  }
  if (owner.teacherId) {
    await tx.delete(teacherFiles).where(eq(teacherFiles.teacherId, owner.teacherId));
  }
  if (owner.studentIds.length > 0) {
    await tx.delete(studentFiles).where(inArray(studentFiles.studentId, [...owner.studentIds]));
  }
}
