import { StudentRepository } from "@/backend/db/repo/student.repository";
import { OrderSortDirection } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppLanguagePothosObject,
  GenderPothosObject,
  OrderSortDirectionPothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/pagination.objects";
import type {
  PartialStudentUpdateInput,
  Student,
  StudentCreateInput,
  StudentFilterArgs,
  StudentsOrderByClause,
  StudentsWithFiltersResponse,
} from "@/backend/types";
import { StudentsOrderByColumn } from "@/backend/types";

export const StudentPothosObject = gqlSchemaBuilder
  .loadableObjectRef<Student, string>("Student", {
    load: async (ids: string[]) => StudentRepository.loadByIds(ids),
    sort: s => s.id,
  })
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      name: t.exposeString("name", { nullable: false }),
      email: t.exposeString("email"),
      dateOfBirth: t.expose("dateOfBirth", {
        type: "DateTime",
        nullable: true,
      }),
      avatarUrl: t.exposeString("avatarUrl"),
      parentId: t.exposeString("parentId", { nullable: false }),
      parentName: t.exposeString("parentName"),
      primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
      teacherName: t.exposeString("teacherName", { nullable: true }),
      gender: t.field({
        type: GenderPothosObject,
        nullable: true,
        resolve: s => s.gender,
      }),
      language: t.field({
        type: AppLanguagePothosObject,
        nullable: true,
        resolve: s => s.language,
      }),
      status: t.field({
        type: StudentStatusPothosObject,
        nullable: false,
        resolve: s => s.status,
      }),
      classesTotal: t.exposeInt("classesTotal", { nullable: false }),
      classesRemaining: t.exposeInt("classesRemaining", { nullable: false }),
      hoursPerWeek: t.float({
        resolve: s => s.hoursPerWeek ?? 0,
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
  .inputRef<StudentCreateInput>("StudentCreateInput")
  .implement({
    fields: t => ({
      parentId: t.string({ required: true }),
      primaryTeacherId: t.string({ required: false }),
      name: t.string({ required: true }),
      dateOfBirth: t.field({
        type: "DateTime",
        required: false,
      }),
      gender: t.field({
        type: GenderPothosObject,
        required: false,
      }),
      language: t.field({
        type: AppLanguagePothosObject,
        required: false,
      }),
      status: t.field({
        type: StudentStatusPothosObject,
        required: true,
      }),
      classesTotal: t.int({ required: false }),
      classesRemaining: t.int({ required: false }),
      idempotencyKey: t.string({ required: true }),
    }),
  });

export const PartialStudentUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<PartialStudentUpdateInput>("PartialStudentUpdateInput")
  .implement({
    fields: t => ({
      id: t.string({ required: true }),
      parentId: t.string({ required: false }),
      primaryTeacherId: t.string({ required: false }),
      name: t.string({ required: false }),
      dateOfBirth: t.field({
        type: "DateTime",
        required: false,
      }),
      gender: t.field({
        type: GenderPothosObject,
        required: false,
      }),
      language: t.field({
        type: AppLanguagePothosObject,
        required: false,
      }),
      status: t.field({
        type: StudentStatusPothosObject,
        required: false,
      }),
      classesTotal: t.int({ required: false }),
      classesRemaining: t.int({ required: false }),
    }),
  });

export const StudentsWithFiltersPothosObject = gqlSchemaBuilder
  .objectRef<StudentsWithFiltersResponse>("StudentsWithFiltersResponse")
  .implement({
    fields: t => ({
      data: t.expose("data", { type: [StudentPothosObject], nullable: false }),
      pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: false }),
    }),
  });

export const StudentFilterArgsPothosObject = gqlSchemaBuilder
  .inputRef<StudentFilterArgs>("StudentFilterArgs")
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

      parentId: t.string(),
      primaryTeacherId: t.string(),
      gender: t.field({ type: GenderPothosObject }),
      language: t.field({ type: AppLanguagePothosObject }),
      status: t.field({ type: StudentStatusPothosObject }),

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

export const StudentsOrderByColumnPothosObject = gqlSchemaBuilder.enumType(StudentsOrderByColumn, {
  name: "StudentsOrderByColumn",
});

export const StudentsOrderByClausePothosObject = gqlSchemaBuilder
  .inputRef<StudentsOrderByClause>("StudentsOrderByClause")
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
