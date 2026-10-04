import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { invoiceFiles, parentFiles, storageDirectories, storageFiles } from "@/backend/db/schema";
import { logger } from "@/backend/lib";
import type * as StorageTypes from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";

export async function selectFileById(id: string): Promise<StorageTypes.FileSelectType | null> {
  const results = await db.select().from(storageFiles).where(eq(storageFiles.id, id)).limit(1);
  return results[0] ?? null;
}

export async function selectFileByPath(path: string): Promise<StorageTypes.FileSelectType | null> {
  const results = await db.select().from(storageFiles).where(eq(storageFiles.path, path)).limit(1);
  return results[0] ?? null;
}

export async function selectFilesByPaths(paths: string[]): Promise<StorageTypes.FileSelectType[]> {
  if (paths.length === 0) return [];
  return await db.select().from(storageFiles).where(inArray(storageFiles.path, paths));
}

export async function insertFileRow(path: string, isProtected: boolean): Promise<StorageTypes.FileSelectType> {
  const results = await db
    .insert(storageFiles)
    .values({ path, isProtected })
    .onConflictDoUpdate({
      target: storageFiles.path,
      set: { isProtected },
    })
    .returning();
  return results[0];
}

export async function updateFileRow(
  file: StorageTypes.FileInsertType & { id: string }
): Promise<StorageTypes.FileSelectType | undefined> {
  const results = await db
    .update(storageFiles)
    .set({
      path: file.path,
      isProtected: file.isProtected,
    })
    .where(eq(storageFiles.id, file.id))
    .returning();
  return results[0];
}

export async function deleteFileRow(path: string): Promise<boolean> {
  try {
    await db.delete(storageFiles).where(eq(storageFiles.path, path));
    return true;
  } catch (error) {
    logger.error("Failed to delete file:", error);
    return false;
  }
}

export async function selectDirectoryByPath(path: string): Promise<StorageTypes.DirectorySelectType | null> {
  try {
    const result = await db.select().from(storageDirectories).where(eq(storageDirectories.path, path)).limit(1);
    return result[0] ?? null;
  } catch (err) {
    logger.error("Failed to find directory by path:", err);
    return null;
  }
}

export async function selectDirectoriesByParentPath(parentPath?: string): Promise<StorageTypes.DirectorySelectType[]> {
  if (parentPath) {
    return await db
      .select()
      .from(storageDirectories)
      .where(sql`${storageDirectories.path} LIKE ${escapeLikeWildcards(parentPath) + "/%"}`);
  }
  return await db.select().from(storageDirectories).limit(500);
}

export async function selectDirectoriesByPaths(paths: string[]): Promise<StorageTypes.DirectorySelectType[]> {
  if (paths.length === 0) return [];
  return await db.select().from(storageDirectories).where(inArray(storageDirectories.path, paths));
}

export async function upsertDirectoryRecord(
  input: StorageTypes.FolderCreateInput
): Promise<StorageTypes.DirectorySelectType> {
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
}

export async function updateDirectoryRecord(
  directory: StorageTypes.DirectorySelectType
): Promise<StorageTypes.DirectorySelectType | undefined> {
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
}

export async function deleteDirectoryRow(path: string): Promise<boolean> {
  try {
    await db.delete(storageDirectories).where(eq(storageDirectories.path, path));
    return true;
  } catch (error) {
    logger.error("Failed to delete directory:", error);
    return false;
  }
}

function mapLinkedFileRow(r: {
  id: string;
  fileId: string;
  filePath: string;
  isProtected: boolean;
  usageType: string;
  createdAt: Date;
}): StorageTypes.LinkedFileReturnType {
  return {
    id: r.id,
    fileId: r.fileId,
    filePath: r.filePath,
    isProtected: r.isProtected,
    usageType: r.usageType,
    createdAt: r.createdAt,
  };
}

export async function selectLinkedFilesForParent(
  parentId: string,
  tx?: DBTransaction
): Promise<StorageTypes.LinkedFileReturnType[]> {
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

  return results.map(mapLinkedFileRow);
}

export async function selectLinkedFilesForInvoice(
  invoiceId: string,
  usageType?: string,
  tx?: DBTransaction,
  limit?: number
): Promise<StorageTypes.LinkedFileReturnType[]> {
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

  return results.map(mapLinkedFileRow);
}

export async function insertParentFileLink(
  parentId: string,
  fileId: string,
  usageType: string,
  tx?: DBTransaction,
  createdAt: Date = new Date()
): Promise<{ id: string; fileId: string; parentId: string; usageType: string; createdAt: Date }> {
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
}

export async function insertInvoiceFileLink(
  invoiceId: string,
  fileId: string,
  usageType: string,
  tx?: DBTransaction,
  createdAt: Date = new Date()
): Promise<{ id: string; fileId: string; invoiceId: string; usageType: string; createdAt: Date }> {
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
}
