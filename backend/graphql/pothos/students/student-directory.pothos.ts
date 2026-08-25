import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type { StudentDirectory, StudentDirectoryResult } from "@/backend/types";

// ─── Object Types ─────────────────────────────────────────────────────────────

export const StudentDirectoryRowPothosObject = gqlSchemaBuilder
  .objectRef<StudentDirectory>("StudentDirectoryRow")
  .implement({
    fields: t => ({
      id: t.exposeString("id"),
      name: t.exposeString("name"),
      email: t.exposeString("email", { nullable: true }),
      avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
      status: t.exposeString("status"),
      classesRemaining: t.exposeInt("classesRemaining"),
      classesTotal: t.exposeInt("classesTotal"),
      hoursPerWeek: t.float({
        resolve: parent => parent.hoursPerWeek ?? 0,
      }),
      parentName: t.exposeString("parentName", { nullable: true }),
      teacherName: t.exposeString("teacherName", { nullable: true }),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

export const StudentDirectoryPayloadRef = gqlSchemaBuilder.objectRef<StudentDirectoryResult>("StudentDirectoryPayload");

export const StudentDirectoryPayloadPothosObject = StudentDirectoryPayloadRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [StudentDirectoryRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

// ─── Queries ──────────────────────────────────────────────────────────────────
