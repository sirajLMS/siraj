import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { Email } from "@/backend/lib/email";
import type {
  ManagerOnboardingInput,
  ManagerOnboardingResult,
} from "@/backend/services/staff/manager-onboarding.service";

export const ManagerAccountTypePothosEnum = gqlSchemaBuilder.enumType(
  { admin: "admin" as const, manager: "manager" as const },
  { name: "ManagerAccountType", description: "Account type for new manager" }
);

export interface ManagerOnboardingGqlInput extends Omit<ManagerOnboardingInput, "email" | "accountType"> {
  email: Email;
  accountType: "admin" | "manager";
}

export const ManagerOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<ManagerOnboardingGqlInput>("ManagerOnboardingInput")
  .implement({
    description: "Input for creating a new manager/staff account with RBAC assignment",
    fields: t => ({
      name: t.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
      email: t.field({ type: "Email", required: true }),
      password: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      phone: t.string({ directives: { constraint: { maxLength: 512 } } }),
      skypeId: t.string({ directives: { constraint: { maxLength: 512 } } }),
      accountType: t.field({ type: ManagerAccountTypePothosEnum, required: true }),
    }),
  });

export const ManagerOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<ManagerOnboardingResult>("ManagerOnboardingResult")
  .implement({
    description: "Result of manager onboarding operation",
    fields: t => ({
      id: t.exposeString("id"),
      userId: t.exposeString("userId"),
      staffProfileId: t.exposeString("staffProfileId"),
      name: t.exposeString("name"),
      email: t.exposeString("email"),
      status: t.exposeString("status"),
      assignedGroupSlug: t.exposeString("assignedGroupSlug"),
    }),
  });
