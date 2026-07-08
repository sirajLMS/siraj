import type {
  DstCheckedEmptyItemReturnType,
  DstConflictGroupReturnType,
  DstConflictItemReturnType,
  DstMigrationReportReturnType,
  DstUpdatedSessionReturnType,
} from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

const DstUpdatedSessionRef = gqlSchemaBuilder.objectRef<DstUpdatedSessionReturnType>("DstUpdatedSession");

export const DstUpdatedSessionPothosObject = DstUpdatedSessionRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    teacherId: t.exposeString("teacherId"),
    studentName: t.exposeString("studentName"),
    teacherName: t.exposeString("teacherName"),
    fromTime: t.exposeString("fromTime"),
    toTime: t.exposeString("toTime"),
  }),
});

const DstConflictItemRef = gqlSchemaBuilder.objectRef<DstConflictItemReturnType>("DstConflictItem");

export const DstConflictItemPothosObject = DstConflictItemRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    message: t.exposeString("message"),
  }),
});

const DstConflictGroupRef = gqlSchemaBuilder.objectRef<DstConflictGroupReturnType>("DstConflictGroup");

export const DstConflictGroupPothosObject = DstConflictGroupRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teacherName: t.exposeString("teacherName"),
    conflicts: t.expose("conflicts", { type: [DstConflictItemPothosObject] }),
  }),
});

const DstCheckedEmptyItemRef = gqlSchemaBuilder.objectRef<DstCheckedEmptyItemReturnType>("DstCheckedEmptyItem");

export const DstCheckedEmptyItemPothosObject = DstCheckedEmptyItemRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    reason: t.exposeString("reason"),
  }),
});

const DstMigrationReportRef = gqlSchemaBuilder.objectRef<DstMigrationReportReturnType>("DstMigrationReport");

export const DstMigrationReportPothosObject = DstMigrationReportRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    runId: t.exposeString("runId"),
    updated: t.exposeInt("updated"),
    conflicts: t.exposeInt("conflicts"),
    unchanged: t.exposeInt("unchanged"),
    total: t.exposeInt("total"),
    updatedSessions: t.expose("updatedSessions", { type: [DstUpdatedSessionPothosObject] }),
    conflictGroups: t.expose("conflictGroups", { type: [DstConflictGroupPothosObject] }),
    checkedEmptyItems: t.expose("checkedEmptyItems", { type: [DstCheckedEmptyItemPothosObject] }),
    status: t.exposeString("status"),
  }),
});
