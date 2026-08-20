import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  PartialStudentUpdateInputPothosObject,
  // StudentCreateInputPothosObject,
  StudentPothosObject,
} from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PermissionsService, StudentManagementService } from "@/backend/services";
import { StudentLifecycleService } from "@/backend/services/student/student-lifecycle.service";
import type * as Types from "@/backend/types";
import { StudentUtils } from "@/backend/utils";

async function requireStudentManageStatus(userId: string, tErrors: { insufficientPermissions: string }): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STUDENT_MANAGE_STATUS);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

// Type guard: validates that the filtered record matches PartialStudentUpdateInput.
// Pothos has already validated the GraphQL input shape at the schema boundary;
// this guard lets TypeScript narrow the runtime-built record to the typed input.
function isPartialStudentUpdateInput(value: unknown): value is Types.PartialStudentUpdateInput {
  return typeof value === "object" && value !== null;
}

gqlSchemaBuilder.mutationFields(t => ({
  partiallyUpdateStudent: t.field({
    type: StudentPothosObject,
    authScopes: { permission: AppPermission.STUDENTS_EDIT },
    args: {
      input: t.arg({
        type: PartialStudentUpdateInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_query, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const input: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args.input)) {
        if (value !== null) {
          input[key] = value;
        }
      }
      if (!isPartialStudentUpdateInput(input)) {
        throw new GraphQLError(tErrors.invalidInput, { extensions: { code: "BAD_USER_INPUT" } });
      }
      const { status, ...restInput } = input;
      if (status) {
        await requireStudentManageStatus(userId, tErrors);
        await StudentLifecycleService.changeStudentStatus(userId, input.id, status, tErrors);
      }
      return await StudentManagementService.partiallyUpdate(restInput, tErrors).then(s =>
        StudentUtils.mapEntityToDto(s)
      );
    },
  }),

  deleteStudent: t.field({
    type: StudentPothosObject,
    authScopes: { permission: AppPermission.STUDENT_MANAGE_STATUS },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_query, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      await requireStudentManageStatus(userId, tErrors);
      return await StudentManagementService.deleteById(args.id, tErrors).then(s => StudentUtils.mapEntityToDto(s));
    },
  }),
}));
