/**
 * GraphQL test-helper object types.
 *
 * Registers the `TestEntities`, `TestGroupClass`, and `TestSuperAdmin` object
 * types backing the test-helper mutations. All three are backed by canonical
 * return types from `@/backend/types` (`TestEntitiesReturnType`,
 * `TestGroupClassReturnType`, `TestSuperAdminReturnType`).
 *
 * The object refs are created unconditionally (a bare ref never enters the
 * schema), but the type implementations are gated by `isTestHelperEnabled()` —
 * the same gate as the test-helper mutation registrations — so the schema
 * output is identical in every environment: no test-helper object types appear
 * in production or Vercel deployments where the test-helper mutations are
 * hard-disabled.
 */

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { isTestHelperEnabled } from "@/backend/lib/test-helper-gate";
import type { TestEntitiesReturnType, TestGroupClassReturnType, TestSuperAdminReturnType } from "@/backend/types";

export const TestEntitiesPothosObject = gqlSchemaBuilder.objectRef<TestEntitiesReturnType>("TestEntities");

export const TestGroupClassPothosObject = gqlSchemaBuilder.objectRef<TestGroupClassReturnType>("TestGroupClass");

export const TestSuperAdminPothosObject = gqlSchemaBuilder.objectRef<TestSuperAdminReturnType>("TestSuperAdmin");

if (isTestHelperEnabled()) {
  TestEntitiesPothosObject.implement({
    fields: t => ({
      studentUserEmail: t.exposeString("studentUserEmail"),
      studentUserId: t.exposeString("studentUserId"),
      studentId: t.exposeString("studentId"),
      studentName: t.exposeString("studentName"),
      parentUserEmail: t.exposeString("parentUserEmail"),
      parentUserId: t.exposeString("parentUserId"),
      parentId: t.exposeString("parentId"),
      parentName: t.exposeString("parentName"),
      teacherUserEmail: t.exposeString("teacherUserEmail"),
      teacherUserId: t.exposeString("teacherUserId"),
      teacherId: t.exposeString("teacherId"),
      teacherName: t.exposeString("teacherName"),
    }),
  });

  TestGroupClassPothosObject.implement({
    fields: t => ({
      groupClassId: t.exposeString("groupClassId"),
    }),
  });

  TestSuperAdminPothosObject.implement({
    fields: t => ({
      userId: t.exposeString("userId"),
      email: t.exposeString("email"),
    }),
  });
}
