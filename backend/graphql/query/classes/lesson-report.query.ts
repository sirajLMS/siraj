import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  LessonReportPothosObject,
  PendingReviewCountPothosObject,
} from "@/backend/graphql/pothos/classes/lesson-report.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { LessonReportService } from "@/backend/services/classes/lesson-report.service";
import { PaginationArgs } from "@/backend/types";

gqlSchemaBuilder.queryField("lessonReport", t =>
  t.field({
    type: LessonReportPothosObject,
    nullable: true,
    description: "Get the lesson report for a specific class instance (if one has been submitted)",
    authScopes: { loggedIn: true },
    args: {
      classInstanceId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return LessonReportService.getReportByClassId(actorUserId, args.classInstanceId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("pendingLessonReports", t =>
  t.field({
    type: [LessonReportPothosObject],
    description: "Get pending lesson reports awaiting review with optional teacher/student filters and pagination",
    authScopes: { loggedIn: true },
    args: {
      teacherId: t.arg.id({ required: false }),
      studentId: t.arg.id({ required: false }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const filters: { teacherId?: string; studentId?: string } = {};
      if (args.teacherId) filters.teacherId = args.teacherId;
      if (args.studentId) filters.studentId = args.studentId;

      let pagination: PaginationArgs;
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
      } else {
        pagination = new PaginationArgs();
      }

      const result = await LessonReportService.getPendingReviews(actorUserId, filters, pagination, ctx.locale);
      return result.rows;
    },
  })
);

gqlSchemaBuilder.queryField("lessonReportCount", t =>
  t.field({
    type: PendingReviewCountPothosObject,
    description: "Get the count of pending lesson reports awaiting review with optional filters",
    authScopes: { loggedIn: true },
    args: {
      teacherId: t.arg.id({ required: false }),
      studentId: t.arg.id({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const filters: { teacherId?: string; studentId?: string } = {};
      if (args.teacherId) filters.teacherId = args.teacherId;
      if (args.studentId) filters.studentId = args.studentId;

      return LessonReportService.getPendingReviewCount(actorUserId, filters, ctx.locale);
    },
  })
);
