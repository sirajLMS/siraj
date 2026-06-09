import { StudentRepository } from "@/backend/db/repo/student.repository";
import * as Types from "@/backend/types";
import { OrderSortDirection } from "@/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { CountryCodePothosObject, GenderPothosObject, OrderSortDirectionPothosObject, PageInfoObject } from "../pothos";

export const StudentPothosObject = gqlSchemaBuilder
  .loadableObjectRef<Types.StudentDto, number>("Student", {
    load: async (ids: number[]) => StudentRepository.loadByIds(ids),
    sort: s => s.id,
  })
  .implement({
    fields: t => ({
      id: t.exposeInt("id", { nullable: false }),
      name: t.exposeString("name", { nullable: false }),
      email: t.exposeString("email", {
        nullable: true,
      }),
      phoneNumber: t.expose("phoneNumber", {
        type: "PhoneNumber",
        nullable: true,
      }),
      gender: t.field({
        type: GenderPothosObject,
        nullable: true,
        resolve: s => s.gender,
      }),
      dateOfBirth: t.expose("dateOfBirth", {
        type: "DateTime",
        nullable: true,
      }),

      nationality: t.field({
        type: CountryCodePothosObject,
        nullable: true,
        resolve: s => s.nationality,
      }),

      createdAt: t.expose("createdAt", {
        type: "DateTime",
        nullable: true,
      }),
      updatedAt: t.expose("updatedAt", {
        type: "DateTime",
        nullable: true,
      }),
    }),
  });

export const StudentCreateInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StudentCreateInput>("StudentCreateInput")
  .implement({
    fields: t => ({
      name: t.string({ required: true }),
      email: t.field({
        type: "Email",
        required: false,
      }),
      phoneNumber: t.field({
        type: "PhoneNumber",
        required: false,
      }),
      dateOfBirth: t.field({
        type: "DateTime",
        required: false,
      }),
      gender: t.field({
        type: GenderPothosObject,
        required: false,
      }),
      nationality: t.field({
        type: CountryCodePothosObject,
        required: false,
      }),
    }),
  });

export const PartialStudentUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.PartialStudentUpdateInput>("PartialStudentUpdateInput")
  .implement({
    fields: t => ({
      id: t.int({ required: true }),
      name: t.string({ required: false }),
      email: t.field({
        type: "Email",
        required: false,
      }),
      phoneNumber: t.field({
        type: "PhoneNumber",
        required: false,
      }),
      dateOfBirth: t.field({
        type: "DateTime",
        required: false,
      }),
      gender: t.field({
        type: GenderPothosObject,
        required: false,
      }),
      nationality: t.field({
        type: CountryCodePothosObject,
        required: false,
      }),
    }),
  });

export const StudentsWithFiltersPothosObject = gqlSchemaBuilder
  .objectRef<Types.StudentsWithFiltersResponse>("StudentsWithFiltersResponse")
  .implement({
    fields: t => ({
      data: t.expose("data", { type: [StudentPothosObject], nullable: false }),
      pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: false }),
    }),
  });

export const StudentFilterArgsPothosObject = gqlSchemaBuilder
  .inputRef<Types.StudentFilterArgs>("StudentFilterArgs")
  .implement({
    fields: t => ({
      name: t.string(),
      nameNotContains: t.string(),
      nameEquals: t.string(),
      nameNotEquals: t.string(),
      nameStartsWith: t.string(),
      nameEndsWith: t.string(),
      nameIsEmpty: t.boolean(),
      nameIsNotEmpty: t.boolean(),

      email: t.string(),
      emailNotContains: t.string(),
      emailEquals: t.field({ type: "Email", required: false }),
      emailNotEquals: t.string(),
      emailStartsWith: t.string(),
      emailEndsWith: t.string(),
      emailIsEmpty: t.boolean(),
      emailIsNotEmpty: t.boolean(),

      phoneNumber: t.field({ type: "PhoneNumber" }),
      gender: t.field({ type: GenderPothosObject }),
      nationality: t.field({ type: CountryCodePothosObject }),

      createdAt: t.field({ type: "DateTime" }),
      createdAtNot: t.field({ type: "DateTime" }),
      createdAtFrom: t.field({ type: "DateTime" }),
      createdAtTo: t.field({ type: "DateTime" }),
      createdAtAfter: t.field({ type: "DateTime" }),
      createdAtBefore: t.field({ type: "DateTime" }),
      createdAtOnOrAfter: t.field({ type: "DateTime" }),
      createdAtOnOrBefore: t.field({ type: "DateTime" }),
      createdAtIsEmpty: t.boolean(),
      createdAtIsNotEmpty: t.boolean(),

      birthDate: t.field({ type: "DateTime" }),
      birthDateNot: t.field({ type: "DateTime" }),
      birthDateFrom: t.field({ type: "DateTime" }),
      birthDateTo: t.field({ type: "DateTime" }),
      birthDateAfter: t.field({ type: "DateTime" }),
      birthDateBefore: t.field({ type: "DateTime" }),
      birthDateOnOrAfter: t.field({ type: "DateTime" }),
      birthDateOnOrBefore: t.field({ type: "DateTime" }),
      birthDateIsEmpty: t.boolean(),
      birthDateIsNotEmpty: t.boolean(),
    }),
  });

export const StudentsOrderByColumnPothosObject = gqlSchemaBuilder.enumType("StudentsOrderByColumn", {
  values: Object.values(Types.StudentsOrderByColumn),
});

export const StudentsOrderByClausePothosObject = gqlSchemaBuilder
  .inputRef<Types.StudentsOrderByClause>("StudentsOrderByClause")
  .implement({
    fields: t => ({
      column: t.field({
        type: StudentsOrderByColumnPothosObject,
        required: true,
      }),
      order: t.field({
        type: OrderSortDirectionPothosObject,
        required: false,
        defaultValue: OrderSortDirection.ASC,
      }),
    }),
  });
