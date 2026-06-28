import { type AssociatedStudentResult, ParentProfileService } from "@/backend/services/parent/parent-profile.service";
import { StudentManagementService } from "@/backend/services/student/student-management.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── ParentProfile Object ───────────────────────────────────────────────────

export type ParentProfileDefinition = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  phone: string | null;
  nationality: string | null;
  address: string | null;
  facebook: string | null;
  whatsapp: string | null;
  twitter: string | null;
  skype: string | null;
  defaultZoomLink: string | null;
  invoiceType: string | null;
  feeAmount: string | null;
  paymentMethod: string | null;
  currency: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

const ParentProfileRef = gqlSchemaBuilder.objectRef<ParentProfileDefinition>("ParentProfile");

export const ParentProfilePothosObject = ParentProfileRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    status: t.exposeString("status"),
    phone: t.exposeString("phone", { nullable: true }),
    nationality: t.exposeString("nationality", { nullable: true }),
    address: t.exposeString("address", { nullable: true }),
    facebook: t.exposeString("facebook", { nullable: true }),
    whatsapp: t.exposeString("whatsapp", { nullable: true }),
    twitter: t.exposeString("twitter", { nullable: true }),
    skype: t.exposeString("skype", { nullable: true }),
    defaultZoomLink: t.exposeString("defaultZoomLink", { nullable: true }),
    invoiceType: t.exposeString("invoiceType", { nullable: true }),
    feeAmount: t.exposeString("feeAmount", { nullable: true }),
    paymentMethod: t.exposeString("paymentMethod", { nullable: true }),
    currency: t.exposeString("currency", { nullable: true }),
    timezone: t.exposeString("timezone"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── AssociatedStudent Object ────────────────────────────────────────────────

export type AssociatedStudentDefinition = AssociatedStudentResult;

const AssociatedStudentRef = gqlSchemaBuilder.objectRef<AssociatedStudentDefinition>("AssociatedStudent");

export const AssociatedStudentPothosObject = AssociatedStudentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    status: t.exposeString("status"),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    teacherName: t.exposeString("teacherName", { nullable: true }),
    hoursPerWeek: t.exposeString("hoursPerWeek"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    language: t.exposeString("language", { nullable: true }),
    gender: t.exposeString("gender", { nullable: true }),
    version: t.exposeInt("version"),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── DeactivateParentResult Object ──────────────────────────────────────────

export type DeactivateParentResultDefinition = {
  id: string;
  userId: string;
  status: string;
};

const DeactivateParentResultRef =
  gqlSchemaBuilder.objectRef<DeactivateParentResultDefinition>("DeactivateParentResult");

export const DeactivateParentResultPothosObject = DeactivateParentResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    status: t.exposeString("status"),
  }),
});

// ─── EditQuotaResult Object ──────────────────────────────────────────────────

export type EditQuotaResultDefinition = {
  id: string;
  classesRemaining: number;
  classesTotal: number;
  version: number;
};

const EditQuotaResultRef = gqlSchemaBuilder.objectRef<EditQuotaResultDefinition>("EditQuotaResult");

export const EditQuotaResultPothosObject = EditQuotaResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    version: t.exposeInt("version"),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("parentProfile", t =>
  t.field({
    type: ParentProfileRef,
    nullable: true,
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.getProfile(ctx.user?.id || "", args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("parentAssociatedStudents", t =>
  t.field({
    type: [AssociatedStudentRef],
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.getAssociatedStudents(ctx.user?.id || "", args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("studentById", t =>
  t.field({
    type: AssociatedStudentRef,
    nullable: true,
    args: {
      studentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // Reusing AssociatedStudentRef but fetching a single one.
      // Need a student-specific service method or repository call.
      // AssociatedStudentResult is defined as { id, name, status, teacherName, ... }
      return ParentProfileService.getStudentById(ctx.user?.id || "", args.studentId, ctx.locale);
    },
  })
);

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("deactivateParent", t =>
  t.field({
    type: DeactivateParentResultRef,
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.deactivateAccount(ctx.user?.id || "", args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("updateStudentQuota", t =>
  t.field({
    type: EditQuotaResultRef,
    args: {
      studentId: t.arg.string({ required: true }),
      newClassesRemaining: t.arg.int({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      return StudentManagementService.editQuota(
        ctx.user?.id || "",
        args.studentId,
        args.newClassesRemaining,
        args.expectedVersion ?? undefined,
        ctx.locale
      );
    },
  })
);
