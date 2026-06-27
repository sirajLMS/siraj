import { TestHelperService } from "@/backend/services/system/test-helper.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

if (process.env.NODE_ENV !== "production") {
  const TestEntitiesType = gqlSchemaBuilder.objectRef<{
    studentUserEmail: string;
    studentUserId: string;
    studentId: string;
    parentUserEmail: string;
    parentUserId: string;
    parentId: string;
    teacherUserEmail: string;
    teacherUserId: string;
    teacherId: string;
  }>("TestEntities");

  TestEntitiesType.implement({
    fields: t => ({
      studentUserEmail: t.exposeString("studentUserEmail"),
      studentUserId: t.exposeString("studentUserId"),
      studentId: t.exposeString("studentId"),
      parentUserEmail: t.exposeString("parentUserEmail"),
      parentUserId: t.exposeString("parentUserId"),
      parentId: t.exposeString("parentId"),
      teacherUserEmail: t.exposeString("teacherUserEmail"),
      teacherUserId: t.exposeString("teacherUserId"),
      teacherId: t.exposeString("teacherId"),
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

  gqlSchemaBuilder.mutationFields(t => ({
    createTestEntities: t.field({
      type: TestEntitiesType,
      args: {
        prefix: t.arg.string({ required: true }),
        classesRemaining: t.arg.int({ required: false }),
      },
      resolve: async (_query, args) => {
        return await TestHelperService.createTestEntities(args.prefix, args.classesRemaining ?? undefined);
      },
    }),

    cleanupTestEntities: t.field({
      type: "Boolean",
      args: {
        studentUserId: t.arg.string({ required: true }),
        teacherUserId: t.arg.string({ required: true }),
        parentUserId: t.arg.string({ required: true }),
        studentId: t.arg.string({ required: true }),
        teacherId: t.arg.string({ required: true }),
        parentId: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        return await TestHelperService.cleanupTestEntities(args);
      },
    }),

    createTestGroupClass: t.field({
      type: TestGroupClassType,
      args: {
        classInstanceId: t.arg.string({ required: true }),
        teacherName: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        return await TestHelperService.createTestGroupClass(args.classInstanceId, args.teacherName);
      },
    }),

    cleanupTestGroupClass: t.field({
      type: "Boolean",
      args: {
        groupClassId: t.arg.string({ required: true }),
      },
      resolve: async (_query, args) => {
        return await TestHelperService.cleanupTestGroupClass(args.groupClassId);
      },
    }),
  }));
}
