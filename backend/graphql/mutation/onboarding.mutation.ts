import { ParentOnboardingService } from "@/backend/services/parent/parent-onboarding.service";
import { ManagerOnboardingService } from "@/backend/services/staff/manager-onboarding.service";
import { TeacherOnboardingService } from "@/backend/services/teacher/teacher-onboarding.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  ManagerOnboardingInputPothosObject,
  ManagerOnboardingResultPothosObject,
  ParentOnboardingInputPothosObject,
  ParentOnboardingResultPothosObject,
  TeacherOnboardingInputPothosObject,
  TeacherOnboardingResultPothosObject,
} from "../pothos";
import { requireAuth } from "../utils/requireAuth";

gqlSchemaBuilder.mutationFields(t => ({
  createTeacher: t.field({
    type: TeacherOnboardingResultPothosObject,
    description: "Create a new teacher account with comprehensive profile",
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: TeacherOnboardingInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return await TeacherOnboardingService.createTeacher(
        userId,
        {
          ...args.input,
          email: args.input.email.value,
          gender: args.input.gender ?? null,
          countryCode: args.input.countryCode ?? null,
        },
        ctx.locale
      );
    },
  }),

  createParent: t.field({
    type: ParentOnboardingResultPothosObject,
    description: "Create a new parent account with billing configuration",
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: ParentOnboardingInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return await ParentOnboardingService.createParent(
        userId,
        {
          ...args.input,
          email: args.input.email.value,
          invoiceType: args.input.invoiceType ?? null,
          paymentMethod: args.input.paymentMethod ?? null,
        },
        ctx.locale
      );
    },
  }),

  createManager: t.field({
    type: ManagerOnboardingResultPothosObject,
    description: "Create a new manager/staff account (System Admin only)",
    authScopes: { superAdmin: true },
    args: {
      input: t.arg({ type: ManagerOnboardingInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return await ManagerOnboardingService.createManager(
        userId,
        {
          ...args.input,
          email: args.input.email.value,
        },
        ctx.locale
      );
    },
  }),
}));
