import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
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
} from "@/backend/db/schema/storage";
import { getBackendTranslations } from "@/backend/lib/intl";
import logger from "@/backend/lib/logger";
import type * as StorageTypes from "@/backend/types";

export namespace StorageDbRepository {
  // File operations
  export const fileById = async (id: string): Promise<StorageTypes.FileEntity | null> => {
    const results = await db.select().from(storageFiles).where(eq(storageFiles.id, id)).limit(1);
    return results[0] ?? null;
  };

  export const fileByPath = async (path: string): Promise<StorageTypes.FileEntity | null> => {
    const results = await db.select().from(storageFiles).where(eq(storageFiles.path, path)).limit(1);
    return results[0] ?? null;
  };

  export const filesByIds = async (ids: string[]): Promise<StorageTypes.FileEntity[]> => {
    if (ids.length === 0) return [];
    return await db.select().from(storageFiles).where(inArray(storageFiles.id, ids));
  };

  export const filesByPaths = async (paths: string[]): Promise<StorageTypes.FileEntity[]> => {
    if (paths.length === 0) return [];
    return await db.select().from(storageFiles).where(inArray(storageFiles.path, paths));
  };

  export const createFile = async (path: string, isProtected: boolean = false): Promise<StorageTypes.FileEntity> => {
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
    file: StorageTypes.FileEntityInput & { id: string }
  ): Promise<StorageTypes.FileEntity | undefined> => {
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
  export const directoryByPath = async (path: string): Promise<StorageTypes.DirectoryEntity | null> => {
    try {
      const result = await db.select().from(storageDirectories).where(eq(storageDirectories.path, path)).limit(1);
      return result[0] ?? null;
    } catch (err) {
      logger.error("Failed to find directory by path:", err);
      return null;
    }
  };

  export const directoriesByParentPath = async (parentPath?: string): Promise<StorageTypes.DirectoryEntity[]> => {
    if (parentPath) {
      return await db
        .select()
        .from(storageDirectories)
        .where(sql`${storageDirectories.path} LIKE ${parentPath + "/%"}`);
    }
    return await db.select().from(storageDirectories);
  };

  export const directoriesByPaths = async (paths: string[]): Promise<StorageTypes.DirectoryEntity[]> => {
    if (paths.length === 0) return [];
    return await db.select().from(storageDirectories).where(inArray(storageDirectories.path, paths));
  };

  export const createDirectory = async (
    input: StorageTypes.FolderCreateInput
  ): Promise<StorageTypes.DirectoryEntity> => {
    const permissions = input.permissions || {
      allowUploads: true,
      allowDelete: true,
      allowMove: true,
      allowCreateSubDirs: true,
      allowDeleteFiles: true,
      allowMoveFiles: true,
    };

    const [created] = await db
      .insert(storageDirectories)
      .values({
        path: input.path,
        allowUploads: permissions.allowUploads,
        allowDelete: permissions.allowDelete,
        allowMove: permissions.allowMove,
        allowCreateSubDirs: permissions.allowCreateSubDirs,
        allowDeleteFiles: permissions.allowDeleteFiles,
        allowMoveFiles: permissions.allowMoveFiles,
        isProtected: input.protected || false,
        protectChildren: input.protectChildren || false,
      })
      .returning();
    return created;
  };

  export const updateDirectory = async (
    directory: StorageTypes.DirectoryEntity
  ): Promise<StorageTypes.DirectoryEntity | undefined> => {
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

    const [users, teachers, students_res, parents, invoices, complaints, resources, staff, schedules, instances] =
      await fetchAllUsages(fId);

    return [
      ...users.map(r => mapRowToUsage(r, fPath, r.userId, "users")),
      ...teachers.map(r => mapRowToUsage(r, fPath, r.teacherId, "teachers")),
      ...students_res.map(r => mapRowToUsage(r, fPath, r.studentId, "students")),
      ...parents.map(r => mapRowToUsage(r, fPath, r.parentId, "parents")),
      ...invoices.map(r => mapRowToUsage(r, fPath, r.invoiceId, "invoices")),
      ...complaints.map(r => mapRowToUsage(r, fPath, r.complaintId, "complaints")),
      ...resources.map(r => mapRowToUsage(r, fPath, r.learningResourceId, "learning_resources")),
      ...staff.map(r => mapRowToUsage(r, fPath, r.staffProfileId, "staff_profiles")),
      ...schedules.map(r => mapRowToUsage(r, fPath, r.recurringScheduleId, "recurring_schedules")),
      ...instances.map(r => mapRowToUsage(r, fPath, r.classInstanceId, "class_instances")),
    ];
  };

  async function fetchAllUsages(fId: string) {
    return Promise.all([
      db.select().from(userFiles).where(eq(userFiles.fileId, fId)),
      db.select().from(teacherFiles).where(eq(teacherFiles.fileId, fId)),
      db.select().from(studentFiles).where(eq(studentFiles.fileId, fId)),
      db.select().from(parentFiles).where(eq(parentFiles.fileId, fId)),
      db.select().from(invoiceFiles).where(eq(invoiceFiles.fileId, fId)),
      db.select().from(complaintFiles).where(eq(complaintFiles.fileId, fId)),
      db.select().from(learningResourceFiles).where(eq(learningResourceFiles.fileId, fId)),
      db.select().from(staffProfileFiles).where(eq(staffProfileFiles.fileId, fId)),
      db.select().from(recurringScheduleFiles).where(eq(recurringScheduleFiles.fileId, fId)),
      db.select().from(classInstanceFiles).where(eq(classInstanceFiles.fileId, fId)),
    ]);
  }

  function mapRowToUsage(
    r: { id: string; usageType: string; createdAt: Date },
    filePath: string,
    referenceId: string,
    referenceTable: string
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

    for (const table of tables) {
      const results = await db.select({ id: table.id }).from(table).where(eq(table.fileId, file.id)).limit(1);
      if (results.length > 0) return true;
    }

    return false;
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
      return { success: false, message: `Failed to register file usage: ${error}` };
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
   */
  async function performJunctionInsert(params: JunctionInsertParams, locale?: string): Promise<void> {
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
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("unsupportedTable", { table }));
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

  export const updateDirectoryPermissions = async (
    input: StorageTypes.DirectoryPermissionsUpdateInput
  ): Promise<StorageTypes.FileOperationResult> => {
    try {
      const directory = await directoryByPath(input.path);
      if (!directory) return { success: false, message: "Directory not found" };

      const updated = await updateDirectory({
        ...directory,
        allowUploads: input.permissions.allowUploads,
        allowDelete: input.permissions.allowDelete,
        allowMove: input.permissions.allowMove,
        allowCreateSubDirs: input.permissions.allowCreateSubDirs,
        allowDeleteFiles: input.permissions.allowDeleteFiles,
        allowMoveFiles: input.permissions.allowMoveFiles,
      });

      return {
        success: !!updated,
        message: updated ? "Directory permissions updated successfully" : "Failed to update directory permissions",
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update permissions: ${error}`,
      };
    }
  };

  export const setProtection = async (
    input: StorageTypes.StorageItemProtectionUpdateInput
  ): Promise<StorageTypes.FileOperationResult> => {
    try {
      const file = await fileByPath(input.path);
      if (file) {
        const updated = await updateFile({ ...file, isProtected: input.isProtected });
        return {
          success: !!updated,
          message: updated ? "File protection updated successfully" : "Failed to update file protection",
        };
      }

      const directory = await directoryByPath(input.path);
      if (directory) {
        const updated = await updateDirectory({
          ...directory,
          isProtected: input.isProtected,
          protectChildren: input.protectChildren || false,
        });
        return {
          success: !!updated,
          message: updated ? "Directory protection updated successfully" : "Failed to update directory protection",
        };
      }

      return { success: false, message: "File or directory not found" };
    } catch (error) {
      return { success: false, message: `Failed to set protection: ${error}` };
    }
  };
}
