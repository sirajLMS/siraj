import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import {
  classInstanceFiles,
  complaintFiles,
  invoiceFiles,
  learningResourceFiles,
  parentFiles,
  recurringScheduleFiles,
  staffProfileFiles,
  storageDirectories,
  storageFiles,
  studentFiles,
  teacherFiles,
  userFiles,
} from "@/backend/db/schema";
import { logger } from "@/backend/lib";
import { isAllowedMimeType } from "@/backend/lib/storage/mime-allowlist";
import type * as StorageTypes from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { getServerTranslations } from "@/shared/locale";

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export namespace StorageDbRepository {
  // File operations
  export const fileById = async (id: string): Promise<StorageTypes.FileSelectType | null> => {
    const results = await db.select().from(storageFiles).where(eq(storageFiles.id, id)).limit(1);
    return results[0] ?? null;
  };

  export const fileByPath = async (path: string): Promise<StorageTypes.FileSelectType | null> => {
    const results = await db.select().from(storageFiles).where(eq(storageFiles.path, path)).limit(1);
    return results[0] ?? null;
  };

  export const filesByPaths = async (paths: string[]): Promise<StorageTypes.FileSelectType[]> => {
    if (paths.length === 0) return [];
    return await db.select().from(storageFiles).where(inArray(storageFiles.path, paths));
  };

  export const createFile = async (
    path: string,
    isProtected: boolean = false
  ): Promise<StorageTypes.FileSelectType> => {
    const results = await db
      .insert(storageFiles)
      .values({ path, isProtected })
      .onConflictDoUpdate({
        target: storageFiles.path,
        set: { isProtected },
      })
      .returning();
    return results[0];
  };

  export const updateFile = async (
    file: StorageTypes.FileInsertType & { id: string }
  ): Promise<StorageTypes.FileSelectType | undefined> => {
    const results = await db
      .update(storageFiles)
      .set({
        path: file.path,
        isProtected: file.isProtected,
      })
      .where(eq(storageFiles.id, file.id))
      .returning();
    return results[0];
  };

  export const deleteFile = async (path: string): Promise<boolean> => {
    try {
      await db.delete(storageFiles).where(eq(storageFiles.path, path));
      return true;
    } catch (error) {
      logger.error("Failed to delete file:", error);
      return false;
    }
  };

  // Directory operations
  export const directoryByPath = async (path: string): Promise<StorageTypes.DirectorySelectType | null> => {
    try {
      const result = await db.select().from(storageDirectories).where(eq(storageDirectories.path, path)).limit(1);
      return result[0] ?? null;
    } catch (err) {
      logger.error("Failed to find directory by path:", err);
      return null;
    }
  };

  export const directoriesByParentPath = async (parentPath?: string): Promise<StorageTypes.DirectorySelectType[]> => {
    if (parentPath) {
      return await db
        .select()
        .from(storageDirectories)
        .where(sql`${storageDirectories.path} LIKE ${escapeLikeWildcards(parentPath) + "/%"}`);
    }
    return await db.select().from(storageDirectories).limit(500);
  };

  export const directoriesByPaths = async (paths: string[]): Promise<StorageTypes.DirectorySelectType[]> => {
    if (paths.length === 0) return [];
    return await db.select().from(storageDirectories).where(inArray(storageDirectories.path, paths));
  };

  export const createDirectory = async (
    input: StorageTypes.FolderCreateInput
  ): Promise<StorageTypes.DirectorySelectType> => {
    const record = await ensureDirectoryRecord(input);
    return record;
  };

  export const ensureDirectoryRecord = async (
    input: StorageTypes.FolderCreateInput
  ): Promise<StorageTypes.DirectorySelectType> => {
    const permissions = input.permissions ?? {
      allowUploads: true,
      allowDelete: true,
      allowMove: true,
      allowCreateSubDirs: true,
      allowDeleteFiles: true,
      allowMoveFiles: true,
    };

    const [record] = await db
      .insert(storageDirectories)
      .values({
        path: input.path,
        allowUploads: permissions.allowUploads,
        allowDelete: permissions.allowDelete,
        allowMove: permissions.allowMove,
        allowCreateSubDirs: permissions.allowCreateSubDirs,
        allowDeleteFiles: permissions.allowDeleteFiles,
        allowMoveFiles: permissions.allowMoveFiles,
        isProtected: input.protected ?? false,
        protectChildren: input.protectChildren ?? false,
      })
      .onConflictDoUpdate({
        target: storageDirectories.path,
        set: {
          isProtected: input.protected ?? false,
          protectChildren: input.protectChildren ?? false,
        },
      })
      .returning();
    return record;
  };

  export const updateDirectory = async (
    directory: StorageTypes.DirectorySelectType
  ): Promise<StorageTypes.DirectorySelectType | undefined> => {
    const [updated] = await db
      .update(storageDirectories)
      .set({
        path: directory.path,
        allowUploads: directory.allowUploads,
        allowDelete: directory.allowDelete,
        allowMove: directory.allowMove,
        allowCreateSubDirs: directory.allowCreateSubDirs,
        allowDeleteFiles: directory.allowDeleteFiles,
        allowMoveFiles: directory.allowMoveFiles,
        isProtected: directory.isProtected,
        protectChildren: directory.protectChildren,
      })
      .where(eq(storageDirectories.id, directory.id))
      .returning();
    return updated;
  };

  export const deleteDirectory = async (path: string): Promise<boolean> => {
    try {
      await db.delete(storageDirectories).where(eq(storageDirectories.path, path));
      return true;
    } catch (error) {
      logger.error("Failed to delete directory:", error);
      return false;
    }
  };

  // File usage operations
  export const getFileUsages = async (filePath: string): Promise<StorageTypes.FileUsageInfo[]> => {
    const file = await fileByPath(filePath);
    if (!file) return [];

    const fId = file.id;
    const fPath = file.path;

    const [users, teachers, studentsRes, parents] = await fetchPersonUsages(fId);
    const [invoices, complaints, resources] = await fetchContentUsages(fId);
    const [staff, schedules, instances] = await fetchSystemUsages(fId);

    return [
      ...users.map(r => mapRowToUsage(r, fPath, r.userId, "users")),
      ...teachers.map(r => mapRowToUsage(r, fPath, r.teacherId, "teachers")),
      ...studentsRes.map(r => mapRowToUsage(r, fPath, r.studentId, "students")),
      ...parents.map(r => mapRowToUsage(r, fPath, r.parentId, "parents")),
      ...invoices.map(r => mapRowToUsage(r, fPath, r.invoiceId, "invoices")),
      ...complaints.map(r => mapRowToUsage(r, fPath, r.complaintId, "complaints")),
      ...resources.map(r => mapRowToUsage(r, fPath, r.learningResourceId, "learning_resources")),
      ...staff.map(r => mapRowToUsage(r, fPath, r.staffProfileId, "staff_profiles")),
      ...schedules.map(r => mapRowToUsage(r, fPath, r.recurringScheduleId, "recurring_schedules")),
      ...instances.map(r => mapRowToUsage(r, fPath, r.classInstanceId, "class_instances")),
    ];
  };

  async function fetchPersonUsages(fId: string) {
    return Promise.all([
      db
        .select({
          id: userFiles.id,
          userId: userFiles.userId,
          usageType: userFiles.usageType,
          createdAt: userFiles.createdAt,
        })
        .from(userFiles)
        .where(eq(userFiles.fileId, fId)),
      db
        .select({
          id: teacherFiles.id,
          teacherId: teacherFiles.teacherId,
          usageType: teacherFiles.usageType,
          createdAt: teacherFiles.createdAt,
        })
        .from(teacherFiles)
        .where(eq(teacherFiles.fileId, fId)),
      db
        .select({
          id: studentFiles.id,
          studentId: studentFiles.studentId,
          usageType: studentFiles.usageType,
          createdAt: studentFiles.createdAt,
        })
        .from(studentFiles)
        .where(eq(studentFiles.fileId, fId)),
      db
        .select({
          id: parentFiles.id,
          parentId: parentFiles.parentId,
          usageType: parentFiles.usageType,
          createdAt: parentFiles.createdAt,
        })
        .from(parentFiles)
        .where(eq(parentFiles.fileId, fId)),
    ]);
  }

  async function fetchContentUsages(fId: string) {
    return Promise.all([
      db
        .select({
          id: invoiceFiles.id,
          invoiceId: invoiceFiles.invoiceId,
          usageType: invoiceFiles.usageType,
          createdAt: invoiceFiles.createdAt,
        })
        .from(invoiceFiles)
        .where(eq(invoiceFiles.fileId, fId)),
      db
        .select({
          id: complaintFiles.id,
          complaintId: complaintFiles.complaintId,
          usageType: complaintFiles.usageType,
          createdAt: complaintFiles.createdAt,
        })
        .from(complaintFiles)
        .where(eq(complaintFiles.fileId, fId)),
      db
        .select({
          id: learningResourceFiles.id,
          learningResourceId: learningResourceFiles.learningResourceId,
          usageType: learningResourceFiles.usageType,
          createdAt: learningResourceFiles.createdAt,
        })
        .from(learningResourceFiles)
        .where(eq(learningResourceFiles.fileId, fId)),
    ]);
  }

  async function fetchSystemUsages(fId: string) {
    return Promise.all([
      db
        .select({
          id: staffProfileFiles.id,
          staffProfileId: staffProfileFiles.staffProfileId,
          usageType: staffProfileFiles.usageType,
          createdAt: staffProfileFiles.createdAt,
        })
        .from(staffProfileFiles)
        .where(eq(staffProfileFiles.fileId, fId)),
      db
        .select({
          id: recurringScheduleFiles.id,
          recurringScheduleId: recurringScheduleFiles.recurringScheduleId,
          usageType: recurringScheduleFiles.usageType,
          createdAt: recurringScheduleFiles.createdAt,
        })
        .from(recurringScheduleFiles)
        .where(eq(recurringScheduleFiles.fileId, fId)),
      db
        .select({
          id: classInstanceFiles.id,
          classInstanceId: classInstanceFiles.classInstanceId,
          usageType: classInstanceFiles.usageType,
          createdAt: classInstanceFiles.createdAt,
        })
        .from(classInstanceFiles)
        .where(eq(classInstanceFiles.fileId, fId)),
    ]);
  }

  function mapRowToUsage(
    r: { id: string; usageType: string; createdAt: Date },
    filePath: string,
    referenceId: string,
    referenceTable: StorageTypes.ValidReferenceTable
  ): StorageTypes.FileUsageInfo {
    return {
      id: r.id,
      filePath,
      usageType: r.usageType,
      referenceId,
      referenceTable,
      createdAt: r.createdAt,
    };
  }

  export const isFileInUse = async (filePath: string): Promise<boolean> => {
    const file = await fileByPath(filePath);
    if (!file) return false;

    const tables = [
      userFiles,
      teacherFiles,
      studentFiles,
      parentFiles,
      invoiceFiles,
      complaintFiles,
      learningResourceFiles,
      staffProfileFiles,
      recurringScheduleFiles,
      classInstanceFiles,
    ];

    const results = await Promise.all(
      tables.map(table => db.select({ id: table.id }).from(table).where(eq(table.fileId, file.id)).limit(1))
    );

    return results.some(rows => rows.length > 0);
  };

  export const registerFileUsage = async (
    input: StorageTypes.FileUsageRegisterInput,
    locale?: string
  ): Promise<StorageTypes.FileOperationResult> => {
    try {
      const { referenceTable, referenceId, usageType, filePath } = input;

      const file = await createFile(filePath);
      await performJunctionInsert(
        {
          table: referenceTable,
          fileId: file.id,
          refId: referenceId,
          type: usageType,
          createdAt: new Date(),
        },
        locale
      );

      return { success: true, message: "File usage registered successfully" };
    } catch (error) {
      logger.error("Failed to register file usage", { error: error instanceof Error ? error.message : String(error) });
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations.file;
      return { success: false, message: tErrors.fileUsageRegisterFailedGeneric };
    }
  };

  interface JunctionInsertParams {
    table: string;
    fileId: string;
    refId: string;
    type: string;
    createdAt: Date;
  }

  /**
   * Helper to perform the actual junction table insertion in a type-safe way.
   * Exported so StorageService can call it from the service layer.
   */
  export async function performJunctionInsert(params: JunctionInsertParams, locale?: string): Promise<void> {
    const { table, fileId, refId, type, createdAt } = params;
    switch (table) {
      case "users":
        await db.insert(userFiles).values({ fileId, userId: refId, usageType: type, createdAt });
        break;
      case "teachers":
        await db.insert(teacherFiles).values({ fileId, teacherId: refId, usageType: type, createdAt });
        break;
      case "students":
        await db.insert(studentFiles).values({ fileId, studentId: refId, usageType: type, createdAt });
        break;
      case "parents":
        await db.insert(parentFiles).values({ fileId, parentId: refId, usageType: type, createdAt });
        break;
      case "invoices":
        await db.insert(invoiceFiles).values({ fileId, invoiceId: refId, usageType: type, createdAt });
        break;
      case "complaints":
        await db.insert(complaintFiles).values({ fileId, complaintId: refId, usageType: type, createdAt });
        break;
      case "learning_resources":
        await db
          .insert(learningResourceFiles)
          .values({ fileId, learningResourceId: refId, usageType: type, createdAt });
        break;
      case "staff_profiles":
        await db.insert(staffProfileFiles).values({ fileId, staffProfileId: refId, usageType: type, createdAt });
        break;
      case "recurring_schedules":
        await db
          .insert(recurringScheduleFiles)
          .values({ fileId, recurringScheduleId: refId, usageType: type, createdAt });
        break;
      case "class_instances":
        await db.insert(classInstanceFiles).values({ fileId, classInstanceId: refId, usageType: type, createdAt });
        break;
      default: {
        const { invalidInput } = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(`${invalidInput} Unsupported table: ${table}`);
      }
    }
  }

  export const unregisterFileUsage = async (
    filePath: string,
    usageType: string,
    referenceId: string
  ): Promise<boolean> => {
    try {
      const file = await fileByPath(filePath);
      if (!file) return true;

      await deleteUsagesFromAllTables(file.id, usageType, referenceId);

      return true;
    } catch (error) {
      logger.error("Failed to unregister file usage:", error);
      return false;
    }
  };

  async function deleteUsagesFromAllTables(fileId: string, usageType: string, referenceId: string) {
    await Promise.all([
      deletePersonRelatedUsages(fileId, usageType, referenceId),
      deleteBusinessRelatedUsages(fileId, usageType, referenceId),
    ]);
  }

  async function deletePersonRelatedUsages(fileId: string, usageType: string, referenceId: string) {
    await Promise.all([
      db
        .delete(userFiles)
        .where(
          and(eq(userFiles.fileId, fileId), eq(userFiles.usageType, usageType), eq(userFiles.userId, referenceId))
        ),
      db
        .delete(teacherFiles)
        .where(
          and(
            eq(teacherFiles.fileId, fileId),
            eq(teacherFiles.usageType, usageType),
            eq(teacherFiles.teacherId, referenceId)
          )
        ),
      db
        .delete(studentFiles)
        .where(
          and(
            eq(studentFiles.fileId, fileId),
            eq(studentFiles.usageType, usageType),
            eq(studentFiles.studentId, referenceId)
          )
        ),
      db
        .delete(parentFiles)
        .where(
          and(
            eq(parentFiles.fileId, fileId),
            eq(parentFiles.usageType, usageType),
            eq(parentFiles.parentId, referenceId)
          )
        ),
      db
        .delete(staffProfileFiles)
        .where(
          and(
            eq(staffProfileFiles.fileId, fileId),
            eq(staffProfileFiles.usageType, usageType),
            eq(staffProfileFiles.staffProfileId, referenceId)
          )
        ),
    ]);
  }

  async function deleteBusinessRelatedUsages(fileId: string, usageType: string, referenceId: string) {
    await Promise.all([
      db
        .delete(invoiceFiles)
        .where(
          and(
            eq(invoiceFiles.fileId, fileId),
            eq(invoiceFiles.usageType, usageType),
            eq(invoiceFiles.invoiceId, referenceId)
          )
        ),
      db
        .delete(complaintFiles)
        .where(
          and(
            eq(complaintFiles.fileId, fileId),
            eq(complaintFiles.usageType, usageType),
            eq(complaintFiles.complaintId, referenceId)
          )
        ),
      db
        .delete(learningResourceFiles)
        .where(
          and(
            eq(learningResourceFiles.fileId, fileId),
            eq(learningResourceFiles.usageType, usageType),
            eq(learningResourceFiles.learningResourceId, referenceId)
          )
        ),
      db
        .delete(recurringScheduleFiles)
        .where(
          and(
            eq(recurringScheduleFiles.fileId, fileId),
            eq(recurringScheduleFiles.usageType, usageType),
            eq(recurringScheduleFiles.recurringScheduleId, referenceId)
          )
        ),
      db
        .delete(classInstanceFiles)
        .where(
          and(
            eq(classInstanceFiles.fileId, fileId),
            eq(classInstanceFiles.usageType, usageType),
            eq(classInstanceFiles.classInstanceId, referenceId)
          )
        ),
    ]);
  }

  // Business logic methods
  export const checkFileUsage = async (
    input: StorageTypes.FileUsageCheckInput
  ): Promise<StorageTypes.FileUsageResult> => {
    try {
      const usages = await getFileUsages(input.path);
      const isInUse = usages.length > 0;

      return {
        isInUse,
        usages,
        canDelete: !isInUse,
        deleteBlockReason: isInUse ? "File is currently being used" : undefined,
      };
    } catch (err) {
      logger.error("Error checking file usage:", err);
      return {
        isInUse: false,
        usages: [],
        canDelete: false,
        deleteBlockReason: "Unable to check file usage",
      };
    }
  };

  export const getFilesForParent = async (
    parentId: string,
    tx?: DBTransaction
  ): Promise<StorageTypes.LinkedFileReturnType[]> => {
    const q = queryDb(tx);

    const results = await q
      .select({
        id: parentFiles.id,
        fileId: parentFiles.fileId,
        filePath: storageFiles.path,
        isProtected: storageFiles.isProtected,
        usageType: parentFiles.usageType,
        createdAt: parentFiles.createdAt,
      })
      .from(parentFiles)
      .innerJoin(storageFiles, eq(parentFiles.fileId, storageFiles.id))
      .where(eq(parentFiles.parentId, parentId))
      .orderBy(desc(parentFiles.createdAt));

    return results.map(r => ({
      id: r.id,
      fileId: r.fileId,
      filePath: r.filePath,
      isProtected: r.isProtected,
      usageType: r.usageType,
      createdAt: r.createdAt,
    }));
  };

  export const getFilesForInvoice = async (
    invoiceId: string,
    usageType?: string,
    tx?: DBTransaction,
    limit?: number
  ): Promise<StorageTypes.LinkedFileReturnType[]> => {
    const q = queryDb(tx);
    const conditions = [eq(invoiceFiles.invoiceId, invoiceId)];
    if (usageType) conditions.push(eq(invoiceFiles.usageType, usageType));

    const baseQuery = q
      .select({
        id: invoiceFiles.id,
        fileId: invoiceFiles.fileId,
        filePath: storageFiles.path,
        isProtected: storageFiles.isProtected,
        usageType: invoiceFiles.usageType,
        createdAt: invoiceFiles.createdAt,
      })
      .from(invoiceFiles)
      .innerJoin(storageFiles, eq(invoiceFiles.fileId, storageFiles.id))
      .where(and(...conditions))
      .orderBy(desc(invoiceFiles.createdAt));

    const results = limit ? await baseQuery.limit(limit) : await baseQuery;

    return results.map(r => ({
      id: r.id,
      fileId: r.fileId,
      filePath: r.filePath,
      isProtected: r.isProtected,
      usageType: r.usageType,
      createdAt: r.createdAt,
    }));
  };

  export const linkFileToParent = async (
    parentId: string,
    fileId: string,
    usageType: string,
    tx?: DBTransaction,
    createdAt: Date = new Date()
  ): Promise<{ id: string; fileId: string; parentId: string; usageType: string; createdAt: Date }> => {
    const dbToQuery = tx ?? db;

    const [result] = await dbToQuery
      .insert(parentFiles)
      .values({
        fileId,
        parentId,
        usageType,
        createdAt,
      })
      .returning();

    return result;
  };

  export const linkFileToInvoice = async (
    invoiceId: string,
    fileId: string,
    usageType: string,
    tx?: DBTransaction,
    createdAt: Date = new Date()
  ): Promise<{ id: string; fileId: string; invoiceId: string; usageType: string; createdAt: Date }> => {
    const dbToQuery = tx ?? db;

    const [result] = await dbToQuery
      .insert(invoiceFiles)
      .values({
        fileId,
        invoiceId,
        usageType,
        createdAt,
      })
      .returning();

    return result;
  };

  /**
   * Validate upload parameters (path, size, contentType).
   * Returns an error message if validation fails, or null if valid.
   */
  export const validateUpload = (
    params: { path: string; size: number; contentType: string },
    locale?: string
  ): string | null => {
    const { path, size, contentType } = params;
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations.file;

    // Check for path traversal attempts
    if (path.includes("..") || path.startsWith("/")) {
      return tErrors.invalidFilePath;
    }

    // Check file size (max 100MB)
    const maxSize = MAX_FILE_SIZE_BYTES; // 100MB
    if (size > maxSize) {
      return tErrors.fileSizeExceedsMaximum(maxSize / (1024 * 1024));
    }

    // Check content type is provided
    if (!contentType) {
      return tErrors.contentTypeRequired;
    }

    if (!isAllowedMimeType(contentType)) {
      return tErrors.invalidFileType;
    }

    return null;
  };
}
