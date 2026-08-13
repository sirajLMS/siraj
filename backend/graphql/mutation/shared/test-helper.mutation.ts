import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { assertTestHelperAllowed, isTestHelperEnabled } from "@/backend/lib/test-helper-gate";
import { TestHelperService } from "@/backend/services";

if (isTestHelperEnabled()) {
  const TestEntitiesType = gqlSchemaBuilder.objectRef<{
    studentUserEmail: string;
    studentUserId: string;
    studentId: string;
    studentName: string;
    parentUserEmail: string;
    parentUserId: string;
    parentId: string;
    parentName: string;
    teacherUserEmail: string;
    teacherUserId: string;
    teacherId: string;
    teacherName: string;
  }>("TestEntities");

  TestEntitiesType.implement({
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

  const TestGroupClassType = gqlSchemaBuilder.objectRef<{
    groupClassId: string;
  }>("TestGroupClass");

  TestGroupClassType.implement({
    fields: t => ({
      groupClassId: t.exposeString("groupClassId"),
    }),
  });

  gqlSchemaBuilder.mutationField("ensureDemoUsers", t =>
    t.field({
      type: "Boolean",
      resolve: async () => {
        assertTestHelperAllowed();
        return await TestHelperService.ensureDemoUsers();
      },
    })
  );

  gqlSchemaBuilder.mutationField("createTestEntities", t =>
    t.field({
      type: TestEntitiesType,
      authScopes: { loggedIn: true },
      args: {
        prefix: t.arg.string({ required: true }),
        classesRemaining: t.arg.int({ required: false }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.createTestEntities(args.prefix, args.classesRemaining ?? undefined);
      },
    })
  );

  gqlSchemaBuilder.mutationField("cleanupTestEntities", t =>
    t.field({
      type: "Boolean",
      authScopes: { loggedIn: true },
      args: {
        studentUserId: t.arg.string({ required: true }),
        teacherUserId: t.arg.string({ required: true }),
        parentUserId: t.arg.string({ required: true }),
        studentId: t.arg.string({ required: true }),
        teacherId: t.arg.string({ required: true }),
        parentId: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.cleanupTestEntities(args);
      },
    })
  );

  gqlSchemaBuilder.mutationField("createTestGroupClass", t =>
    t.field({
      type: TestGroupClassType,
      authScopes: { loggedIn: true },
      args: {
        classInstanceId: t.arg.string({ required: true }),
        teacherName: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.createTestGroupClass(args.classInstanceId, args.teacherName);
      },
    })
  );

  gqlSchemaBuilder.mutationField("cleanupTestGroupClass", t =>
    t.field({
      type: "Boolean",
      authScopes: { loggedIn: true },
      args: {
        groupClassId: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.cleanupTestGroupClass(args.groupClassId);
      },
    })
  );

  const TestSuperAdminType = gqlSchemaBuilder.objectRef<{
    userId: string;
    email: string;
  }>("TestSuperAdmin");

  TestSuperAdminType.implement({
    fields: t => ({
      userId: t.exposeString("userId"),
      email: t.exposeString("email"),
    }),
  });

  gqlSchemaBuilder.mutationField("createTestSuperAdmin", t =>
    t.field({
      type: TestSuperAdminType,
      authScopes: { loggedIn: true },
      args: {
        prefix: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.createTestSuperAdmin(args.prefix);
      },
    })
  );

  gqlSchemaBuilder.mutationField("cleanupTestSuperAdmin", t =>
    t.field({
      type: "Boolean",
      authScopes: { loggedIn: true },
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.cleanupTestSuperAdmin(args.userId);
      },
    })
  );

  gqlSchemaBuilder.mutationField("cleanupTestManager", t =>
    t.field({
      type: "Boolean",
      authScopes: { loggedIn: true },
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.cleanupTestManager(args.userId);
      },
    })
  );
}
