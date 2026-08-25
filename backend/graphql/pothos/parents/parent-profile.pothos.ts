import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  AccountStatusPothosObject,
  CurrencyCodePothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  AssociatedStudentResult,
  DeactivateParentResult,
  EditQuotaResult,
  ParentProfileResult,
  ReactivateParentResult,
} from "@/backend/types";

// ─── ParentProfile Object ───────────────────────────────────────────────────

export const ParentProfileRef = gqlSchemaBuilder.objectRef<ParentProfileResult>("ParentProfile");

export const ParentProfilePothosObject = ParentProfileRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId", { authScopes: { superAdmin: true } }),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    lifecycleStatus: t.exposeString("lifecycleStatus"),
    accountStatus: t.expose("accountStatus", { type: AccountStatusPothosObject }),
    phone: t.exposeString("phone", { nullable: true }),
    nationality: t.exposeString("nationality", { nullable: true }),
    address: t.exposeString("address", { nullable: true }),
    facebook: t.exposeString("facebook", { nullable: true }),
    whatsapp: t.exposeString("whatsapp", { nullable: true }),
    twitter: t.exposeString("twitter", { nullable: true }),
    invoiceType: t.exposeString("invoiceType", { nullable: true }),
    feeAmount: t.exposeString("feeAmount", { nullable: true }),
    currency: t.expose("currency", { type: CurrencyCodePothosObject, nullable: true }),
    timezone: t.expose("timezone", { type: "IanaTimezone" }),
    displayAmount: t.expose("displayAmount", {
      type: DisplayAmountPothosObject,
      nullable: true,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── AssociatedStudent Object ────────────────────────────────────────────────

export const AssociatedStudentRef = gqlSchemaBuilder.objectRef<AssociatedStudentResult>("AssociatedStudent");

export const AssociatedStudentPothosObject = AssociatedStudentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    status: t.expose("status", { type: StudentStatusPothosObject }),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    teacherUserId: t.exposeString("teacherUserId", { nullable: true }),
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

export const DeactivateParentResultRef = gqlSchemaBuilder.objectRef<DeactivateParentResult>("DeactivateParentResult");

export const DeactivateParentResultPothosObject = DeactivateParentResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    accountStatus: t.expose("accountStatus", { type: AccountStatusPothosObject }),
  }),
});

export const ReactivateParentResultRef = gqlSchemaBuilder.objectRef<ReactivateParentResult>("ReactivateParentResult");

export const ReactivateParentResultPothosObject = ReactivateParentResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    accountStatus: t.expose("accountStatus", { type: AccountStatusPothosObject }),
  }),
});

// ─── EditQuotaResult Object ──────────────────────────────────────────────────

export const EditQuotaResultRef = gqlSchemaBuilder.objectRef<EditQuotaResult>("EditQuotaResult");

export const EditQuotaResultPothosObject = EditQuotaResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    version: t.exposeInt("version"),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

// ─── Mutations ───────────────────────────────────────────────────────────────
