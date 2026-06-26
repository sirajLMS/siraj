import { ManagerDirectoryService } from "@/backend/services/staff/manager-directory.service";
import { PaginationArgs } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { PageInfoObject, PaginationArgsObject } from "./pagination.objects";

// ─── Object Types ─────────────────────────────────────────────────────────────

export type TeacherDirectoryRowDefinition = {
  id: string;
  index: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: string;
  zoomLink: string | null;
};

const TeacherDirectoryRowRef = gqlSchemaBuilder.objectRef<TeacherDirectoryRowDefinition>("TeacherDirectoryRow");

export const TeacherDirectoryRowPothosObject = TeacherDirectoryRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    index: t.exposeString("index"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl"),
    status: t.exposeString("status"),
    zoomLink: t.exposeString("zoomLink", { nullable: true }),
  }),
});

export type TeacherDirectoryMetricsDefinition = {
  id: string;
  activated: number;
  deactivated: number;
};

const TeacherDirectoryMetricsRef =
  gqlSchemaBuilder.objectRef<TeacherDirectoryMetricsDefinition>("TeacherDirectoryMetrics");

export const TeacherDirectoryMetricsPothosObject = TeacherDirectoryMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    activated: t.exposeInt("activated"),
    deactivated: t.exposeInt("deactivated"),
  }),
});

export type TeacherDirectoryDefinition = {
  id: string;
  metrics: TeacherDirectoryMetricsDefinition;
  rows: TeacherDirectoryRowDefinition[];
  totalTeachers: number;
};

const TeacherDirectoryRef = gqlSchemaBuilder.objectRef<TeacherDirectoryDefinition>("TeacherDirectory");

export const TeacherDirectoryPothosObject = TeacherDirectoryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: TeacherDirectoryMetricsPothosObject }),
    rows: t.expose("rows", { type: [TeacherDirectoryRowPothosObject] }),
    totalTeachers: t.exposeInt("totalTeachers"),
  }),
});

// ─── Manager Directory Types & Queries ──────────────────────────────────────────

export type ManagerDirectoryRowDefinition = {
  id: string;
  staffProfileId: string;
  name: string;
  email: string;
  phone: string | null;
  skypeId: string | null;
  status: string;
  roleSlug: string | null;
  roleName: string | null;
};

const ManagerDirectoryRowRef = gqlSchemaBuilder.objectRef<ManagerDirectoryRowDefinition>("ManagerDirectoryRow");

export const ManagerDirectoryRowPothosObject = ManagerDirectoryRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    staffProfileId: t.exposeString("staffProfileId"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    phone: t.exposeString("phone", { nullable: true }),
    skypeId: t.exposeString("skypeId", { nullable: true }),
    status: t.exposeString("status"),
    roleSlug: t.exposeString("roleSlug", { nullable: true }),
    roleName: t.exposeString("roleName", { nullable: true }),
  }),
});

export type ManagerDirectoryResultDefinition = {
  id: string;
  rows: ManagerDirectoryRowDefinition[];
  totalCount: number;
  pageInfo: import("@/backend/types").PageInfo | null;
};

const ManagerDirectoryResultRef =
  gqlSchemaBuilder.objectRef<ManagerDirectoryResultDefinition>("ManagerDirectoryResult");

export const ManagerDirectoryResultPothosObject = ManagerDirectoryResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ManagerDirectoryRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("managerDirectory", t =>
  t.field({
    type: ManagerDirectoryResultPothosObject,
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const locale = ctx.locale || "en";
      const userId = ctx.user?.id || "";

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

      const result = await ManagerDirectoryService.getManagerDirectory(userId, pagination, locale);

      return {
        id: "manager-directory",
        rows: result.rows,
        totalCount: result.totalCount,
        pageInfo: result.pageInfo,
      };
    },
    description: "Lists all staff members with administrative access.",
  })
);

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface UpdateManagerProfileInputDefinition {
  phone?: string | null;
  skypeId?: string | null;
}

export const UpdateManagerProfileInputPothosObject = gqlSchemaBuilder
  .inputRef<UpdateManagerProfileInputDefinition>("UpdateManagerProfileInput")
  .implement({
    fields: t => ({
      phone: t.string({ required: false }),
      skypeId: t.string({ required: false }),
    }),
  });

gqlSchemaBuilder.mutationField("updateManagerProfile", t =>
  t.field({
    type: ManagerDirectoryRowPothosObject,
    args: {
      staffProfileId: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateManagerProfileInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { ManagerProfileService } = await import("@/backend/services/staff/manager-profile.service");
      const locale = ctx.locale || "en";
      const actorUserId = ctx.user?.id || "";

      return await ManagerProfileService.updateManagerProfile(actorUserId, args.staffProfileId, args.input, locale);
    },
    description: "Updates a manager's profile fields.",
  })
);
