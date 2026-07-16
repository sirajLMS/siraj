import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  PartialStudentUpdateInputPothosObject,
  // StudentCreateInputPothosObject,
  StudentPothosObject,
} from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import { StudentUtils } from "@/backend/utils";

async function requireStudentManageStatus(userId: string, tErrors: { insufficientPermissions: string }): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STUDENT_MANAGE_STATUS);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
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
      const typedInput = input as Types.PartialStudentUpdateInput;
      const { status, ...restInput } = typedInput;
      if (status) {
        await requireStudentManageStatus(userId, tErrors);
        await StudentRepository.changeStatus(typedInput.id, status, tErrors);
      }
      return await StudentRepository.partiallyUpdate(restInput as Types.PartialStudentUpdateInput, tErrors).then(s =>
        StudentUtils.mapEntityToDto(s)
      );
    },
  }),

  deleteStudent: t.field({
    type: StudentPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      await requireStudentManageStatus(userId, tErrors);
      return await StudentRepository.deleteById(args.id, tErrors).then(s => StudentUtils.mapEntityToDto(s));
    },
  }),
}));
