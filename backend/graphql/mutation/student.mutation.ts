import { StudentRepository } from "@/backend/db/repo/student.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import { StudentUtils } from "@/backend/utils";
import { AppPermission } from "@/shared/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  PartialStudentUpdateInputPothosObject,
  // StudentCreateInputPothosObject,
  StudentPothosObject,
} from "../pothos";
import { requireAuth } from "../utils/requireAuth";

async function requireStudentManageStatus(userId: string, locale?: string): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STUDENT_MANAGE_STATUS);
  if (!hasPermission) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
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
      const input: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args.input)) {
        if (value !== null) {
          input[key] = value;
        }
      }
      const typedInput = input as Types.PartialStudentUpdateInput;
      const { status, ...restInput } = typedInput;
      if (status) {
        await requireStudentManageStatus(userId, ctx.locale);
        await StudentRepository.changeStatus(typedInput.id, status, undefined, undefined, ctx.locale);
      }
      return await StudentRepository.partiallyUpdate(restInput as Types.PartialStudentUpdateInput).then(s =>
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
      await requireStudentManageStatus(userId, ctx.locale);
      return await StudentRepository.deleteById(args.id).then(s => StudentUtils.mapEntityToDto(s));
    },
  }),
}));
