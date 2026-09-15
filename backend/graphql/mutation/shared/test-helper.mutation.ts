import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  TestEntitiesPothosObject,
  TestGroupClassPothosObject,
  TestSuperAdminPothosObject,
} from "@/backend/graphql/pothos/system";
import { assertTestHelperAllowed, isTestHelperEnabled } from "@/backend/lib/test-helper-gate";
import { TestHelperService } from "@/backend/services";

if (isTestHelperEnabled()) {
  gqlSchemaBuilder.mutationField("ensureDemoUsers", t =>
    t.field({
      type: "Boolean",
      authScopes: { loggedIn: true },
      resolve: async () => {
        assertTestHelperAllowed();
        return await TestHelperService.ensureDemoUsers();
      },
    })
  );

  gqlSchemaBuilder.mutationField("createTestEntities", t =>
    t.field({
      type: TestEntitiesPothosObject,
      authScopes: { loggedIn: true },
      args: {
        prefix: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
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
        studentUserId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
        teacherUserId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
        parentUserId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
        studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
        teacherId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
        parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.cleanupTestEntities(args);
      },
    })
  );

  gqlSchemaBuilder.mutationField("createTestGroupClass", t =>
    t.field({
      type: TestGroupClassPothosObject,
      authScopes: { loggedIn: true },
      args: {
        classInstanceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
        teacherName: t.arg.string({ required: true, directives: { constraint: { maxLength: 200 } } }),
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
        groupClassId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.cleanupTestGroupClass(args.groupClassId);
      },
    })
  );

  gqlSchemaBuilder.mutationField("createTestSuperAdmin", t =>
    t.field({
      type: TestSuperAdminPothosObject,
      authScopes: { superAdmin: true, notImpersonating: true },
      args: {
        prefix: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
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
        userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
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
        userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      },
      resolve: async (_query, args) => {
        assertTestHelperAllowed();
        return await TestHelperService.cleanupTestManager(args.userId);
      },
    })
  );
} else if (process.env.NODE_ENV !== "production") {
  logger.warn("Test-helper mutations are NOT registered: TEST_SERVER and TEST_CI are unset", {
    testServer: process.env.TEST_SERVER ?? null,
    testCi: process.env.TEST_CI ?? null,
  });
}
