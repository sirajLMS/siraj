import type { students } from "@/backend/db/schema";
import type { CountryCode, Gender, OrderSortDirection } from "@/lib/enum";
import type { Email, PhoneNumber } from "../lib";
import type { PageInfo } from "./pagination.types";

export type StudentEntity = typeof students.$inferSelect;
export type StudentEntityInput = typeof students.$inferInsert;

export type StudentDto = {
  id: number;
  name: string;
  email?: string | null;
  phoneNumber?: PhoneNumber | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  nationality?: CountryCode | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentCreateInput = {
  name: string;
  email?: Email | null;
  phoneNumber?: PhoneNumber | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  nationality?: CountryCode | null;
};

export type PartialStudentUpdateInput = {
  id: number;
  name?: string | null;
  email?: Email | null;
  phoneNumber?: PhoneNumber | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  nationality?: CountryCode | null;
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

  email: string | null | undefined;
  emailNotContains: string | null | undefined;
  emailEquals: Email | null | undefined;
  emailNotEquals: string | null | undefined;
  emailStartsWith: string | null | undefined;
  emailEndsWith: string | null | undefined;
  emailIsEmpty: boolean | null | undefined;
  emailIsNotEmpty: boolean | null | undefined;

  phoneNumber: PhoneNumber | null | undefined;
  gender: Gender | null | undefined;
  nationality: CountryCode | null | undefined;

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

/**
 * Represents a clause for ordering student results.
 */
export type StudentsOrderByClause = {
  column: StudentsOrderByColumn;
  order: OrderSortDirection | null | undefined;
};

export enum StudentsOrderByColumn {
  ID = "ID",
  NAME = "NAME",
  EMAIL = "EMAIL",
  DATE_OF_BIRTH = "DATE_OF_BIRTH",
  GENDER = "GENDER",
  CREATED_AT = "CREATED_AT",
  UPDATED_AT = "UPDATED_AT",
}
