import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type {
  ManagerOnboardingInput,
  ManagerOnboardingResult,
} from "@/backend/services/staff/manager-onboarding.service";
import type { ManagerOnboardingReturnType } from "@/backend/types";

export const ManagerAccountTypePothosEnum = gqlSchemaBuilder.enumType(
  { admin: "admin" as const, manager: "manager" as const, supervisor: "supervisor" as const },
  { name: "ManagerAccountType", description: "Account type for new manager" }
);

const ManagerOnboardingRef = gqlSchemaBuilder.objectRef<ManagerOnboardingReturnType>("ManagerOnboarding");

export const ManagerOnboardingPothosObject = ManagerOnboardingRef.implement({
  description: "Manager/Staff account details",
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    staffProfileId: t.exposeString("staffProfileId"),
    name: t.exposeString("name"),
    email: t.string({
      resolve: parent => parent.email.value,
      nullable: false,
    }),
    status: t.exposeString("status"),
    assignedGroupSlug: t.exposeString("assignedGroupSlug"),
  }),
});

export const ManagerOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<
    Omit<ManagerOnboardingInput, "email" | "accountType"> & {
      email: string;
      accountType: "admin" | "manager" | "supervisor";
    }
  >("ManagerOnboardingInput")
  .implement({
    description: "Input for creating a new manager/staff account with RBAC assignment",
    fields: t => ({
      name: t.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
      email: t.string({ required: true }),
      password: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      avatarUrl: t.string({ required: false, directives: { constraint: { maxLength: 1024 } } }),
      phone: t.string({ directives: { constraint: { maxLength: 512 } } }),
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
