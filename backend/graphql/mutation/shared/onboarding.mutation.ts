import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ManagerOnboardingInputPothosObject,
  ManagerOnboardingResultPothosObject,
  ParentOnboardingInputPothosObject,
  ParentOnboardingResultPothosObject,
  StudentOnboardingInputPothosObject,
  StudentOnboardingResultPothosObject,
  TeacherOnboardingInputPothosObject,
  TeacherOnboardingPothosObject,
} from "@/backend/graphql/pothos";
import { normalizePaymentMethodDetailsInput } from "@/backend/graphql/pothos/billing/payment-method.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ParentOnboardingService } from "@/backend/services/parent/parent-onboarding.service";
import { ManagerOnboardingService } from "@/backend/services/staff/manager-onboarding.service";
import { StudentOnboardingService } from "@/backend/services/student/student-onboarding.service";
import { TeacherOnboardingService } from "@/backend/services/teacher/teacher-onboarding.service";
import type { UserPaymentMethodSubmitInput } from "@/backend/types/billing/payment-method.types";

function mapInitialPaymentMethodInput(
  input:
    | {
        readonly type: UserPaymentMethodSubmitInput["type"];
        readonly direction: UserPaymentMethodSubmitInput["direction"];
        readonly isDefault?: boolean | null;
        readonly label?: string | null;
        readonly details: Parameters<typeof normalizePaymentMethodDetailsInput>[0];
      }
    | null
    | undefined
): Omit<UserPaymentMethodSubmitInput, "userId"> | null {
  if (!input) {
    return null;
  }

  return {
    type: input.type,
    direction: input.direction,
    isDefault: input.isDefault ?? false,
    label: input.label ?? null,
    details: normalizePaymentMethodDetailsInput(input.details),
  };
}

gqlSchemaBuilder.mutationFields(t => ({
  createTeacher: t.field({
    type: TeacherOnboardingPothosObject,
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
          name: args.input.name,
          email: args.input.email.value,
          password: args.input.password,
          nationality: args.input.nationality ?? null,
          nationalId: args.input.nationalId ?? null,
          phone: args.input.phone ?? null,
          dateOfBirth: args.input.dateOfBirth ?? null,
          gender: args.input.gender ?? null,
          address: args.input.address ?? null,
          qualifications: args.input.qualifications ?? null,
          countryCode: args.input.countryCode ?? null,
          timezone: args.input.timezone,
          hourlyRate: args.input.hourlyRate ?? null,
          rateCurrency: args.input.rateCurrency ?? null,
          initialPayoutMethod: mapInitialPaymentMethodInput(args.input.initialPayoutMethod),
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
          name: args.input.name,
          email: args.input.email.value,
          password: args.input.password,
          phone: args.input.phone ?? null,
          nationality: args.input.nationality ?? null,
          address: args.input.address ?? null,
          facebook: args.input.facebook ?? null,
          whatsapp: args.input.whatsapp ?? null,
          twitter: args.input.twitter ?? null,
          invoiceType: args.input.invoiceType ?? null,
          feeAmount: args.input.feeAmount ?? null,
          currency: args.input.currency ?? null,
          timezone: args.input.timezone,
          initialPayinMethod: mapInitialPaymentMethodInput(args.input.initialPayinMethod),
        },
        ctx.locale
      );
    },
  }),

  createStudent: t.field({
    type: StudentOnboardingResultPothosObject,
    description: "Create a new student profile under an existing parent",
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: StudentOnboardingInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return await StudentOnboardingService.createStudent(userId, args.input, ctx.locale);
    },
  }),

  createManager: t.field({
    type: ManagerOnboardingResultPothosObject,
    description: "Create a new manager/staff account (System Admin only)",
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      input: t.arg({ type: ManagerOnboardingInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return await ManagerOnboardingService.createManager(
        userId,
        {
          ...args.input,
          email: args.input.email,
        },
        ctx.locale
      );
    },
  }),
}));
