import { StudentRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import * as Pothos from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { StudentDirectoryService } from "@/backend/services";
import * as Types from "@/backend/types";
import { StudentUtils } from "@/backend/utils";

const STUDENTS_DIRECTORY_DEFAULT_LIMIT = 20;
const STUDENTS_DIRECTORY_MAX_LIMIT = 100;

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
        args.filterArgs as unknown as Types.StudentFilterArgs
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
      const filters = (search ? { name: search } : null) as Types.StudentFilterArgs | null;

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
