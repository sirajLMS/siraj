import { StudentDirectoryService } from "@/backend/services";
import {
  PaginationArgs,
  type StudentDirectory,
  type StudentDirectoryResult,
  type StudentFilterArgs,
  type StudentsOrderByClause,
} from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { requireAuth } from "../utils/requireAuth";
import { PageInfoObject, PaginationArgsObject } from "./pagination.objects";
import { StudentFilterArgsPothosObject, StudentsOrderByClausePothosObject } from "./student.pothos";

// ─── Object Types ─────────────────────────────────────────────────────────────

export const StudentDirectoryRowPothosObject = gqlSchemaBuilder
  .objectRef<StudentDirectory>("StudentDirectoryRow")
  .implement({
    fields: t => ({
      id: t.exposeString("id"),
      name: t.exposeString("name"),
      email: t.exposeString("email", { nullable: true }),
      avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
      status: t.exposeString("status"),
      classesRemaining: t.exposeInt("classesRemaining"),
      classesTotal: t.exposeInt("classesTotal"),
      hoursPerWeek: t.float({
        resolve: parent => parent.hoursPerWeek ?? 0,
      }),
      parentName: t.exposeString("parentName", { nullable: true }),
      teacherName: t.exposeString("teacherName", { nullable: true }),
      createdAt: t.expose("createdAt", { type: "DateTime" }),
      updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    }),
  });

const StudentDirectoryPayloadRef = gqlSchemaBuilder.objectRef<StudentDirectoryResult>("StudentDirectoryPayload");

export const StudentDirectoryPayloadPothosObject = StudentDirectoryPayloadRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [StudentDirectoryRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("studentDirectory", t =>
  t.field({
    type: StudentDirectoryPayloadPothosObject,
    authScopes: { loggedIn: true },
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
      filterArgs: t.arg({ type: StudentFilterArgsPothosObject, required: false }),
      orderBy: t.arg({ type: [StudentsOrderByClausePothosObject], required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const locale = ctx.locale || "en";

      // Construct PaginationArgs from GraphQL input
      let pagination: PaginationArgs | null = null;
      if (args.paginationArgs) {
        pagination = new PaginationArgs({
          first: args.paginationArgs.first ?? null,
          skip: args.paginationArgs.skip ?? null,
          after: args.paginationArgs.after ?? null,
          before: args.paginationArgs.before ?? null,
          last: args.paginationArgs.last ?? null,
          page: args.paginationArgs.page ?? null,
          maxCount: args.paginationArgs.maxCount ?? null,
        });
      }

      // Convert GraphQL filter args to typed Service args
      let filters: StudentFilterArgs | null = null;
      if (args.filterArgs) {
        filters = {
          name: args.filterArgs.name ?? undefined,
          nameNotContains: args.filterArgs.nameNotContains ?? undefined,
          nameEquals: args.filterArgs.nameEquals ?? undefined,
          nameNotEquals: args.filterArgs.nameNotEquals ?? undefined,
          nameStartsWith: args.filterArgs.nameStartsWith ?? undefined,
          nameEndsWith: args.filterArgs.nameEndsWith ?? undefined,
          nameIsEmpty: args.filterArgs.nameIsEmpty ?? undefined,
          nameIsNotEmpty: args.filterArgs.nameIsNotEmpty ?? undefined,
          parentId: args.filterArgs.parentId ?? undefined,
          primaryTeacherId: args.filterArgs.primaryTeacherId ?? undefined,
          gender: args.filterArgs.gender ?? undefined,
          language: args.filterArgs.language ?? undefined,
          status: args.filterArgs.status ?? undefined,
          createdAt: args.filterArgs.createdAt ?? undefined,
          createdAtNot: args.filterArgs.createdAtNot ?? undefined,
          createdAtFrom: args.filterArgs.createdAtFrom ?? undefined,
          createdAtTo: args.filterArgs.createdAtTo ?? undefined,
          createdAtAfter: args.filterArgs.createdAtAfter ?? undefined,
          createdAtBefore: args.filterArgs.createdAtBefore ?? undefined,
          createdAtOnOrAfter: args.filterArgs.createdAtOnOrAfter ?? undefined,
          createdAtOnOrBefore: args.filterArgs.createdAtOnOrBefore ?? undefined,
          createdAtIsEmpty: args.filterArgs.createdAtIsEmpty ?? undefined,
          createdAtIsNotEmpty: args.filterArgs.createdAtIsNotEmpty ?? undefined,
          birthDate: args.filterArgs.birthDate ?? undefined,
          birthDateNot: args.filterArgs.birthDateNot ?? undefined,
          birthDateFrom: args.filterArgs.birthDateFrom ?? undefined,
          birthDateTo: args.filterArgs.birthDateTo ?? undefined,
          birthDateAfter: args.filterArgs.birthDateAfter ?? undefined,
          birthDateBefore: args.filterArgs.birthDateBefore ?? undefined,
          birthDateOnOrAfter: args.filterArgs.birthDateOnOrAfter ?? undefined,
          birthDateOnOrBefore: args.filterArgs.birthDateOnOrBefore ?? undefined,
          birthDateIsEmpty: args.filterArgs.birthDateIsEmpty ?? undefined,
          birthDateIsNotEmpty: args.filterArgs.birthDateIsNotEmpty ?? undefined,
        };
      }

      // Convert orderBy clauses to typed Service args
      let orderBy: StudentsOrderByClause[] | null = null;
      if (args.orderBy) {
        orderBy = args.orderBy.map(clause => ({
          column: clause.column,
          order: clause.order ?? undefined,
        }));
      }

      const result = await StudentDirectoryService.getStudentDirectory(userId, pagination, filters, orderBy, locale);

      return {
        id: "student-directory",
        rows: result.rows,
        totalCount: result.totalCount,
        pageInfo: null,
      };
    },
    description: "Fetches the global student directory with cross-relational data.",
  })
);
