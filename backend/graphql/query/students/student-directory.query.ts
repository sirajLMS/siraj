// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import {
  StudentFilterArgsPothosObject,
  StudentsOrderByClausePothosObject,
} from "@/backend/graphql/pothos/students/student.pothos";
import { StudentDirectoryPayloadPothosObject } from "@/backend/graphql/pothos/students/student-directory.pothos";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { toStudentFilterArgsOrNull } from "@/backend/graphql/utils/student-filter.utils";
import { StudentDirectoryService } from "@/backend/services";
import type { StudentsOrderByClause } from "@/backend/types";

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
      const tErrors = ctx.t().errorsTranslations;

      const pagination = parsePaginationArgs(args.paginationArgs);

      // Convert GraphQL filter args to typed Service args
      const filters = toStudentFilterArgsOrNull(args.filterArgs);

      // Convert orderBy clauses to typed Service args
      let orderBy: StudentsOrderByClause[] | null = null;
      if (args.orderBy) {
        orderBy = args.orderBy.map(clause => ({
          column: clause.column,
          order: clause.order ?? undefined,
        }));
      }

      const result = await StudentDirectoryService.getStudentDirectory(userId, pagination, tErrors, filters, orderBy);

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
