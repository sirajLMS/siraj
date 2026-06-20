import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

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
