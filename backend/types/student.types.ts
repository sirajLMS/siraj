import type { students } from "@/backend/db/schema";
import type { AppLanguage, Gender, OrderSortDirection, StudentStatus } from "@/lib/enum";
import type { PageInfo } from "./pagination.types";

export type StudentEntity = typeof students.$inferSelect;
export type StudentEntityInput = typeof students.$inferInsert;

export type StudentDto = {
  id: number;
  parentId: number;
  primaryTeacherId: number | null;
  name: string;
  dateOfBirth: Date | null;
  gender: Gender | null;
  language: AppLanguage | null;
  status: StudentStatus;
  classesTotal: number;
  classesRemaining: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentCreateInput = {
  parentId: number;
  primaryTeacherId?: number | null;
  name: string;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  language?: AppLanguage | null;
  status: StudentStatus;
  classesTotal?: number;
  classesRemaining?: number;
};

export type PartialStudentUpdateInput = {
  id: number;
  parentId?: number | null;
  primaryTeacherId?: number | null;
  name?: string | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  language?: AppLanguage | null;
  status?: StudentStatus | null;
  classesTotal?: number | null;
  classesRemaining?: number | null;
};

export type StudentsWithFiltersResponse = {
  data: StudentDto[];
  pageInfo: PageInfo;
};

export type StudentFilterArgs = {
  name: string | null | undefined;
  nameNotContains: string | null | undefined;
  nameEquals: string | null | undefined;
  nameNotEquals: string | null | undefined;
  nameStartsWith: string | null | undefined;
  nameEndsWith: string | null | undefined;
  nameIsEmpty: boolean | null | undefined;
  nameIsNotEmpty: boolean | null | undefined;

  parentId: number | null | undefined;
  primaryTeacherId: number | null | undefined;
  gender: Gender | null | undefined;
  language: AppLanguage | null | undefined;
  status: StudentStatus | null | undefined;

  createdAt: Date | null | undefined;
  createdAtNot: Date | null | undefined;
  createdAtFrom: Date | null | undefined;
  createdAtTo: Date | null | undefined;
  createdAtAfter: Date | null | undefined;
  createdAtBefore: Date | null | undefined;
  createdAtOnOrAfter: Date | null | undefined;
  createdAtOnOrBefore: Date | null | undefined;
  createdAtIsEmpty: boolean | null | undefined;
  createdAtIsNotEmpty: boolean | null | undefined;

  birthDate: Date | null | undefined;
  birthDateNot: Date | null | undefined;
  birthDateFrom: Date | null | undefined;
  birthDateTo: Date | null | undefined;
  birthDateAfter: Date | null | undefined;
  birthDateBefore: Date | null | undefined;
  birthDateOnOrAfter: Date | null | undefined;
  birthDateOnOrBefore: Date | null | undefined;
  birthDateIsEmpty: boolean | null | undefined;
  birthDateIsNotEmpty: boolean | null | undefined;
};

export type StudentsOrderByClause = {
  column: StudentsOrderByColumn;
  order: OrderSortDirection | null | undefined;
};

export enum StudentsOrderByColumn {
  ID = "ID",
  NAME = "NAME",
  PARENT_ID = "PARENT_ID",
  DATE_OF_BIRTH = "DATE_OF_BIRTH",
  GENDER = "GENDER",
  STATUS = "STATUS",
  CLASSES_TOTAL = "CLASSES_TOTAL",
  CLASSES_REMAINING = "CLASSES_REMAINING",
  CREATED_AT = "CREATED_AT",
  UPDATED_AT = "UPDATED_AT",
}
