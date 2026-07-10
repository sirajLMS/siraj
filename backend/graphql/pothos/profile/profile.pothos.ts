import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ParentAssignedStudentsResultPothosObject,
  ParentOwnProfilePothosObject,
} from "@/backend/graphql/pothos/parents/parent-portal.pothos";
import { ParentProfilePothosObject } from "@/backend/graphql/pothos/parents/parent-profile.pothos";
import {
  CurrencyCodePothosObject,
  IanaTimezonePothosObject,
  OverrideStatePothosObject,
  ProfileAudiencePothosEnum,
  ProfileScopePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { ManagerDirectoryRowPothosObject } from "@/backend/graphql/pothos/teachers/staff-directory.pothos";
import {
  TeacherProfileResultPothosObject,
  TeacherProfileUpdateInputPothosObject,
} from "@/backend/graphql/pothos/teachers/staff-profile.pothos";
import {
  TeacherAssignedStudentsResultPothosObject,
  TeacherOwnProfilePothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-portal.pothos";
import type {
  CoreUserProfileFields,
  ParentAdminProfileUpdateInput,
  ParentOwnProfileUpdateInput,
  StaffAdminProfileUpdateInput,
  StaffOwnProfileUpdateInput,
  StaffPermissionGroupReturnType,
  StaffPermissionOverrideReturnType,
  TeacherOwnProfileUpdateInput,
  UnifiedProfileReturnType,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
} from "@/backend/types";
import type { TeacherBankingSummaryReturnType } from "@/backend/types/teachers/teacher.types";

const StaffPermissionGroupRef = gqlSchemaBuilder.objectRef<StaffPermissionGroupReturnType>("StaffPermissionGroup");

export const StaffPermissionGroupPothosObject = StaffPermissionGroupRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    description: t.exposeString("description", { nullable: true }),
  }),
});

const StaffPermissionOverrideRef =
  gqlSchemaBuilder.objectRef<StaffPermissionOverrideReturnType>("StaffPermissionOverride");

export const StaffPermissionOverridePothosObject = StaffPermissionOverrideRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    permissionId: t.exposeString("permissionId"),
    permissionKey: t.exposeString("permissionKey"),
    resource: t.exposeString("resource"),
    action: t.exposeString("action"),
    state: t.expose("state", { type: OverrideStatePothosObject }),
  }),
});

const TeacherBankingSummaryRef = gqlSchemaBuilder.objectRef<TeacherBankingSummaryReturnType>("TeacherBankingSummary");
export const TeacherBankingSummaryPothosObject = TeacherBankingSummaryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    beneficiaryName: t.exposeString("beneficiaryName"),
    bankName: t.exposeString("bankName"),
    accountNumber: t.exposeString("accountNumber"),
    routingNumber: t.exposeString("routingNumber", { nullable: true }),
    swiftBic: t.exposeString("swiftBic"),
    iban: t.exposeString("iban", { nullable: true }),
    verifiedAt: t.exposeString("verifiedAt", { nullable: true }),
    verifiedByUserId: t.exposeString("verifiedByUserId", { nullable: true }),
    verifiedByName: t.exposeString("verifiedByName", { nullable: true }),
  }),
});

const UnifiedProfileRef = gqlSchemaBuilder.objectRef<UnifiedProfileReturnType>("UnifiedProfile");

export const UnifiedProfilePothosObject = UnifiedProfileRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    audience: t.expose("audience", { type: ProfileAudiencePothosEnum }),
    scope: t.expose("scope", { type: ProfileScopePothosEnum }),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    teacherId: t.exposeString("teacherId", { nullable: true }),
    parentId: t.exposeString("parentId", { nullable: true }),
    staffProfileId: t.exposeString("staffProfileId", { nullable: true }),
    teacherOwnProfile: t.expose("teacherOwnProfile", { type: TeacherOwnProfilePothosObject, nullable: true }),
    teacherAdminProfile: t.expose("teacherAdminProfile", { type: TeacherProfileResultPothosObject, nullable: true }),
    parentOwnProfile: t.expose("parentOwnProfile", { type: ParentOwnProfilePothosObject, nullable: true }),
    parentAdminProfile: t.expose("parentAdminProfile", { type: ParentProfilePothosObject, nullable: true }),
    associatedStudents: t.expose("associatedStudents", {
      type: ParentAssignedStudentsResultPothosObject,
      nullable: true,
    }),
    staffProfile: t.expose("staffProfile", { type: ManagerDirectoryRowPothosObject, nullable: true }),
    staffPermissionGroups: t.expose("staffPermissionGroups", {
      type: [StaffPermissionGroupPothosObject],
      nullable: true,
    }),
    staffPermissionOverrides: t.expose("staffPermissionOverrides", {
      type: [StaffPermissionOverridePothosObject],
      nullable: true,
    }),
    bankingSummary: t.expose("bankingSummary", { type: TeacherBankingSummaryPothosObject, nullable: true }),
    assignedStudents: t.expose("assignedStudents", { type: TeacherAssignedStudentsResultPothosObject, nullable: true }),
  }),
});

export const CoreUserProfileFieldsInputPothosObject = gqlSchemaBuilder
  .inputRef<CoreUserProfileFields>("CoreUserProfileFieldsInput")
  .implement({
    fields: t => ({
      name: t.string({ required: false }),
      email: t.string({ required: false }),
      avatarUrl: t.string({ required: false }),
    }),
  });

export const TeacherOwnProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<TeacherOwnProfileUpdateInput>("TeacherOwnProfileUpdateInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false }),
      zoomLink: t.string({ required: false }),
    }),
  });

export const ParentOwnProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<ParentOwnProfileUpdateInput>("ParentOwnProfileUpdateInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false }),
      facebook: t.string({ required: false }),
      whatsapp: t.string({ required: false }),
      twitter: t.string({ required: false }),
      defaultZoomLink: t.string({ required: false }),
    }),
  });

export const ParentAdminProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<ParentAdminProfileUpdateInput>("ParentAdminProfileUpdateInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false }),
      nationality: t.string({ required: false }),
      address: t.string({ required: false }),
      facebook: t.string({ required: false }),
      whatsapp: t.string({ required: false }),
      twitter: t.string({ required: false }),
      defaultZoomLink: t.string({ required: false }),
      invoiceType: t.string({ required: false }),
      feeAmount: t.string({ required: false }),
      paymentMethod: t.string({ required: false }),
      currency: t.field({ type: CurrencyCodePothosObject, required: false }),
      timezone: t.field({ type: IanaTimezonePothosObject, required: false }),
    }),
  });

export const StaffOwnProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<StaffOwnProfileUpdateInput>("StaffOwnProfileUpdateInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false }),
    }),
  });

export const StaffAdminProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<StaffAdminProfileUpdateInput>("StaffAdminProfileUpdateInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false }),
      status: t.string({ required: false }),
    }),
  });

export const UpdateOwnProfileInputPothosObject = gqlSchemaBuilder
  .inputRef<UpdateOwnProfileInput>("UpdateOwnProfileInput")
  .implement({
    fields: t => ({
      core: t.field({ type: CoreUserProfileFieldsInputPothosObject, required: false }),
      teacher: t.field({ type: TeacherOwnProfileUpdateInputPothosObject, required: false }),
      parent: t.field({ type: ParentOwnProfileUpdateInputPothosObject, required: false }),
      staff: t.field({ type: StaffOwnProfileUpdateInputPothosObject, required: false }),
    }),
  });

export const UpdateUserProfileInputPothosObject = gqlSchemaBuilder
  .inputRef<UpdateUserProfileInput>("UpdateUserProfileInput")
  .implement({
    fields: t => ({
      core: t.field({ type: CoreUserProfileFieldsInputPothosObject, required: false }),
      teacher: t.field({ type: TeacherProfileUpdateInputPothosObject, required: false }),
      parent: t.field({ type: ParentAdminProfileUpdateInputPothosObject, required: false }),
      staff: t.field({ type: StaffAdminProfileUpdateInputPothosObject, required: false }),
    }),
  });
