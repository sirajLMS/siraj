import type {
  CoreUserProfileFields,
  ParentAdminProfileUpdateInput,
  ParentOwnProfileUpdateInput,
  StaffOwnProfileUpdateInput,
  TeacherOwnProfileUpdateInput,
  UnifiedProfileReturnType,
  UpdateOwnProfileInput,
  UpdateUserProfileInput,
} from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ParentOwnProfilePothosObject } from "./parent-portal.pothos";
import { ParentProfilePothosObject } from "./parent-profile.pothos";
import { ManagerDirectoryRowPothosObject } from "./staff-directory.pothos";
import { TeacherProfileResultPothosObject, TeacherProfileUpdateInputPothosObject } from "./staff-profile.pothos";
import { TeacherOwnProfilePothosObject } from "./teacher-portal.pothos";

export const ProfileAudiencePothosEnum = gqlSchemaBuilder.enumType("ProfileAudience", {
  values: ["teacher", "parent", "staff"] as const,
});

export const ProfileScopePothosEnum = gqlSchemaBuilder.enumType("ProfileScope", {
  values: ["own", "other"] as const,
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
    staffProfile: t.expose("staffProfile", { type: ManagerDirectoryRowPothosObject, nullable: true }),
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
      skype: t.string({ required: false }),
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
      skype: t.string({ required: false }),
      defaultZoomLink: t.string({ required: false }),
      invoiceType: t.string({ required: false }),
      feeAmount: t.string({ required: false }),
      paymentMethod: t.string({ required: false }),
      currency: t.string({ required: false }),
      timezone: t.string({ required: false }),
    }),
  });

export const StaffOwnProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<StaffOwnProfileUpdateInput>("StaffOwnProfileUpdateInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false }),
      skypeId: t.string({ required: false }),
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
      staff: t.field({ type: StaffOwnProfileUpdateInputPothosObject, required: false }),
    }),
  });
