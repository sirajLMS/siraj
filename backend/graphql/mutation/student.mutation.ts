import { StudentRepository } from "@/backend/db/repo/student.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import { StudentUtils } from "@/backend/utils";
import { AppPermission } from "@/shared/lib/enum";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  PartialStudentUpdateInputPothosObject,
  // StudentCreateInputPothosObject,
  StudentPothosObject,
} from "../pothos";

async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}

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
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({
        type: PartialStudentUpdateInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_query, args, ctx) => {
      const userId = await requireAuth(ctx);
      await requireStudentManageStatus(userId, ctx.locale);
      const input = Object.fromEntries(
        Object.entries(args.input).filter(([, value]) => value !== null)
      ) as Types.PartialStudentUpdateInput;
      return await StudentRepository.partiallyUpdate(input).then(s => StudentUtils.mapEntityToDto(s));
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
