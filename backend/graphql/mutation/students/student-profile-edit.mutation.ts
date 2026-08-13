import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppLanguagePothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { StudentProfilePothosObject } from "@/backend/graphql/pothos/students/student-profile.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { StudentProfileService } from "@/backend/services";
import type { StudentProfileEditInput } from "@/backend/types";

const StudentProfileEditInputPothosObject = gqlSchemaBuilder
  .inputRef<StudentProfileEditInput>("StudentProfileEditInput")
  .implement({
    fields: t => ({
      studentId: t.id({ required: false }),
      phone: t.string({ required: false }),
      timezone: t.string({ required: false }),
      displayCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
      dateOfBirth: t.field({ type: "DateTime", required: false }),
      gender: t.field({ type: GenderPothosObject, required: false }),
      language: t.field({ type: AppLanguagePothosObject, required: false }),
      timezoneOverride: t.string({ required: false }),
      avatarUrl: t.string({ required: false }),
      parentPhone: t.string({ required: false }),
    }),
  });

gqlSchemaBuilder.mutationField("recordStudentProfileEdit", t =>
  t.field({
    type: StudentProfilePothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: StudentProfileEditInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return StudentProfileService.recordStudentProfileEdit(actorUserId, args.input, tErrors, ctx.locale);
    },
  })
);
