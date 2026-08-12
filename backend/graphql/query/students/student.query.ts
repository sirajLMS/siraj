import { StudentRepository } from "@/backend/db/repo/students";
import { AppLanguage } from "@/backend/enum/auth/auth.enum";
import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum";
import { Gender } from "@/backend/enum/users/user.enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import * as Pothos from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { StudentDirectoryService } from "@/backend/services";
import * as Types from "@/backend/types";
import { StudentUtils } from "@/backend/utils";

const STUDENTS_DIRECTORY_DEFAULT_LIMIT = 20;
const STUDENTS_DIRECTORY_MAX_LIMIT = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGender(value: unknown): value is Types.StudentFilterArgs["gender"] {
  return typeof value === "string" && (Object.values(Gender) as readonly string[]).includes(value);
}

function isAppLanguage(value: unknown): value is Types.StudentFilterArgs["language"] {
  return typeof value === "string" && (Object.values(AppLanguage) as readonly string[]).includes(value);
}

function isStudentStatus(value: unknown): value is Types.StudentFilterArgs["status"] {
  return typeof value === "string" && (Object.values(StudentStatus) as readonly string[]).includes(value);
}

function pickString(record: Record<string, unknown>, key: string): string | undefined {
  const val = record[key];
  return typeof val === "string" ? val : undefined;
}

function pickBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const val = record[key];
  return typeof val === "boolean" ? val : undefined;
}

function pickDate(record: Record<string, unknown>, key: string): Date | undefined {
  const val = record[key];
  return val instanceof Date ? val : undefined;
}

const EMPTY_STUDENT_FILTER_ARGS: Types.StudentFilterArgs = {
  name: undefined,
  nameNotContains: undefined,
  nameEquals: undefined,
  nameNotEquals: undefined,
  nameStartsWith: undefined,
  nameEndsWith: undefined,
  nameIsEmpty: undefined,
  nameIsNotEmpty: undefined,
  parentId: undefined,
  primaryTeacherId: undefined,
  gender: undefined,
  language: undefined,
  status: undefined,
  createdAt: undefined,
  createdAtNot: undefined,
  createdAtFrom: undefined,
  createdAtTo: undefined,
  createdAtAfter: undefined,
  createdAtBefore: undefined,
  createdAtOnOrAfter: undefined,
  createdAtOnOrBefore: undefined,
  createdAtIsEmpty: undefined,
  createdAtIsNotEmpty: undefined,
  birthDate: undefined,
  birthDateNot: undefined,
  birthDateFrom: undefined,
  birthDateTo: undefined,
  birthDateAfter: undefined,
  birthDateBefore: undefined,
  birthDateOnOrAfter: undefined,
  birthDateOnOrBefore: undefined,
  birthDateIsEmpty: undefined,
  birthDateIsNotEmpty: undefined,
};

function toStudentFilterArgs(value: unknown): Types.StudentFilterArgs {
  if (!isRecord(value)) return EMPTY_STUDENT_FILTER_ARGS;
  return {
    ...EMPTY_STUDENT_FILTER_ARGS,
    name: pickString(value, "name"),
    nameNotContains: pickString(value, "nameNotContains"),
    nameEquals: pickString(value, "nameEquals"),
    nameNotEquals: pickString(value, "nameNotEquals"),
    nameStartsWith: pickString(value, "nameStartsWith"),
    nameEndsWith: pickString(value, "nameEndsWith"),
    nameIsEmpty: pickBoolean(value, "nameIsEmpty"),
    nameIsNotEmpty: pickBoolean(value, "nameIsNotEmpty"),
    parentId: pickString(value, "parentId"),
    primaryTeacherId: pickString(value, "primaryTeacherId"),
    gender: isGender(value.gender) ? value.gender : undefined,
    language: isAppLanguage(value.language) ? value.language : undefined,
    status: isStudentStatus(value.status) ? value.status : undefined,
    createdAt: pickDate(value, "createdAt"),
    createdAtNot: pickDate(value, "createdAtNot"),
    createdAtFrom: pickDate(value, "createdAtFrom"),
    createdAtTo: pickDate(value, "createdAtTo"),
    createdAtAfter: pickDate(value, "createdAtAfter"),
    createdAtBefore: pickDate(value, "createdAtBefore"),
    createdAtOnOrAfter: pickDate(value, "createdAtOnOrAfter"),
    createdAtOnOrBefore: pickDate(value, "createdAtOnOrBefore"),
    createdAtIsEmpty: pickBoolean(value, "createdAtIsEmpty"),
    createdAtIsNotEmpty: pickBoolean(value, "createdAtIsNotEmpty"),
    birthDate: pickDate(value, "birthDate"),
    birthDateNot: pickDate(value, "birthDateNot"),
    birthDateFrom: pickDate(value, "birthDateFrom"),
    birthDateTo: pickDate(value, "birthDateTo"),
    birthDateAfter: pickDate(value, "birthDateAfter"),
    birthDateBefore: pickDate(value, "birthDateBefore"),
    birthDateOnOrAfter: pickDate(value, "birthDateOnOrAfter"),
    birthDateOnOrBefore: pickDate(value, "birthDateOnOrBefore"),
    birthDateIsEmpty: pickBoolean(value, "birthDateIsEmpty"),
    birthDateIsNotEmpty: pickBoolean(value, "birthDateIsNotEmpty"),
  };
}

function toStudentFilterArgsOrNull(value: unknown): Types.StudentFilterArgs | null {
  return value == null ? null : toStudentFilterArgs(value);
}

gqlSchemaBuilder.queryFields(t => ({
  student: t.field({
    type: Pothos.StudentPothosObject,
    nullable: true,
    authScopes: { permission: AppPermission.STUDENTS_LIST },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, args) =>
      await StudentRepository.findById(args.id).then(s => StudentUtils.mapEntityToDto(s)),
  }),

  students: t.field({
    type: Pothos.StudentsWithFiltersPothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.STUDENTS_LIST },
    args: {
      paginationArgs: t.arg({
        type: Pothos.PaginationArgsObject,
        required: false,
      }),
      orderBy: t.arg({
        type: [Pothos.StudentsOrderByClausePothosObject],
        required: false,
      }),
      filterArgs: t.arg({
        type: Pothos.StudentFilterArgsPothosObject,
        required: false,
      }),
    },
    resolve: async (_, args) =>
      await StudentRepository.fetchWithFilters(
        new Types.PaginationArgs({ ...args.paginationArgs }),
        toStudentFilterArgsOrNull(args.filterArgs)
      ),
  }),

  studentsDirectory: t.field({
    type: [Pothos.StudentDirectoryRowPothosObject],
    nullable: false,
    authScopes: { permission: AppPermission.STUDENTS_LIST },
    args: {
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      limit: t.arg.int({
        required: false,
        directives: { constraint: { min: 1, max: STUDENTS_DIRECTORY_MAX_LIMIT } },
      }),
    },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const limit = Math.min(args.limit ?? STUDENTS_DIRECTORY_DEFAULT_LIMIT, STUDENTS_DIRECTORY_MAX_LIMIT);
      const search = args.search?.trim();
      const filters: Types.StudentFilterArgs | null = search ? { ...EMPTY_STUDENT_FILTER_ARGS, name: search } : null;

      const result = await StudentDirectoryService.getStudentDirectory(
        userId,
        new Types.PaginationArgs({ first: limit, page: 1 }),
        tErrors,
        filters
      );

      return result.rows;
    },
    description: "Lightweight student list for autocomplete (id, name, avatarUrl).",
  }),
}));
