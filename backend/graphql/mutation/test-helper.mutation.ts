import { TestHelperService } from "@/backend/services/system/test-helper.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// Define the Pothos types for the mutation responses only in non-production environments
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
  }));
}
