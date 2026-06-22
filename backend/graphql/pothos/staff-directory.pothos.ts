import { ManagerDirectoryService } from "@/backend/services/staff/manager-directory.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

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

export interface ManagerDirectoryRowDefinition {
  readonly id: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly skypeId: string | null;
  readonly status: string;
  readonly roleSlug: string | null;
  readonly roleName: string | null;
}

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

// ─── Queries ──────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("managerDirectory", t =>
  t.field({
    type: [ManagerDirectoryRowPothosObject],
    resolve: async (_root, _args, ctx) => {
      const locale = ctx.locale || "en";
      const userId = ctx.user?.id || "";

      const result = await ManagerDirectoryService.getManagerDirectory(userId, locale);

      return result.rows;
    },
    description: "Lists all staff members with administrative access.",
  })
);
