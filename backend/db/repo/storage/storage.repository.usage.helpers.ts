import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  classInstanceFiles,
  complaintFiles,
  invoiceFiles,
  learningResourceFiles,
  parentFiles,
  recurringScheduleFiles,
  staffProfileFiles,
  studentFiles,
  teacherFiles,
  userFiles,
} from "@/backend/db/schema";
import type * as StorageTypes from "@/backend/types";

function fetchPersonUsages(fId: string) {
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

function fetchContentUsages(fId: string) {
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

function fetchSystemUsages(fId: string) {
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

export async function collectFileUsages(fileId: string, filePath: string): Promise<StorageTypes.FileUsageInfo[]> {
  const [users, teachers, studentsRes, parents] = await fetchPersonUsages(fileId);
  const [invoices, complaints, resources] = await fetchContentUsages(fileId);
  const [staff, schedules, instances] = await fetchSystemUsages(fileId);

  return [
    ...users.map(r => mapRowToUsage(r, filePath, r.userId, "users")),
    ...teachers.map(r => mapRowToUsage(r, filePath, r.teacherId, "teachers")),
    ...studentsRes.map(r => mapRowToUsage(r, filePath, r.studentId, "students")),
    ...parents.map(r => mapRowToUsage(r, filePath, r.parentId, "parents")),
    ...invoices.map(r => mapRowToUsage(r, filePath, r.invoiceId, "invoices")),
    ...complaints.map(r => mapRowToUsage(r, filePath, r.complaintId, "complaints")),
    ...resources.map(r => mapRowToUsage(r, filePath, r.learningResourceId, "learning_resources")),
    ...staff.map(r => mapRowToUsage(r, filePath, r.staffProfileId, "staff_profiles")),
    ...schedules.map(r => mapRowToUsage(r, filePath, r.recurringScheduleId, "recurring_schedules")),
    ...instances.map(r => mapRowToUsage(r, filePath, r.classInstanceId, "class_instances")),
  ];
}

export async function isFileIdInUse(fileId: string): Promise<boolean> {
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
    tables.map(table => db.select({ id: table.id }).from(table).where(eq(table.fileId, fileId)).limit(1))
  );

  return results.some(rows => rows.length > 0);
}

async function deletePersonRelatedUsages(fileId: string, usageType: string, referenceId: string) {
  await Promise.all([
    db
      .delete(userFiles)
      .where(and(eq(userFiles.fileId, fileId), eq(userFiles.usageType, usageType), eq(userFiles.userId, referenceId))),
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
        and(eq(parentFiles.fileId, fileId), eq(parentFiles.usageType, usageType), eq(parentFiles.parentId, referenceId))
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

export async function deleteUsagesFromAllTables(fileId: string, usageType: string, referenceId: string): Promise<void> {
  await Promise.all([
    deletePersonRelatedUsages(fileId, usageType, referenceId),
    deleteBusinessRelatedUsages(fileId, usageType, referenceId),
  ]);
}
