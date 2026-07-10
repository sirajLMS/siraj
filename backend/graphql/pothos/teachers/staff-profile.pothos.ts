import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AccountStatusPothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
  IanaTimezonePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type { TeacherProfileReturnType, TeacherProfileUpdateInputType } from "@/backend/types/teachers/teacher.types";

const TeacherProfileResultRef = gqlSchemaBuilder.objectRef<TeacherProfileReturnType>("TeacherProfileResult");

export const TeacherProfileResultPothosObject = TeacherProfileResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId", { authScopes: { superAdmin: true } }),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    phone: t.exposeString("phone", { nullable: true, authScopes: { superAdmin: true } }),
    nationalId: t.exposeString("nationalId", { nullable: true, authScopes: { superAdmin: true } }),
    dateOfBirth: t.exposeString("dateOfBirth", { nullable: true }),
    gender: t.expose("gender", { type: GenderPothosObject, nullable: true }),
    address: t.exposeString("address", { nullable: true, authScopes: { superAdmin: true } }),
    qualifications: t.exposeString("qualifications", { nullable: true }),
    timezone: t.expose("timezone", { type: IanaTimezonePothosObject }),
    hourlyRate: t.exposeString("hourlyRate", { nullable: true, authScopes: { superAdmin: true } }),
    rateCurrency: t.expose("rateCurrency", {
      type: CurrencyCodePothosObject,
      nullable: true,
      authScopes: { superAdmin: true },
    }),
    status: t.expose("status", { type: AccountStatusPothosObject }),
    updatedAt: t.exposeString("updatedAt"),
    totalClasses: t.exposeInt("totalClasses"),
    avgEngagementScore: t.exposeFloat("avgEngagementScore"),
  }),
});

export const TeacherProfileUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<TeacherProfileUpdateInputType>("TeacherProfileUpdateInput")
  .implement({
    fields: t => ({
      nationalId: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      phone: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      dateOfBirth: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      gender: t.field({ type: GenderPothosObject, required: false }),
      address: t.string({ required: false, directives: { constraint: { maxLength: 5000 } } }),
      qualifications: t.string({ required: false, directives: { constraint: { maxLength: 5000 } } }),
      timezone: t.field({ type: IanaTimezonePothosObject, required: false }),
      hourlyRate: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      rateCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
      status: t.field({ type: AccountStatusPothosObject, required: false }),
    }),
  });
